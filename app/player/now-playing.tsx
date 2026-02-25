import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  Platform,
  ScrollView,
  ImageBackground,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import ImageColors from 'react-native-image-colors';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { PanResponder } from 'react-native';
import Colors from '@/constants/colors';
import { useMusic } from '@/lib/music-context';
import { formatDuration, getQualityTier, getQualityLabel } from '@/lib/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ARTWORK_SIZE = SCREEN_WIDTH - 48; // Edge-to-edge with slight padding

export default function NowPlayingScreen() {
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
  } = useMusic();

  const [isSeeking, setIsSeeking] = useState(false);
  const [seekPosition, setSeekPosition] = useState(0);
  const [bgColor, setBgColor] = useState(Colors.tidalMagenta);

  useEffect(() => {
    if (!currentTrack?.artwork) {
      setBgColor(Colors.tidalMagenta);
      return;
    }
    const artworkUri = currentTrack.artwork;

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
        } else {
          setBgColor(Colors.tidalMagenta);
        }
      } catch (e) {
        console.warn('Failed to fetch image colors', e);
        setBgColor(Colors.tidalMagenta);
      }
    };

    fetchColors();
  }, [currentTrack?.artwork]);

  if (!currentTrack) {
    return (
      <View style={[styles.container, { paddingTop: topInset }]}>
        <View style={styles.emptyContainer}>
          <Ionicons name="musical-notes-outline" size={64} color={Colors.textTertiary} />
          <Text style={styles.emptyText}>No track playing</Text>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.emptyLink}>Go to Library</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const quality = getQualityTier(currentTrack.bitrate, currentTrack.format?.toLowerCase());
  const qualityColor = Colors.quality[quality];
  const progress = duration > 0 ? (isSeeking ? seekPosition : position) / duration : 0;

  const handleSeekStart = (locationX: number, layoutWidth: number) => {
    setIsSeeking(true);
    const newPos = (locationX / layoutWidth) * duration;
    setSeekPosition(Math.max(0, Math.min(duration, newPos)));
  };

  const handleSeekMove = (locationX: number, layoutWidth: number) => {
    if (!isSeeking) return;
    const newPos = (locationX / layoutWidth) * duration;
    setSeekPosition(Math.max(0, Math.min(duration, newPos)));
  };

  const handleSeekEnd = () => {
    if (isSeeking) {
      seekTo(seekPosition);
      setIsSeeking(false);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handlePlayPause = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    togglePlayPause();
  };

  const handleSkipNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    skipNext();
  };

  const handleSkipPrevious = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    skipPrevious();
  };

  const handleToggleShuffle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleShuffle();
  };

  const handleToggleRepeat = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleRepeat();
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[bgColor, Colors.tidalPurple, Colors.background]}
        locations={[0, 0.45, 0.9]}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.mainLayout, { paddingTop: topInset }]}>

        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.topBarIconLeft}>
            <Ionicons name="chevron-down" size={28} color={Colors.text} />
          </Pressable>
          <View style={styles.topBarCenter}>
            <Text style={styles.topBarTitle}>NOW PLAYING</Text>
            <Text style={styles.topBarSubtitle} numberOfLines={1}>{currentTrack.title}</Text>
          </View>
          <Pressable hitSlop={12} style={styles.topBarIconRight}>
            <Ionicons name="menu" size={24} color={Colors.text} />
          </Pressable>
        </View>

        <ScrollView
          style={styles.scrollContent}
          contentContainerStyle={[styles.scrollContentContainer, { paddingBottom: bottomInset + 20 }]}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.artworkSection}>
            <View style={styles.artworkContainer}>
              {currentTrack.artwork ? (
                <Image source={{ uri: currentTrack.artwork }} style={styles.artwork} contentFit="cover" />
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
            </View>
          </View>

          <View style={styles.trackInfoSection}>
            <View style={styles.trackTitleRow}>
              <View style={styles.trackTitleInfo}>
                <Text style={styles.trackTitle} numberOfLines={1}>{currentTrack.title}</Text>
                <Text style={styles.trackArtist} numberOfLines={1}>{currentTrack.artist}</Text>
              </View>
              <View style={styles.actionIconsRow}>
                <Ionicons name="information-circle-outline" size={24} color={Colors.tidalGray} />
                <Ionicons name="heart-outline" size={24} color={Colors.tidalGray} style={{ marginLeft: 16 }} />
              </View>
            </View>

            <View style={styles.qualityRow}>
              <View style={[styles.qualityPill, { backgroundColor: qualityColor }]}>
                <Text style={styles.qualityPillText}>
                  {getQualityLabel(quality).toUpperCase()}
                </Text>
              </View>
              <View style={styles.specsContainer}>
                <Text style={styles.specsText}>
                  {[
                    currentTrack.format?.toUpperCase(),
                    currentTrack.bitrate ? `${currentTrack.bitrate} kbps` : null,
                    currentTrack.sampleRate ? `${(currentTrack.sampleRate / 1000).toFixed(1)} kHz` : null,
                  ].filter(Boolean).join('  •  ')}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.progressSection}>
            <View style={styles.timeRow}>
              <Text style={styles.timeText}>{formatDuration(isSeeking ? seekPosition : position)}</Text>
              <Text style={styles.timeText}>{formatDuration(duration)}</Text>
            </View>
            <Pressable
              style={styles.progressBarContainer}
              onPressIn={(e) => {
                const { locationX } = e.nativeEvent;
                handleSeekStart(locationX, SCREEN_WIDTH - 48);
              }}
              onResponderMove={(e) => {
                const { locationX } = e.nativeEvent;
                handleSeekMove(locationX, SCREEN_WIDTH - 48);
              }}
              onPressOut={handleSeekEnd}
            >
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
                <View style={[styles.progressKnob, { left: `${progress * 100}%` }]} />
              </View>
            </Pressable>
          </View>

          <View style={styles.controlsSection}>
            <Pressable onPress={handleToggleShuffle} hitSlop={12}>
              <Ionicons
                name="shuffle"
                size={24}
                color={shuffle ? Colors.tidalCyan : Colors.text}
              />
            </Pressable>

            <Pressable onPress={handleSkipPrevious} hitSlop={12}>
              <Ionicons name="play-skip-back" size={32} color={Colors.text} />
            </Pressable>

            <Pressable
              onPress={handlePlayPause}
              style={({ pressed }) => [styles.playButton, pressed && { transform: [{ scale: 0.93 }] }]}
            >
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={48}
                color={Colors.text}
                style={!isPlaying ? { marginLeft: 6 } : undefined}
              />
            </Pressable>

            <Pressable onPress={handleSkipNext} hitSlop={12}>
              <Ionicons name="play-skip-forward" size={32} color={Colors.text} />
            </Pressable>

            <Pressable onPress={handleToggleRepeat} hitSlop={12}>
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
            </Pressable>
          </View>

          <View style={styles.bottomSection}>
            <Ionicons name="tv-outline" size={24} color={Colors.tidalGray} />
            <View style={styles.hifiBadge}>
              <Text style={styles.hifiText}>HIFI</Text>
            </View>
            <Ionicons name="ellipsis-horizontal" size={24} color={Colors.tidalGray} />
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
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
  },
  artworkSection: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 28,
  },
  artworkContainer: {
    width: ARTWORK_SIZE,
    height: ARTWORK_SIZE,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
    elevation: 24,
  },
  artwork: {
    width: ARTWORK_SIZE,
    height: ARTWORK_SIZE,
  },
  artworkPlaceholder: {
    width: ARTWORK_SIZE,
    height: ARTWORK_SIZE,
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
    paddingVertical: 8,
  },
  progressBarBg: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 1.5,
    position: 'relative',
  },
  progressBarFill: {
    height: 3,
    backgroundColor: Colors.text,
    borderRadius: 1.5,
  },
  progressKnob: {
    position: 'absolute',
    top: -5,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.text,
    marginLeft: -7,
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
  },
  hifiBadge: {
    backgroundColor: 'rgba(0, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  hifiText: {
    color: Colors.tidalCyan,
    fontSize: 10,
    fontFamily: 'Inter_800ExtraBold',
    letterSpacing: 1,
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
});
