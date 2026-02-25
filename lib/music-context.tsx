import React, { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo, ReactNode } from 'react';
import { Audio } from 'expo-av';
import * as MediaLibrary from 'expo-media-library';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, NativeModules } from 'react-native';
import { Track, Album, Artist, RepeatMode, getFormatFromFilename } from './types';
import MusicInfo from 'expo-music-info-2';
import * as FileSystem from 'expo-file-system/legacy';
import { cleanTrackTitle } from './utils';

function estimateAudioQuality(format: string, duration: number, fileSize?: number): { bitrate: number; sampleRate: number; bitDepth: number; channels: number } {
  const fmt = format?.toUpperCase() || '';

  if (fileSize && duration > 0) {
    const bitrateCalc = Math.round((fileSize * 8) / (duration * 1000));
    const isLossless = ['FLAC', 'WAV', 'AIFF', 'ALAC'].includes(fmt);

    if (isLossless) {
      if (bitrateCalc > 2000) return { bitrate: bitrateCalc, sampleRate: 96000, bitDepth: 24, channels: 2 };
      if (bitrateCalc > 1500) return { bitrate: bitrateCalc, sampleRate: 48000, bitDepth: 24, channels: 2 };
      return { bitrate: bitrateCalc || 1411, sampleRate: 44100, bitDepth: 16, channels: 2 };
    }

    return {
      bitrate: bitrateCalc,
      sampleRate: bitrateCalc > 200 ? 48000 : 44100,
      bitDepth: 16,
      channels: 2,
    };
  }

  const defaults: Record<string, { bitrate: number; sampleRate: number; bitDepth: number }> = {
    'FLAC': { bitrate: 1411, sampleRate: 44100, bitDepth: 24 },
    'WAV': { bitrate: 1411, sampleRate: 44100, bitDepth: 16 },
    'AIFF': { bitrate: 1411, sampleRate: 44100, bitDepth: 16 },
    'ALAC': { bitrate: 1411, sampleRate: 44100, bitDepth: 24 },
    'AAC': { bitrate: 256, sampleRate: 44100, bitDepth: 16 },
    'MP3': { bitrate: 320, sampleRate: 44100, bitDepth: 16 },
    'OGG': { bitrate: 192, sampleRate: 44100, bitDepth: 16 },
    'OPUS': { bitrate: 128, sampleRate: 48000, bitDepth: 16 },
    'WMA': { bitrate: 192, sampleRate: 44100, bitDepth: 16 },
  };

  const d = defaults[fmt] || { bitrate: 192, sampleRate: 44100, bitDepth: 16 };
  return { ...d, channels: 2 };
}

const DEMO_TRACKS: Track[] = [
  { id: '1', uri: '', title: 'Midnight Drive', artist: '', album: '', duration: 234, format: 'MP3', filename: 'midnight_drive.mp3' },
  { id: '2', uri: '', title: 'Ocean Waves', artist: '', album: '', duration: 312, format: 'FLAC', filename: 'ocean_waves.flac' },
  { id: '3', uri: '', title: 'Electric Soul', artist: '', album: '', duration: 198, format: 'AAC', filename: 'electric_soul.m4a' },
  { id: '4', uri: '', title: 'Dawn Chorus', artist: '', album: '', duration: 276, format: 'FLAC', filename: 'dawn_chorus.flac' },
  { id: '5', uri: '', title: 'City Lights', artist: '', album: '', duration: 245, format: 'MP3', filename: 'city_lights.mp3' },
  { id: '6', uri: '', title: 'Neon Rain', artist: '', album: '', duration: 289, format: 'MP3', filename: 'neon_rain.mp3' },
  { id: '7', uri: '', title: 'Deep Blue', artist: '', album: '', duration: 420, format: 'FLAC', filename: 'deep_blue.flac' },
  { id: '8', uri: '', title: 'Pulse', artist: '', album: '', duration: 210, format: 'AAC', filename: 'pulse.m4a' },
  { id: '9', uri: '', title: 'Starlight', artist: '', album: '', duration: 356, format: 'FLAC', filename: 'starlight.flac' },
  { id: '10', uri: '', title: 'Solar Wind', artist: '', album: '', duration: 298, format: 'MP3', filename: 'solar_wind.mp3' },
  { id: '11', uri: '', title: 'Gravity', artist: '', album: '', duration: 267, format: 'MP3', filename: 'gravity.mp3' },
  { id: '12', uri: '', title: 'Echoes', artist: '', album: '', duration: 332, format: 'AAC', filename: 'echoes.m4a' },
];

interface MusicContextValue {
  tracks: Track[];
  albums: Album[];
  artists: Artist[];
  currentTrack: Track | null;
  isPlaying: boolean;
  position: number;
  duration: number;
  shuffle: boolean;
  repeatMode: RepeatMode;
  queue: Track[];
  isLoading: boolean;
  isFetchingMetadata: boolean;
  hasPermission: boolean;
  requestPermission: () => Promise<void>;
  playTrack: (track: Track) => void;
  togglePlayPause: () => void;
  seekTo: (position: number) => void;
  skipNext: () => void;
  skipPrevious: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  playAlbum: (album: Album) => void;
  scanLibrary: () => Promise<void>;
}

const MusicContext = createContext<MusicContextValue | null>(null);

export function MusicProvider({ children }: { children: ReactNode }) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [shuffle, setShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [queue, setQueue] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);
  const positionInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const metadataFetchRef = useRef(false);

  const albums = useMemo(() => {
    const albumMap = new Map<string, Album>();
    tracks.forEach(track => {
      const albumName = track.album || 'Unknown Album';
      const artistName = track.artist || 'Unknown Artist';
      const key = `${albumName}-${artistName}`;
      if (!albumMap.has(key)) {
        albumMap.set(key, {
          id: key,
          name: albumName,
          artist: artistName,
          artwork: track.artwork,
          tracks: [],
        });
      }
      albumMap.get(key)!.tracks.push(track);
      if (track.artwork && !albumMap.get(key)!.artwork) {
        albumMap.get(key)!.artwork = track.artwork;
      }
    });
    return Array.from(albumMap.values());
  }, [tracks]);

  const artists = useMemo(() => {
    const artistMap = new Map<string, Artist>();
    tracks.forEach(track => {
      const name = track.artist || 'Unknown Artist';
      if (!artistMap.has(name)) {
        artistMap.set(name, {
          id: name,
          name: name,
          artwork: track.artwork,
          albums: [],
          trackCount: 0,
        });
      }
      artistMap.get(name)!.trackCount++;
    });
    albums.forEach(album => {
      const artist = artistMap.get(album.artist);
      if (artist && !artist.albums.find(a => a.id === album.id)) {
        artist.albums.push(album);
        if (album.artwork && !artist.artwork) {
          artist.artwork = album.artwork;
        }
      }
    });
    return Array.from(artistMap.values());
  }, [tracks, albums]);

  const fetchMetadataForTracks = useCallback(async (trackList: Track[]) => {
    if (metadataFetchRef.current) return;
    metadataFetchRef.current = true;
    setIsFetchingMetadata(true);

    try {
      const cachedStr = await AsyncStorage.getItem('track_metadata_v10');
      const cache: Record<string, any> = cachedStr ? JSON.parse(cachedStr) : {};

      const unfetched = trackList.filter(t => !cache[t.id] && !t.metadataFetched);
      if (unfetched.length === 0) {
        const updated = trackList.map(t => {
          const c = cache[t.id];
          if (c) {
            const quality = estimateAudioQuality(t.format || '', t.duration, c.fileSize || t.fileSize);
            return {
              ...t,
              artist: c.artist || t.artist,
              album: c.album || t.album,
              artwork: c.coverArt || t.artwork,
              bitrate: c.bitrate || quality.bitrate,
              sampleRate: c.sampleRate || quality.sampleRate,
              bitDepth: c.bitDepth || quality.bitDepth,
              channels: c.channels || quality.channels,
              metadataFetched: true,
            };
          }
          const quality = estimateAudioQuality(t.format || '', t.duration, t.fileSize);
          return { ...t, bitrate: t.bitrate || quality.bitrate, sampleRate: t.sampleRate || quality.sampleRate, bitDepth: t.bitDepth || quality.bitDepth, channels: t.channels || quality.channels };
        });
        setTracks(updated);
        setIsFetchingMetadata(false);
        metadataFetchRef.current = false;
        return;
      }

      const batchSize = 3;

      for (let i = 0; i < unfetched.length; i += batchSize) {
        const batch = unfetched.slice(i, i + batchSize);

        try {
          if (Platform.OS === 'web') {
            // Web fallback: Just marking as fetched to avoid loops
            for (const t of batch) {
              cache[t.id] = { _notFound: true };
            }
          } else {
            for (const t of batch) {
              if (t.uri && !cache[t.id]) {
                // @ts-ignore - The types for expo-music-info-2 are incorrect, it has this static method
                const info = await MusicInfo.getMusicInfoAsync(t.uri, {
                  title: true,
                  artist: true,
                  album: true,
                  picture: true
                });

                let cleanedTitle = cleanTrackTitle(info?.title || t.title);
                let finalArtist = info?.artist || t.artist || '';
                let artworkUri: string | null = null;

                if (info) {
                  console.log(`[MusicInfo] Extracted info for ${cleanedTitle}: HasPicture=${!!info.picture?.pictureData}, Len=${info.picture?.pictureData?.length || 0}`);

                  // 1. Try local embedded artwork
                  if (info.picture?.pictureData) {
                    const safeName = t.id.toString().replace(/[^a-zA-Z0-9]/g, '');
                    const fileUri = `${FileSystem.documentDirectory}artwork_${safeName}_v10.jpg`;
                    try {
                      let base64Data = info.picture.pictureData.split(',').pop() || '';
                      // Remove any whitespaces/newlines/invalid chars that might corrupt the base64 payload
                      base64Data = base64Data.replace(/[^A-Za-z0-9+/=]/g, '');

                      await FileSystem.writeAsStringAsync(fileUri, base64Data, {
                        encoding: FileSystem.EncodingType.Base64,
                      });
                      artworkUri = fileUri;
                    } catch (e) {
                      console.warn('Failed to save embedded artwork to disk', e);
                    }
                  }
                }

                // 2. Fallback to iTunes API if no embedded artwork is found (or if info extraction completely failed)
                if (!artworkUri && cleanedTitle) {
                  try {
                    const query = encodeURIComponent(`${cleanedTitle} ${finalArtist}`.trim());
                    const response = await fetch(`https://itunes.apple.com/search?term=${query}&entity=song&limit=1`);
                    const data = await response.json();

                    if (data.results && data.results.length > 0) {
                      const result = data.results[0];
                      // Get 600x600 high res image instead of 100x100
                      const remoteArtworkUrl = result.artworkUrl100?.replace('100x100bb', '600x600bb');

                      if (remoteArtworkUrl) {
                        const safeName = t.id.toString().replace(/[^a-zA-Z0-9]/g, '');
                        const fileUri = `${FileSystem.documentDirectory}artwork_itunes_${safeName}_v10.jpg`;

                        const downloadResult = await FileSystem.downloadAsync(remoteArtworkUrl, fileUri);
                        if (downloadResult.status === 200) {
                          artworkUri = downloadResult.uri;
                          console.log(`[iTunes] Successfully downloaded artwork for ${cleanedTitle}`);
                        }
                      }
                    }
                  } catch (e) {
                    console.warn(`[iTunes] Failed to fetch artwork for ${cleanedTitle}`, e);
                  }
                }

                cache[t.id] = {
                  title: cleanedTitle,
                  artist: finalArtist,
                  album: info?.album || '',
                  coverArt: artworkUri,
                  _notFound: !info && !artworkUri, // Only mark as truly not found if BOTH local extraction AND iTunes failed completely.
                };
              }
            }
          }

          await AsyncStorage.setItem('track_metadata_v10', JSON.stringify(cache));

          setTracks(prev => prev.map(t => {
            const c = cache[t.id];
            if (c && !c._notFound) {
              const quality = estimateAudioQuality(t.format || '', t.duration, t.fileSize);
              return {
                ...t,
                title: c.title || t.title,
                artist: c.artist || t.artist,
                album: c.album || t.album,
                artwork: c.coverArt || t.artwork,
                bitrate: t.bitrate || quality.bitrate,
                sampleRate: t.sampleRate || quality.sampleRate,
                bitDepth: t.bitDepth || quality.bitDepth,
                channels: t.channels || quality.channels,
                metadataFetched: true,
              };
            }
            if (!t.bitrate) {
              const quality = estimateAudioQuality(t.format || '', t.duration, t.fileSize);
              return { ...t, bitrate: quality.bitrate, sampleRate: quality.sampleRate, bitDepth: quality.bitDepth, channels: quality.channels, metadataFetched: true };
            }
            return { ...t, metadataFetched: true };
          }));
        } catch (err) {
          console.warn('Local metadata fetch error:', err);
          setTracks(prev => prev.map(t => {
            if (!t.bitrate) {
              const quality = estimateAudioQuality(t.format || '', t.duration, t.fileSize);
              return { ...t, bitrate: quality.bitrate, sampleRate: quality.sampleRate, bitDepth: quality.bitDepth, channels: quality.channels };
            }
            return t;
          }));
        }

        if (i + batchSize < unfetched.length) {
          // Give UI thread time to breathe
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
    } catch (err) {
      console.error('Metadata fetch error:', err);
    }

    setIsFetchingMetadata(false);
    metadataFetchRef.current = false;
  }, []);

  const requestPermission = useCallback(async () => {
    if (Platform.OS === 'web') {
      setHasPermission(true);
      const withQuality = DEMO_TRACKS.map(t => {
        const q = estimateAudioQuality(t.format || '', t.duration, t.fileSize);
        return { ...t, bitrate: q.bitrate, sampleRate: q.sampleRate, bitDepth: q.bitDepth, channels: q.channels };
      });
      setTracks(withQuality);
      setIsLoading(false);
      fetchMetadataForTracks(withQuality);
      return;
    }
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      setHasPermission(status === 'granted');
      if (status === 'granted') {
        await scanLibraryInternal();
      } else {
        setIsLoading(false);
      }
    } catch (err) {
      console.warn('Granular audio permission failed, trying fallback:', err);
      try {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        setHasPermission(status === 'granted');
        if (status === 'granted') {
          await scanLibraryInternal();
        } else {
          setIsLoading(false);
        }
      } catch (err2) {
        console.warn('All media library permission attempts failed:', err2);
        setHasPermission(false);
        setIsLoading(false);
      }
    }
  }, []);

  const scanLibraryInternal = useCallback(async () => {
    setIsLoading(true);
    try {
      const media = await MediaLibrary.getAssetsAsync({
        mediaType: MediaLibrary.MediaType.audio,
        first: 500,
        sortBy: [MediaLibrary.SortBy.default],
      });

      const scannedTracks: Track[] = media.assets.map(asset => {
        const format = getFormatFromFilename(asset.filename);
        const quality = estimateAudioQuality(format, asset.duration);
        return {
          id: asset.id,
          uri: asset.uri,
          title: asset.filename.replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
          artist: '',
          album: '',
          duration: asset.duration,
          format,
          filename: asset.filename,
          bitrate: quality.bitrate,
          sampleRate: quality.sampleRate,
          bitDepth: quality.bitDepth,
          channels: quality.channels,
        };
      });

      setTracks(scannedTracks);
      setIsLoading(false);
      fetchMetadataForTracks(scannedTracks);
    } catch (err) {
      console.error('Error scanning library:', err);
      setIsLoading(false);
    }
  }, [fetchMetadataForTracks]);

  const scanLibrary = useCallback(async () => {
    if (Platform.OS === 'web') {
      metadataFetchRef.current = false;
      const withQuality = DEMO_TRACKS.map(t => {
        const q = estimateAudioQuality(t.format || '', t.duration, t.fileSize);
        return { ...t, bitrate: q.bitrate, sampleRate: q.sampleRate, bitDepth: q.bitDepth, channels: q.channels };
      });
      setTracks(withQuality);
      setIsLoading(false);
      fetchMetadataForTracks(withQuality);
      return;
    }
    try {
      await scanLibraryInternal();
    } catch (err) {
      console.warn('Scan failed, using demo data:', err);
      const withQuality = DEMO_TRACKS.map(t => {
        const q = estimateAudioQuality(t.format || '', t.duration, t.fileSize);
        return { ...t, bitrate: q.bitrate, sampleRate: q.sampleRate, bitDepth: q.bitDepth, channels: q.channels };
      });
      setTracks(withQuality);
      setIsLoading(false);
      fetchMetadataForTracks(withQuality);
    }
  }, [scanLibraryInternal, fetchMetadataForTracks]);

  useEffect(() => {
    const init = async () => {
      await Audio.setAudioModeAsync({
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
      });

      if (Platform.OS === 'web') {
        setHasPermission(true);
        const withQuality = DEMO_TRACKS.map(t => {
          const q = estimateAudioQuality(t.format || '', t.duration, t.fileSize);
          return { ...t, bitrate: q.bitrate, sampleRate: q.sampleRate, bitDepth: q.bitDepth, channels: q.channels };
        });
        setTracks(withQuality);
        setIsLoading(false);
        fetchMetadataForTracks(withQuality);
      } else {
        try {
          const { status } = await MediaLibrary.getPermissionsAsync();
          setHasPermission(status === 'granted');
          if (status === 'granted') {
            await scanLibraryInternal();
          } else {
            setIsLoading(false);
          }
        } catch (err) {
          console.warn('Granular getPermissions failed, trying fallback:', err);
          try {
            const { status } = await MediaLibrary.getPermissionsAsync();
            setHasPermission(status === 'granted');
            if (status === 'granted') {
              await scanLibraryInternal();
            } else {
              setIsLoading(false);
            }
          } catch (err2) {
            console.warn('All permission checks failed:', err2);
            setHasPermission(false);
            setIsLoading(false);
          }
        }
      }
    };
    init();

    return () => {
      if (positionInterval.current) clearInterval(positionInterval.current);
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const startPositionTracking = useCallback(() => {
    if (positionInterval.current) clearInterval(positionInterval.current);
    positionInterval.current = setInterval(async () => {
      if (soundRef.current) {
        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded) {
          setPosition(status.positionMillis / 1000);
          if (status.didJustFinish) {
            skipNextInternal();
          }
        }
      }
    }, 250);
  }, []);

  const playTrack = useCallback(async (track: Track) => {
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }
      if (positionInterval.current) clearInterval(positionInterval.current);

      setCurrentTrack(track);
      setPosition(0);
      setDuration(track.duration);

      if (Platform.OS === 'web' && !track.uri) {
        setIsPlaying(true);
        positionInterval.current = setInterval(() => {
          setPosition(prev => {
            if (prev >= track.duration) {
              setIsPlaying(false);
              return 0;
            }
            return prev + 0.25;
          });
        }, 250);
        return;
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: track.uri },
        { shouldPlay: true }
      );
      soundRef.current = sound;
      setIsPlaying(true);
      startPositionTracking();
    } catch (err) {
      console.error('Error playing track:', err);
    }
  }, [startPositionTracking]);

  const togglePlayPause = useCallback(async () => {
    if (Platform.OS === 'web' && currentTrack && !currentTrack.uri) {
      setIsPlaying(prev => !prev);
      return;
    }
    if (!soundRef.current) return;
    const status = await soundRef.current.getStatusAsync();
    if (status.isLoaded) {
      if (status.isPlaying) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
      } else {
        await soundRef.current.playAsync();
        setIsPlaying(true);
      }
    }
  }, [currentTrack]);

  const seekTo = useCallback(async (pos: number) => {
    setPosition(pos);
    if (Platform.OS === 'web' && currentTrack && !currentTrack.uri) return;
    if (soundRef.current) {
      await soundRef.current.setPositionAsync(pos * 1000);
    }
  }, [currentTrack]);

  const skipNextInternal = useCallback(() => {
    if (queue.length === 0 && tracks.length === 0) return;
    const list = queue.length > 0 ? queue : tracks;
    const currentIdx = list.findIndex(t => t.id === currentTrack?.id);

    if (repeatMode === 'one' && currentTrack) {
      playTrack(currentTrack);
      return;
    }

    let nextIdx: number;
    if (shuffle) {
      nextIdx = Math.floor(Math.random() * list.length);
    } else {
      nextIdx = currentIdx + 1;
      if (nextIdx >= list.length) {
        if (repeatMode === 'all') nextIdx = 0;
        else return;
      }
    }
    playTrack(list[nextIdx]);
  }, [queue, tracks, currentTrack, shuffle, repeatMode, playTrack]);

  const skipNext = useCallback(() => {
    skipNextInternal();
  }, [skipNextInternal]);

  const skipPrevious = useCallback(() => {
    if (position > 3) {
      seekTo(0);
      return;
    }
    const list = queue.length > 0 ? queue : tracks;
    const currentIdx = list.findIndex(t => t.id === currentTrack?.id);
    let prevIdx = currentIdx - 1;
    if (prevIdx < 0) {
      if (repeatMode === 'all') prevIdx = list.length - 1;
      else prevIdx = 0;
    }
    playTrack(list[prevIdx]);
  }, [queue, tracks, currentTrack, position, repeatMode, seekTo, playTrack]);

  const toggleShuffle = useCallback(() => {
    setShuffle(prev => !prev);
  }, []);

  const toggleRepeat = useCallback(() => {
    setRepeatMode(prev => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  }, []);

  const playAlbum = useCallback((album: Album) => {
    setQueue(album.tracks);
    if (album.tracks.length > 0) {
      playTrack(album.tracks[0]);
    }
  }, [playTrack]);

  const value = useMemo(() => ({
    tracks,
    albums,
    artists,
    currentTrack,
    isPlaying,
    position,
    duration,
    shuffle,
    repeatMode,
    queue,
    isLoading,
    isFetchingMetadata,
    hasPermission,
    requestPermission,
    playTrack,
    togglePlayPause,
    seekTo,
    skipNext,
    skipPrevious,
    toggleShuffle,
    toggleRepeat,
    playAlbum,
    scanLibrary,
  }), [tracks, albums, artists, currentTrack, isPlaying, position, duration, shuffle, repeatMode, queue, isLoading, isFetchingMetadata, hasPermission, requestPermission, playTrack, togglePlayPause, seekTo, skipNext, skipPrevious, toggleShuffle, toggleRepeat, playAlbum, scanLibrary]);

  return (
    <MusicContext.Provider value={value}>
      {children}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const context = useContext(MusicContext);
  if (!context) throw new Error('useMusic must be used within MusicProvider');
  return context;
}
