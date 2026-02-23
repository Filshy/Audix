import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { PanResponder } from 'react-native';
import Colors from '@/constants/colors';
import { useMusic } from '@/lib/music-context';
import { QualityInfo } from '@/components/QualityInfo';
import { formatDuration, getQualityTier, getQualityLabel } from '@/lib/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ARTWORK_SIZE = SCREEN_WIDTH - 80;

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

  const [showInfo, setShowInfo] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekPosition, setSeekPosition] = useState(0);

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
    <View style={[styles.container, { paddingTop: topInset }]}>
      <LinearGradient
        colors={[Colors.surfaceLight, Colors.background, Colors.background]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.5 }}
      />

      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-down" size={28} color={Colors.text} />
        </Pressable>
        <Text style={styles.topBarTitle}>NOW PLAYING</Text>
        <Pressable onPress={() => setShowInfo(!showInfo)} hitSlop={12}>
          <Ionicons
            name={showInfo ? 'information-circle' : 'information-circle-outline'}
            size={24}
            color={showInfo ? Colors.primary : Colors.textSecondary}
          />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={[styles.scrollContentContainer, { paddingBottom: bottomInset + 20 }]}
        showsVerticalScrollIndicator={false}
        bounces={true}
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
          </View>

          <View style={styles.qualityRow}>
            <View style={[styles.qualityPill, { backgroundColor: qualityColor + '20' }]}>
              <Ionicons name="diamond" size={10} color={qualityColor} />
              <Text style={[styles.qualityPillText, { color: qualityColor }]}>
                {getQualityLabel(quality)}
              </Text>
            </View>
            {currentTrack.format && (
              <Text style={styles.formatText}>{currentTrack.format}</Text>
            )}
            {currentTrack.bitrate && (
              <Text style={styles.formatText}>{currentTrack.bitrate} kbps</Text>
            )}
            {currentTrack.sampleRate && (
              <Text style={styles.formatText}>{(currentTrack.sampleRate / 1000).toFixed(1)} kHz</Text>
            )}
          </View>
        </View>

        <View style={styles.progressSection}>
          <Pressable
            style={styles.progressBarContainer}
            onPressIn={(e) => {
              const { locationX } = e.nativeEvent;
              handleSeekStart(locationX, SCREEN_WIDTH - 80);
            }}
            onResponderMove={(e) => {
              const { locationX } = e.nativeEvent;
              handleSeekMove(locationX, SCREEN_WIDTH - 80);
            }}
            onPressOut={handleSeekEnd}
          >
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
              <View style={[styles.progressKnob, { left: `${progress * 100}%` }]} />
            </View>
          </Pressable>
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{formatDuration(isSeeking ? seekPosition : position)}</Text>
            <Text style={styles.timeText}>{formatDuration(duration)}</Text>
          </View>
        </View>

        <View style={styles.controlsSection}>
          <Pressable onPress={handleToggleShuffle} hitSlop={12}>
            <Ionicons
              name="shuffle"
              size={22}
              color={shuffle ? Colors.primary : Colors.textSecondary}
            />
          </Pressable>

          <Pressable onPress={handleSkipPrevious} hitSlop={12}>
            <Ionicons name="play-skip-back" size={30} color={Colors.text} />
          </Pressable>

          <Pressable
            onPress={handlePlayPause}
            style={({ pressed }) => [styles.playButton, pressed && { transform: [{ scale: 0.93 }] }]}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.primaryDim]}
              style={styles.playButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={32}
                color={Colors.background}
                style={!isPlaying ? { marginLeft: 3 } : undefined}
              />
            </LinearGradient>
          </Pressable>

          <Pressable onPress={handleSkipNext} hitSlop={12}>
            <Ionicons name="play-skip-forward" size={30} color={Colors.text} />
          </Pressable>

          <Pressable onPress={handleToggleRepeat} hitSlop={12}>
            <Ionicons
              name={repeatMode === 'one' ? 'repeat' : 'repeat'}
              size={22}
              color={repeatMode !== 'off' ? Colors.primary : Colors.textSecondary}
            />
            {repeatMode === 'one' && (
              <View style={styles.repeatOneBadge}>
                <Text style={styles.repeatOneText}>1</Text>
              </View>
            )}
          </Pressable>
        </View>

        {showInfo && (
          <View style={styles.infoSection}>
            <QualityInfo track={currentTrack} />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  topBarTitle: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 2,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingHorizontal: 40,
  },
  artworkSection: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 28,
  },
  artworkContainer: {
    width: ARTWORK_SIZE,
    height: ARTWORK_SIZE,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 20,
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
    gap: 8,
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
  },
  trackTitle: {
    color: Colors.text,
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
  },
  trackArtist: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  qualityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  qualityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  qualityPillText: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
  },
  formatText: {
    color: Colors.textTertiary,
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  progressSection: {
    marginBottom: 24,
    gap: 8,
  },
  progressBarContainer: {
    paddingVertical: 8,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: 2,
    position: 'relative',
  },
  progressBarFill: {
    height: 4,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  progressKnob: {
    position: 'absolute',
    top: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
    marginLeft: -6,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    color: Colors.textTertiary,
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  controlsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginBottom: 24,
  },
  playButton: {
    borderRadius: 32,
    overflow: 'hidden',
  },
  playButtonGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  repeatOneBadge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: Colors.primary,
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
  infoSection: {
    paddingTop: 8,
    paddingBottom: 24,
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
