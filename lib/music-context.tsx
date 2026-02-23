import React, { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo, ReactNode } from 'react';
import { Audio } from 'expo-av';
import * as MediaLibrary from 'expo-media-library';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { Track, Album, Artist, RepeatMode, getFormatFromFilename } from './types';
import * as Crypto from 'expo-crypto';

const DEMO_TRACKS: Track[] = [
  { id: '1', uri: '', title: 'Midnight Drive', artist: 'Neon Pulse', album: 'After Dark', duration: 234, bitrate: 320, format: 'MP3', sampleRate: 44100, channels: 2, bitDepth: 16, fileSize: 9360000, filename: 'midnight_drive.mp3' },
  { id: '2', uri: '', title: 'Ocean Waves', artist: 'Ambient Flow', album: 'Serenity', duration: 312, bitrate: 1411, format: 'FLAC', sampleRate: 44100, channels: 2, bitDepth: 24, fileSize: 55000000, filename: 'ocean_waves.flac' },
  { id: '3', uri: '', title: 'Electric Soul', artist: 'Neon Pulse', album: 'After Dark', duration: 198, bitrate: 256, format: 'AAC', sampleRate: 48000, channels: 2, bitDepth: 16, fileSize: 6336000, filename: 'electric_soul.m4a' },
  { id: '4', uri: '', title: 'Dawn Chorus', artist: 'Ambient Flow', album: 'Serenity', duration: 276, bitrate: 1411, format: 'FLAC', sampleRate: 96000, channels: 2, bitDepth: 24, fileSize: 48800000, filename: 'dawn_chorus.flac' },
  { id: '5', uri: '', title: 'City Lights', artist: 'Synthwave Radio', album: 'Retro Future', duration: 245, bitrate: 320, format: 'MP3', sampleRate: 44100, channels: 2, bitDepth: 16, fileSize: 9800000, filename: 'city_lights.mp3' },
  { id: '6', uri: '', title: 'Neon Rain', artist: 'Synthwave Radio', album: 'Retro Future', duration: 289, bitrate: 320, format: 'MP3', sampleRate: 44100, channels: 2, bitDepth: 16, fileSize: 11560000, filename: 'neon_rain.mp3' },
  { id: '7', uri: '', title: 'Deep Blue', artist: 'Ambient Flow', album: 'Horizons', duration: 420, bitrate: 2116, format: 'FLAC', sampleRate: 96000, channels: 2, bitDepth: 24, fileSize: 111000000, filename: 'deep_blue.flac' },
  { id: '8', uri: '', title: 'Pulse', artist: 'Neon Pulse', album: 'Velocity', duration: 210, bitrate: 256, format: 'AAC', sampleRate: 44100, channels: 2, bitDepth: 16, fileSize: 6720000, filename: 'pulse.m4a' },
  { id: '9', uri: '', title: 'Starlight', artist: 'Cosmic Drift', album: 'Nebula', duration: 356, bitrate: 1411, format: 'FLAC', sampleRate: 44100, channels: 2, bitDepth: 16, fileSize: 62600000, filename: 'starlight.flac' },
  { id: '10', uri: '', title: 'Solar Wind', artist: 'Cosmic Drift', album: 'Nebula', duration: 298, bitrate: 128, format: 'MP3', sampleRate: 44100, channels: 2, bitDepth: 16, fileSize: 4768000, filename: 'solar_wind.mp3' },
  { id: '11', uri: '', title: 'Gravity', artist: 'Cosmic Drift', album: 'Event Horizon', duration: 267, bitrate: 320, format: 'MP3', sampleRate: 44100, channels: 2, bitDepth: 16, fileSize: 10680000, filename: 'gravity.mp3' },
  { id: '12', uri: '', title: 'Echoes', artist: 'Synthwave Radio', album: 'Digital Dreams', duration: 332, bitrate: 192, format: 'AAC', sampleRate: 44100, channels: 2, bitDepth: 16, fileSize: 7968000, filename: 'echoes.m4a' },
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
  const [hasPermission, setHasPermission] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);
  const positionInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const albums = useMemo(() => {
    const albumMap = new Map<string, Album>();
    tracks.forEach(track => {
      const key = `${track.album}-${track.artist}`;
      if (!albumMap.has(key)) {
        albumMap.set(key, {
          id: key,
          name: track.album,
          artist: track.artist,
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
      if (!artistMap.has(track.artist)) {
        artistMap.set(track.artist, {
          id: track.artist,
          name: track.artist,
          artwork: track.artwork,
          albums: [],
          trackCount: 0,
        });
      }
      artistMap.get(track.artist)!.trackCount++;
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

  const requestPermission = useCallback(async () => {
    if (Platform.OS === 'web') {
      setHasPermission(true);
      setTracks(DEMO_TRACKS);
      setIsLoading(false);
      return;
    }
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync(false, ['audio']);
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

      const cachedMeta = await AsyncStorage.getItem('track_metadata');
      const metadataCache: Record<string, Partial<Track>> = cachedMeta ? JSON.parse(cachedMeta) : {};

      const scannedTracks: Track[] = media.assets.map(asset => {
        const cached = metadataCache[asset.id];
        const format = getFormatFromFilename(asset.filename);
        return {
          id: asset.id,
          uri: asset.uri,
          title: cached?.title || asset.filename.replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
          artist: cached?.artist || 'Unknown Artist',
          album: cached?.album || 'Unknown Album',
          duration: asset.duration,
          artwork: cached?.artwork,
          bitrate: cached?.bitrate,
          format: format,
          sampleRate: cached?.sampleRate,
          channels: cached?.channels || 2,
          bitDepth: cached?.bitDepth,
          fileSize: undefined,
          filename: asset.filename,
          metadataFetched: !!cached,
        };
      });

      setTracks(scannedTracks);
    } catch (err) {
      console.error('Error scanning library:', err);
    }
    setIsLoading(false);
  }, []);

  const scanLibrary = useCallback(async () => {
    if (Platform.OS === 'web') {
      setTracks(DEMO_TRACKS);
      setIsLoading(false);
      return;
    }
    try {
      await scanLibraryInternal();
    } catch (err) {
      console.warn('Scan failed, using demo data:', err);
      setTracks(DEMO_TRACKS);
      setIsLoading(false);
    }
  }, [scanLibraryInternal]);

  useEffect(() => {
    const init = async () => {
      await Audio.setAudioModeAsync({
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
      });

      if (Platform.OS === 'web') {
        setHasPermission(true);
        setTracks(DEMO_TRACKS);
        setIsLoading(false);
      } else {
        try {
          const { status } = await MediaLibrary.getPermissionsAsync(false, ['audio']);
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
  }), [tracks, albums, artists, currentTrack, isPlaying, position, duration, shuffle, repeatMode, queue, isLoading, hasPermission, requestPermission, playTrack, togglePlayPause, seekTo, skipNext, skipPrevious, toggleShuffle, toggleRepeat, playAlbum, scanLibrary]);

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
