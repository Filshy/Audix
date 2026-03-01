import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  Platform,
  ScrollView,
  ImageBackground,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import * as FileSystem from 'expo-file-system/legacy';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import ImageColors from 'react-native-image-colors';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, withSpring, interpolate, Extrapolation, Easing } from 'react-native-reanimated';
import { PanResponder } from 'react-native';
import Colors from '@/constants/colors';
import { useMusic } from '@/lib/music-context';
import { formatDuration, getQualityTier, getQualityLabel } from '@/lib/types';
import { BouncyButton } from '@/components/BouncyButton';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const ARTWORK_SIZE = SCREEN_WIDTH - 48; // Edge-to-edge with slight padding

const AnimatedImage = Animated.createAnimatedComponent(Image);

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);
const MINI_PLAYER_HEIGHT = 64; // Slightly taller for more presence

export function GlobalPlayer() {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const topInset = isWeb ? 67 : insets.top;
  const bottomInset = isWeb ? 34 : insets.bottom;

  const {
    currentTrack,
    isPlaying,
    position,
    duration,
    shuffle,
    repeatMode,
    togglePlayPause,
    seekTo,
    skipNext,
    skipPrevious,
    toggleShuffle,
    toggleRepeat,
    updateTrackMetadata,
    favorites,
    toggleFavorite,
  } = useMusic();

  const [isSeeking, setIsSeeking] = useState(false);
  const [seekPosition, setSeekPosition] = useState(0);
  const [showDevices, setShowDevices] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [showEqualizer, setShowEqualizer] = useState(false);
  const [lyricsLines, setLyricsLines] = useState<{ time: number, text: string }[] | null>(null);
  const lyricsScrollRef = React.useRef<ScrollView>(null);
  const [activeLyricIndex, setActiveLyricIndex] = useState(-1);
  const lyricLayouts = React.useRef<{ [key: number]: number }>({});

  // Equalizer state (simulated)
  const [eqLevels, setEqLevels] = useState([0.5, 0.7, 0.4, 0.8, 0.6, 0.3]);

  // Custom Toast state
  const toastOpacity = useSharedValue(0);
  const toastTranslateY = useSharedValue(-50);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const showToast = (message: string, type: 'success' | 'error') => {
    setToastMessage(message);
    setToastType(type);
    toastOpacity.value = withTiming(1, { duration: 300 });
    toastTranslateY.value = withSpring(0, { damping: 12, stiffness: 90 });

    setTimeout(() => {
      toastOpacity.value = withTiming(0, { duration: 300 });
      toastTranslateY.value = withTiming(-50, { duration: 300 });
    }, 3000);
  };

  const animatedToastStyle = useAnimatedStyle(() => ({
    opacity: toastOpacity.value,
    transform: [{ translateY: toastTranslateY.value }],
  }));

  // Metadata editor state
  const [showMetadataEditor, setShowMetadataEditor] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editArtist, setEditArtist] = useState('');
  const [editAlbum, setEditAlbum] = useState('');

  const openMetadataEditor = () => {
    if (currentTrack) {
      setEditTitle(currentTrack.title || '');
      setEditArtist(currentTrack.artist || '');
      setEditAlbum(currentTrack.album || '');
      setShowMetadataEditor(true);
    }
  };

  const handleSaveMetadata = async () => {
    if (currentTrack) {
      const success = await updateTrackMetadata(currentTrack.id, {
        title: editTitle,
        artist: editArtist,
        album: editAlbum
      });
      setShowMetadataEditor(false);

      if (success) {
        showToast('Metadata updated successfully!', 'success');
      } else {
        showToast('Failed to update metadata.', 'error');
      }
    }
  };

  const [imageError, setImageError] = useState(false);
  const blurOpacity = useSharedValue(0);

  useEffect(() => {
    setImageError(false);
  }, [currentTrack?.id]);

  useEffect(() => {
    // Delay blur to allow shared element transition to run smoothly
    const timer = setTimeout(() => {
      blurOpacity.value = withTiming(1, { duration: 400 });
    }, 250);
    return () => clearTimeout(timer);
  }, []);

  const animatedBlurStyle = useAnimatedStyle(() => ({
    opacity: blurOpacity.value,
  }));

  const lyricsOpacity = useSharedValue(0);

  useEffect(() => {
    lyricsOpacity.value = withTiming(showLyrics ? 1 : 0, { duration: 300 });
  }, [showLyrics]);

  const animatedLyricsStyle = useAnimatedStyle(() => ({
    opacity: lyricsOpacity.value,
    transform: [{ scale: interpolate(lyricsOpacity.value, [0, 1], [0.95, 1]) }],
    pointerEvents: showLyrics ? 'auto' : 'none',
  }));

  const animatedArtworkContentStyle = useAnimatedStyle(() => ({
    opacity: interpolate(lyricsOpacity.value, [0, 1], [1, 0.05]),
    transform: [{ scale: interpolate(lyricsOpacity.value, [0, 1], [1, 0.8]) }],
    filter: [
      { blur: interpolate(lyricsOpacity.value, [0, 1], [0, 20]) }
    ] as any
  }));

  useEffect(() => {
    setLyricsLines(null);
    if (!currentTrack || !currentTrack.uri || isWeb) return;

    const fetchLyrics = async () => {
      try {
        if (!currentTrack.uri.startsWith('file://')) return;
        let lrcPath = currentTrack.uri.substring(0, currentTrack.uri.lastIndexOf('.'));
        let info1 = await FileSystem.getInfoAsync(lrcPath + '.lrc');
        let info2 = await FileSystem.getInfoAsync(lrcPath + '.LRC');

        let finalPath = info1.exists ? lrcPath + '.lrc' : (info2.exists ? lrcPath + '.LRC' : null);

        if (!finalPath && currentTrack.uri.includes('%20')) {
          let decPath = decodeURIComponent(currentTrack.uri);
          let baseDecPath = decPath.substring(0, decPath.lastIndexOf('.'));
          let i1 = await FileSystem.getInfoAsync(baseDecPath + '.lrc');
          let i2 = await FileSystem.getInfoAsync(baseDecPath + '.LRC');
          finalPath = i1.exists ? baseDecPath + '.lrc' : (i2.exists ? baseDecPath + '.LRC' : null);
        }

        if (finalPath) {
          const lrcStr = await FileSystem.readAsStringAsync(finalPath);
          const lines = lrcStr.split('\n');
          const parsedLines = [];

          for (const line of lines) {
            const timeMatch = line.match(/\[(\d{2}):(\d{2}(?:\.\d{2,3})?)\]/);
            if (timeMatch) {
              const minutes = parseInt(timeMatch[1], 10);
              const seconds = parseFloat(timeMatch[2]);
              const time = minutes * 60 + seconds;
              let text = line.replace(/\[.*?\]/g, '').trim();
              if (text.startsWith(':')) text = text.substring(1).trim();

              if (text && !text.match(/^(ar|ti|al|by|offset|length):/i)) {
                parsedLines.push({ time, text });
              }
            }
          }
          if (parsedLines.length > 0) {
            setLyricsLines(parsedLines.sort((a, b) => a.time - b.time));
          } else {
            const filtered = lines
              .map(l => l.replace(/\[.*?\]/g, '').trim())
              .filter(l => l && !l.startsWith(':') && !l.match(/^(ar|ti|al|by|offset|length):/i));
            setLyricsLines(filtered.map(text => ({ time: 0, text })));
          }
        }
      } catch (err) {
        console.warn('Could not read lyrics', err);
      }
    };
    fetchLyrics();
  }, [currentTrack]);

  useEffect(() => {
    if (showLyrics && lyricsLines && lyricsLines.length > 0) {
      const index = lyricsLines.findIndex((line, i) =>
        position >= line.time && (!lyricsLines[i + 1] || position < lyricsLines[i + 1].time)
      );

      if (index !== -1 && index !== activeLyricIndex) {
        setActiveLyricIndex(index);

        // Accurate scroll to the measured position of the active line
        const offset = lyricLayouts.current[index];
        if (offset !== undefined) {
          lyricsScrollRef.current?.scrollTo({
            y: Math.max(0, offset - (ARTWORK_SIZE / 2)), // Pure center
            animated: true,
          });
        }
      }
    }
  }, [position, showLyrics, lyricsLines, activeLyricIndex]);

  const [bgColor, setBgColor] = useState(Colors.tidalMagenta);

  const artworkUri = currentTrack?.artwork;

  useEffect(() => {
    if (!artworkUri || typeof artworkUri !== 'string') {
      setBgColor(Colors.tidalMagenta);
      return;
    }

    const fetchColors = async () => {
      try {
        const result = await ImageColors.getColors(artworkUri, {
          fallback: Colors.tidalMagenta,
          cache: true,
          key: artworkUri,
        });

        if (Platform.OS === 'android' && result.platform === 'android') {
          setBgColor(result.vibrant || result.dominant || Colors.tidalMagenta);
        } else if (Platform.OS === 'ios' && result.platform === 'ios') {
          setBgColor(result.primary || result.background || Colors.tidalMagenta);
        }
      } catch (e) {
        setBgColor(Colors.tidalMagenta);
      }
    };

    fetchColors();
  }, [artworkUri]);
  const expansion = useSharedValue(0);
  const startExpansion = React.useRef(0);

  const expand = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    expansion.value = withSpring(1, { damping: 25, stiffness: 150, mass: 0.5 });
  };

  const collapse = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    expansion.value = withSpring(0, { damping: 25, stiffness: 150, mass: 0.5 });
  };

  const TAB_BAR_HEIGHT = isWeb ? 84 : (60 + bottomInset);
  // YT Music style: Miniplayer sits exactly above the tab bar. 
  // If it feels "incastrato", we ensure it starts exactly at the top of the tab bar.

  const containerStyle = useAnimatedStyle(() => {
    const offset = SCREEN_HEIGHT - TAB_BAR_HEIGHT - MINI_PLAYER_HEIGHT - 12; // 12px gap from tab bar
    const translateY = interpolate(expansion.value, [0, 1], [offset, 0], Extrapolation.CLAMP);
    const borderRadius = interpolate(expansion.value, [0, 1], [24, 0], Extrapolation.CLAMP);
    const marginHorizontal = interpolate(expansion.value, [0, 1], [8, 0], Extrapolation.CLAMP);

    return {
      transform: [{ translateY }],
      borderRadius,
      marginHorizontal,
      width: SCREEN_WIDTH - (marginHorizontal * 2),
      height: interpolate(expansion.value, [0, 1], [MINI_PLAYER_HEIGHT, SCREEN_HEIGHT], Extrapolation.CLAMP),
      position: 'absolute',
      pointerEvents: expansion.value > 0.01 ? 'auto' : 'box-none',
      backgroundColor: 'transparent',
      overflow: 'hidden',
    };
  });

  const fullPlayerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(expansion.value, [0, 0.25], [0, 1], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(expansion.value, [0, 1], [60, 0], Extrapolation.CLAMP) }],
    flex: 1,
    pointerEvents: expansion.value > 0.01 ? 'auto' : 'none',
  }));

  const artworkScaleStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(expansion.value, [0, 1], [0.8, 1], Extrapolation.CLAMP) },
      { translateY: interpolate(expansion.value, [0, 1], [60, 0], Extrapolation.CLAMP) }
    ],
    opacity: interpolate(expansion.value, [0, 1], [0.5, 1], Extrapolation.CLAMP),
  }));

  const miniPlayerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(expansion.value, [0, 0.15], [1, 0], Extrapolation.CLAMP),
    pointerEvents: expansion.value < 0.1 ? 'auto' : 'none',
  }));

  const swipeDownResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 10 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
      },
      onPanResponderGrant: () => {
        startExpansion.current = expansion.value;
      },
      onPanResponderMove: (_, gestureState) => {
        const delta = -(gestureState.dy / SCREEN_HEIGHT);
        let nextVal = startExpansion.current + delta;
        nextVal = Math.max(0, Math.min(1, nextVal));
        expansion.value = nextVal;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.vy > 0.5) collapse();
        else if (gestureState.vy < -0.5) expand();
        else {
          if (expansion.value > 0.5) expand();
          else collapse();
        }
      },
    })
  ).current;

  // Hooks must be called unconditionally
  const quality = useMemo(() =>
    currentTrack ? getQualityTier(currentTrack.bitrate, currentTrack.format?.toLowerCase()) : 'low' as const
    , [currentTrack?.bitrate, currentTrack?.format]);

  const handleSeekStart = useCallback((locationX: number, layoutWidth: number) => {
    if (!currentTrack) return;
    setIsSeeking(true);
    const newPos = (locationX / layoutWidth) * duration;
    setSeekPosition(Math.max(0, Math.min(duration, newPos)));
  }, [currentTrack, duration]);

  const handleSeekMove = useCallback((locationX: number, layoutWidth: number) => {
    if (!isSeeking || !currentTrack) return;
    const newPos = (locationX / layoutWidth) * duration;
    setSeekPosition(Math.max(0, Math.min(duration, newPos)));
  }, [isSeeking, currentTrack, duration]);

  const handleSeekEnd = useCallback(() => {
    if (isSeeking && currentTrack) {
      seekTo(seekPosition);
      setIsSeeking(false);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [isSeeking, currentTrack, seekPosition, seekTo]);

  const handlePlayPause = useCallback(() => {
    if (!currentTrack) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    togglePlayPause();
  }, [currentTrack, togglePlayPause]);

  const handleSkipNext = useCallback(() => {
    if (!currentTrack) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    skipNext();
  }, [currentTrack, skipNext]);

  const handleSkipPrevious = useCallback(() => {
    if (!currentTrack) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    skipPrevious();
  }, [currentTrack, skipPrevious]);

  const handleToggleShuffle = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleShuffle();
  }, [toggleShuffle]);

  const handleToggleRepeat = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleRepeat();
  }, [toggleRepeat]);

  const validArtwork = useMemo(() => !!(currentTrack?.artwork && !imageError), [currentTrack?.artwork, imageError]);

  if (!currentTrack) return null;

  const qualityColor = Colors.quality[quality as keyof typeof Colors.quality];
  const progress = duration > 0 ? (isSeeking ? seekPosition : position) / duration : 0;

  return (
    <Animated.View style={containerStyle}>
      {/* Background for full player */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: expansion, backgroundColor: '#0A0A0F' }]}>
        <Animated.View style={[StyleSheet.absoluteFill, animatedBlurStyle]}>
          {validArtwork && <Image source={{ uri: currentTrack.artwork }} style={StyleSheet.absoluteFill} contentFit="cover" />}
          {validArtwork && <BlurView intensity={120} tint="dark" style={StyleSheet.absoluteFill} />}
          <LinearGradient colors={[bgColor, 'transparent', '#0A0A0F']} locations={[0, 0.4, 1]} style={[StyleSheet.absoluteFill, { opacity: 0.8 }]} />
        </Animated.View>
      </Animated.View>

      {/* MINI PLAYER BAR */}
      <Animated.View style={[styles.miniPlayerStatic, miniPlayerStyle]}>
        <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(25,25,35,0.9)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }]} />
        <Pressable style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }} onPress={expand}>
          <View style={{ width: 40, height: 40, borderRadius: 6, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.1)' }}>
            {validArtwork ? (
              <AnimatedImage source={{ uri: currentTrack.artwork }} style={{ width: 40, height: 40 }} contentFit="cover" />
            ) : (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="musical-note" size={16} color={Colors.primary} /></View>
            )}
          </View>
          <View style={{ marginLeft: 12, flex: 1, paddingRight: 10 }}>
            <Text style={{ color: Colors.text, fontSize: 13, fontFamily: 'Inter_600SemiBold' }} numberOfLines={1}>{currentTrack.title}</Text>
            <Text style={{ color: Colors.textSecondary, fontSize: 11, fontFamily: 'Inter_500Medium', marginTop: 2 }} numberOfLines={1}>{currentTrack.artist}</Text>
          </View>
        </Pressable>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <BouncyButton onPress={handlePlayPause} hitSlop={12}>
            <Ionicons name={isPlaying ? 'pause' : 'play'} size={26} color={Colors.text} />
          </BouncyButton>
          <BouncyButton onPress={handleSkipNext} hitSlop={12}>
            <Ionicons name="play-forward" size={22} color={Colors.text} />
          </BouncyButton>
        </View>

        <View style={{ position: 'absolute', bottom: -1, left: 16, right: 16, height: 2, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 1 }}>
          <View style={{ height: 2, backgroundColor: Colors.text, borderRadius: 1, width: `${progress * 100}%` }} />
        </View>
      </Animated.View>

      <Animated.View style={fullPlayerStyle} {...swipeDownResponder.panHandlers}>
        <View style={{ height: 4, width: 36, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, alignSelf: 'center', marginTop: topInset > 20 ? topInset - 10 : 12 }} />
        <View style={[styles.topBar, { paddingTop: 8 }]}>
          <Pressable onPress={() => collapse()} hitSlop={12} style={styles.topBarIconLeft}>
            <Ionicons name="chevron-down" size={28} color={Colors.text} />
          </Pressable>
          <View style={styles.topBarCenter}>
            <Text style={styles.topBarTitle}>NOW PLAYING</Text>
            <Text style={styles.topBarSubtitle} numberOfLines={1}>{currentTrack.title}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Pressable onPress={() => setShowEqualizer(true)} hitSlop={12}>
              <MaterialCommunityIcons name="equalizer" size={24} color={Colors.text} />
            </Pressable>
            <Pressable onPress={() => setShowLyrics(!showLyrics)} hitSlop={12}>
              <Ionicons name="chatbubbles-outline" size={24} color={showLyrics ? Colors.primary : Colors.text} />
            </Pressable>
          </View>
        </View>

        <ScrollView
          style={styles.scrollContent}
          contentContainerStyle={[styles.scrollContentContainer, { paddingBottom: bottomInset + 20 }]}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <Animated.View style={[styles.artworkSection, artworkScaleStyle]}>
            <Animated.View style={[styles.artworkContainer, animatedArtworkContentStyle]}>
              {validArtwork ? (
                <AnimatedImage
                  // @ts-ignore
                  sharedTransitionTag="artwork-player"
                  source={{ uri: currentTrack.artwork }}
                  style={[styles.artwork, { backgroundColor: Colors.surfaceHighlight }]}
                  contentFit="cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <LinearGradient
                  colors={[Colors.surfaceHighlight, Colors.surface]}
                  style={styles.artworkPlaceholder}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="musical-note" size={80} color={Colors.textTertiary} />
                </LinearGradient>
              )}
            </Animated.View>

            <Animated.View style={[StyleSheet.absoluteFill, styles.lyricsOverlay, animatedLyricsStyle]}>
              <ScrollView
                ref={lyricsScrollRef}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                  styles.lyricsScrollContent,
                  { paddingTop: SCREEN_HEIGHT / 3, paddingBottom: SCREEN_HEIGHT / 2 }
                ]}
                snapToInterval={75}
                decelerationRate="fast"
                scrollEventThrottle={16}
              >
                {lyricsLines && lyricsLines.length > 0 ? (
                  lyricsLines.map((line, i) => {
                    const isActive = i === activeLyricIndex;
                    return (
                      <View
                        key={i}
                        style={{ width: SCREEN_WIDTH - 40, alignItems: 'center', paddingHorizontal: 20 }}
                        onLayout={(e) => {
                          lyricLayouts.current[i] = e.nativeEvent.layout.y;
                        }}
                      >
                        <Animated.Text
                          style={[
                            styles.lyricsBody,
                            {
                              color: isActive ? Colors.primary : '#FFFFFF',
                              opacity: isActive ? 1 : 0.22,
                              fontSize: isActive ? 28 : 20,
                              textAlign: 'center',
                              marginVertical: 18,
                              fontFamily: isActive ? 'Inter_800ExtraBold' : 'Inter_600SemiBold',
                              textShadowColor: 'rgba(0,0,0,0.4)',
                              textShadowOffset: { width: 0, height: 1 },
                              textShadowRadius: 4,
                            }
                          ]}
                        >
                          {line.text}
                        </Animated.Text>
                      </View>
                    );
                  })
                ) : (
                  <View style={styles.emptyLyricsContainer}>
                    <Ionicons name="mic-outline" size={48} color={Colors.textTertiary} style={{ marginBottom: 16 }} />
                    <Text style={styles.lyricsHeader}>Testi non disponibili</Text>
                    <Text style={styles.lyricsBodySmall}>
                      Non abbiamo trovato testi sincronizzati (.lrc) per questo brano nella tua libreria.
                    </Text>
                  </View>
                )}
              </ScrollView>
            </Animated.View>
          </Animated.View>

          <View style={styles.trackInfoSection}>
            <View style={styles.trackTitleRow}>
              <View style={styles.trackTitleInfo}>
                <Text style={styles.trackTitle} numberOfLines={1}>{currentTrack.title}</Text>
                <Text style={styles.trackArtist} numberOfLines={1}>{currentTrack.artist}</Text>
              </View>
              <View style={styles.actionIconsRow}>
                <Ionicons name="share-outline" size={24} color={Colors.tidalGray} />
                <Pressable onPress={() => toggleFavorite(currentTrack.id)} hitSlop={15} style={{ marginLeft: 16 }}>
                  <Ionicons
                    name={favorites.includes(currentTrack.id) ? "heart" : "heart-outline"}
                    size={26}
                    color={favorites.includes(currentTrack.id) ? Colors.primary : Colors.tidalGray}
                  />
                </Pressable>
              </View>
            </View>

            <View style={styles.qualityRow}>
              <View style={[styles.qualityPill, { backgroundColor: qualityColor }]}>
                <Text style={styles.qualityPillText}>
                  {getQualityLabel(quality).toUpperCase()}
                </Text>
              </View>
              <View style={styles.specsContainer}>
                <Text style={styles.specsText} numberOfLines={1}>
                  {currentTrack.format?.toUpperCase()} • {currentTrack.bitDepth || 16} bit / {currentTrack.sampleRate ? (currentTrack.sampleRate / 1000).toFixed(1) : 44.1} kHz • {currentTrack.bitrate && currentTrack.bitrate > 0 ? currentTrack.bitrate : (currentTrack.format === 'FLAC' ? 1411 : 320)} kbps
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.progressSection}>
            <View
              style={[styles.progressBarContainer, { width: ARTWORK_SIZE }]}
              onStartShouldSetResponder={() => true}
              onResponderGrant={(e) => handleSeekStart(e.nativeEvent.locationX, ARTWORK_SIZE)}
              onResponderMove={(e) => handleSeekMove(e.nativeEvent.locationX, ARTWORK_SIZE)}
              onResponderRelease={handleSeekEnd}
            >
              <View pointerEvents="none" style={styles.progressBarBg}>
                <View pointerEvents="none" style={[styles.progressBarFill, { width: `${progress * 100}%`, backgroundColor: Colors.text }]} />
                <View pointerEvents="none" style={[styles.progressKnob, { left: `${progress * 100}%`, backgroundColor: Colors.text }]} />
              </View>
            </View>
            <View style={styles.timeRow}>
              <Text style={styles.timeText}>{formatDuration(isSeeking ? seekPosition : position)}</Text>
              <Text style={styles.timeText}>{formatDuration(duration)}</Text>
            </View>
          </View>

          <View style={styles.controlsSection}>
            <BouncyButton
              onPress={handleToggleShuffle}
              hitSlop={16}
            >
              <Ionicons
                name="shuffle"
                size={24}
                color={shuffle ? Colors.tidalCyan : Colors.text}
              />
            </BouncyButton>

            <BouncyButton
              onPress={handleSkipPrevious}
              hitSlop={16}
            >
              <Ionicons name="play-skip-back" size={32} color={Colors.text} />
            </BouncyButton>

            <BouncyButton
              onPress={handlePlayPause}
            >
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={54}
                color={Colors.text}
                style={!isPlaying ? { marginLeft: 6 } : undefined}
              />
            </BouncyButton>

            <BouncyButton
              onPress={handleSkipNext}
              hitSlop={16}
            >
              <Ionicons name="play-skip-forward" size={32} color={Colors.text} />
            </BouncyButton>

            <BouncyButton
              onPress={handleToggleRepeat}
              hitSlop={16}
            >
              <Ionicons
                name={repeatMode === 'one' ? 'repeat' : 'repeat'}
                size={24}
                color={repeatMode !== 'off' ? Colors.tidalCyan : Colors.text}
              />
              {repeatMode === 'one' && (
                <View style={styles.repeatOneBadge}>
                  <Text style={styles.repeatOneText}>1</Text>
                </View>
              )}
            </BouncyButton>
          </View>

          <View style={styles.bottomSection}>
            <BouncyButton
              onPress={() => setShowDevices(true)}
              hitSlop={12}
            >
              <Ionicons name="tv-outline" size={24} color={Colors.tidalCyan} />
            </BouncyButton>
            <BouncyButton hitSlop={12} onPress={openMetadataEditor}>
              <Ionicons name="ellipsis-horizontal" size={24} color={Colors.tidalGray} />
            </BouncyButton>
          </View>
        </ScrollView>
      </Animated.View>

      <Modal
        visible={showDevices}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDevices(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowDevices(false)}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Connect Device</Text>
              <BouncyButton onPress={() => setShowDevices(false)} hitSlop={8}>
                <Ionicons name="close-circle" size={28} color={Colors.surfaceHighlight} />
              </BouncyButton>
            </View>

            <View style={styles.deviceList}>
              <BouncyButton style={styles.deviceRow} onPress={() => setShowDevices(false)}>
                <Ionicons name="phone-portrait-outline" size={24} color={Colors.tidalCyan} />
                <View style={styles.deviceInfo}>
                  <Text style={[styles.deviceName, { color: Colors.tidalCyan }]}>This Phone</Text>
                  <Text style={styles.deviceState}>Active Device</Text>
                </View>
                <Ionicons name="checkmark" size={24} color={Colors.tidalCyan} />
              </BouncyButton>

              <BouncyButton style={styles.deviceRow} onPress={() => setShowDevices(false)}>
                <Ionicons name="headset-outline" size={24} color={Colors.textSecondary} />
                <View style={styles.deviceInfo}>
                  <Text style={styles.deviceName}>Cuffie Bluetooth</Text>
                  <Text style={styles.deviceState}>Non connesse</Text>
                </View>
              </BouncyButton>

              <BouncyButton style={styles.deviceRow} onPress={() => setShowDevices(false)}>
                <Ionicons name="bluetooth-outline" size={24} color={Colors.textSecondary} />
                <View style={styles.deviceInfo}>
                  <Text style={styles.deviceName}>Auricolari</Text>
                  <Text style={styles.deviceState}>Non connesse</Text>
                </View>
              </BouncyButton>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={showMetadataEditor}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowMetadataEditor(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setShowMetadataEditor(false)}>
            <Pressable style={[styles.modalContent, { height: 'auto', paddingBottom: 40 }]} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Metadata</Text>
                <BouncyButton onPress={() => setShowMetadataEditor(false)} hitSlop={8}>
                  <Ionicons name="close-circle" size={28} color={Colors.surfaceHighlight} />
                </BouncyButton>
              </View>

              <View style={styles.editForm}>
                <Text style={styles.inputLabel}>Title</Text>
                <TextInput
                  style={styles.textInput}
                  value={editTitle}
                  onChangeText={setEditTitle}
                  placeholder="Track Title"
                  placeholderTextColor={Colors.textTertiary}
                  returnKeyType="next"
                />

                <Text style={styles.inputLabel}>Artist</Text>
                <TextInput
                  style={styles.textInput}
                  value={editArtist}
                  onChangeText={setEditArtist}
                  placeholder="Artist Name"
                  placeholderTextColor={Colors.textTertiary}
                  returnKeyType="next"
                />

                <Text style={styles.inputLabel}>Album</Text>
                <TextInput
                  style={styles.textInput}
                  value={editAlbum}
                  onChangeText={setEditAlbum}
                  placeholder="Unknown Album"
                  placeholderTextColor={Colors.textTertiary}
                  returnKeyType="done"
                />

                <BouncyButton
                  style={styles.saveButton}
                  onPress={handleSaveMetadata}
                  scaleTo={0.95}
                >
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </BouncyButton>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* Equalizer Modal */}
      <Modal
        visible={showEqualizer}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEqualizer(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowEqualizer(false)}>
          <Pressable style={[styles.modalContent, { height: 'auto' }]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Audio Equalizer</Text>
                <Text style={{ color: Colors.primary, fontSize: 12, fontFamily: 'Inter_600SemiBold', marginTop: 4 }}>MASTER ENGINE ACTIVE</Text>
              </View>
              <BouncyButton onPress={() => setShowEqualizer(false)} hitSlop={8}>
                <Ionicons name="close-circle" size={28} color={Colors.surfaceHighlight} />
              </BouncyButton>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', height: 200, alignItems: 'flex-end', paddingBottom: 20 }}>
              {eqLevels.map((val, i) => (
                <View key={i} style={{ alignItems: 'center', gap: 10 }}>
                  <View
                    style={{ height: 140, width: 40, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 6, justifyContent: 'flex-end', overflow: 'hidden' }}
                    onStartShouldSetResponder={() => true}
                    onResponderGrant={(e) => {
                      const newLevels = [...eqLevels];
                      const touchY = 140 - Math.min(140, Math.max(0, e.nativeEvent.locationY));
                      newLevels[i] = touchY / 140;
                      setEqLevels(newLevels);
                    }}
                    onResponderMove={(e) => {
                      const newLevels = [...eqLevels];
                      const touchY = 140 - Math.min(140, Math.max(0, e.nativeEvent.locationY));
                      newLevels[i] = touchY / 140;
                      setEqLevels(newLevels);
                    }}
                    onResponderRelease={() => Haptics.selectionAsync()}
                  >
                    <View
                      style={{ height: `${val * 100}%`, backgroundColor: Colors.primary, width: '100%', borderRadius: 6 }}
                      pointerEvents="none"
                    />
                  </View>
                  <Text style={{ color: Colors.textSecondary, fontSize: 10, fontFamily: 'Inter_500Medium' }}>
                    {[60, 230, 910, 3000, 7000, 14000][i]}Hz
                  </Text>
                </View>
              ))}
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10, marginBottom: 20 }}>
              {['Flat', 'Bass Boost', 'Electronic', 'Pop', 'Vocal'].map((preset) => (
                <Pressable
                  key={preset}
                  onPress={() => {
                    const presets: Record<string, number[]> = {
                      'Flat': [0.5, 0.5, 0.5, 0.5, 0.5, 0.5],
                      'Bass Boost': [0.9, 0.7, 0.5, 0.4, 0.3, 0.3],
                      'Electronic': [0.8, 0.6, 0.4, 0.7, 0.8, 0.9],
                      'Pop': [0.3, 0.5, 0.8, 0.7, 0.5, 0.4],
                      'Vocal': [0.2, 0.3, 0.7, 0.9, 0.7, 0.4]
                    };
                    setEqLevels(presets[preset]);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 16,
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.1)'
                  }}
                >
                  <Text style={{ color: Colors.text, fontSize: 13, fontFamily: 'Inter_500Medium' }}>{preset}</Text>
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Custom Animated Toast */}
      <Animated.View style={[styles.toastContainer, animatedToastStyle, { top: topInset + 10 }]}>
        <Ionicons
          name={toastType === 'success' ? 'checkmark-circle' : 'alert-circle'}
          size={24}
          color={toastType === 'success' ? Colors.tidalCyan : Colors.primary}
        />
        <Text style={styles.toastText}>{toastMessage}</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  miniPlayerStatic: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: MINI_PLAYER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 10,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  mainLayout: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  topBarCenter: {
    alignItems: 'center',
    flex: 1,
  },
  topBarTitle: {
    color: Colors.tidalGray,
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  topBarSubtitle: {
    color: Colors.text,
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  topBarIconLeft: {
    width: 40,
    alignItems: 'flex-start',
  },
  topBarIconRight: {
    width: 40,
    alignItems: 'flex-end',
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingHorizontal: 24,
    flexGrow: 1,
  },
  artworkSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 16,
    paddingBottom: 24,
  },
  artworkContainer: {
    width: ARTWORK_SIZE,
    height: ARTWORK_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.8,
    shadowRadius: 30,
    elevation: 24,
  },
  artwork: {
    width: ARTWORK_SIZE,
    height: ARTWORK_SIZE,
    borderRadius: 24,
  },
  artworkPlaceholder: {
    width: ARTWORK_SIZE,
    height: ARTWORK_SIZE,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackInfoSection: {
    marginBottom: 24,
  },
  trackTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  trackTitleInfo: {
    flex: 1,
    gap: 4,
    paddingRight: 16,
  },
  trackTitle: {
    color: Colors.text,
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
  },
  trackArtist: {
    color: Colors.tidalGray,
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
  },
  actionIconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qualityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
  },
  qualityPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  qualityPillText: {
    fontSize: 9,
    fontFamily: 'Inter_800ExtraBold',
    color: '#000',
    letterSpacing: 0.5,
  },
  specsContainer: {
    flex: 1,
  },
  specsText: {
    color: Colors.tidalGray,
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.3,
  },
  progressSection: {
    marginBottom: 24,
    gap: 8,
  },
  progressBarContainer: {
    paddingVertical: 12,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    position: 'relative',
    justifyContent: 'center',
  },
  progressBarFill: {
    height: 4,
    backgroundColor: Colors.text,
    borderRadius: 2,
  },
  progressKnob: {
    position: 'absolute',
    top: -6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.text,
    marginLeft: -8,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: -4,
  },
  timeText: {
    color: Colors.tidalGray,
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
  },
  controlsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 40,
    marginTop: 10,
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  repeatOneBadge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: Colors.tidalCyan,
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  repeatOneText: {
    color: Colors.background,
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
  },
  bottomSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1E1E24',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 44 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    color: Colors.text,
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
  },
  deviceList: {
    gap: 12,
  },
  deviceRowActive: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(57, 255, 20,.1)',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20,.3)',
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A30',
    padding: 16,
    borderRadius: 16,
  },
  deviceInfo: {
    marginLeft: 16,
    flex: 1,
  },
  deviceNameActive: {
    color: Colors.tidalCyan,
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 4,
  },
  deviceName: {
    color: Colors.text,
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    marginBottom: 4,
  },
  deviceStateActive: {
    color: Colors.tidalCyan,
    opacity: 0.8,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  deviceState: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  deviceCheck: {
    marginLeft: 'auto',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  emptyLink: {
    color: Colors.primary,
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
  },
  // Metadata Editor Styles
  editForm: {
    paddingTop: 16,
    paddingHorizontal: 10,
    gap: 12,
  },
  inputLabel: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    marginBottom: -4,
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: Colors.text,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  saveButton: {
    backgroundColor: Colors.tidalCyan,
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#000',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  // Toast Styles
  toastContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    backgroundColor: 'rgba(30, 30, 36, 0.95)',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  toastText: {
    color: Colors.text,
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
  },
  lyricsOverlay: {
    zIndex: 10,
    backgroundColor: 'transparent',
    paddingVertical: 90, // Reduced from 140 for a middle ground
  },
  lyricsScrollContent: {
    alignItems: 'center',
  },
  emptyLyricsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: SCREEN_HEIGHT / 4,
  },
  lyricsHeader: {
    color: Colors.text,
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  lyricsBody: {
    width: '100%',
  },
  lyricsBodySmall: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    textAlign: 'center',
    opacity: 0.7,
    paddingHorizontal: 40,
  },
});
