import React, { memo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { Track, formatDuration, getQualityTier, getQualityLabel } from '@/lib/types';
import { useMusic } from '@/lib/music-context';

interface TrackItemProps {
  track: Track;
  index?: number;
  onPress: (track: Track) => void;
  isPlaying?: boolean;
  showIndex?: boolean;
  showQuality?: boolean;
}

export const TrackItem = memo(function TrackItem({ track, index, onPress, isPlaying, showIndex, showQuality = true }: TrackItemProps) {
  const { openTrackOptions, isPlaying: isGlobalPlaying } = useMusic();
  const quality = getQualityTier(track.bitrate, track.format?.toLowerCase());

  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
    backgroundColor: withTiming(isPlaying ? Colors.primary + '18' : 'transparent', { duration: 250 }),
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
    opacity.value = withSpring(0.8, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    opacity.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress(track);
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
    >
      <Animated.View style={[styles.container, animatedStyle]}>
        {showIndex && (
          <View style={styles.indexContainer}>
            {isPlaying ? (
              <View style={styles.vContainer}>
                <VisualizerBar delay={0} isPlaying={isPlaying} isGlobalPlaying={isGlobalPlaying} />
                <VisualizerBar delay={100} isPlaying={isPlaying} isGlobalPlaying={isGlobalPlaying} />
                <VisualizerBar delay={200} isPlaying={isPlaying} isGlobalPlaying={isGlobalPlaying} />
              </View>
            ) : (
              <Text style={styles.indexText}>{(index ?? 0) + 1}</Text>
            )}
          </View>
        )}

        {!showIndex && (
          <View style={styles.artworkContainer}>
            {track.artwork ? (
              <Image source={{ uri: track.artwork }} style={styles.artwork} contentFit="cover" />
            ) : (
              <View style={styles.artworkPlaceholder}>
                <Ionicons name="musical-note" size={18} color={Colors.textTertiary} />
              </View>
            )}
            {isPlaying && (
              <View style={styles.playingOverlay}>
                <View style={styles.vContainer}>
                  <VisualizerBar delay={0} isPlaying={isPlaying} isGlobalPlaying={isGlobalPlaying} />
                  <VisualizerBar delay={100} isPlaying={isPlaying} isGlobalPlaying={isGlobalPlaying} />
                  <VisualizerBar delay={200} isPlaying={isPlaying} isGlobalPlaying={isGlobalPlaying} />
                </View>
              </View>
            )}
          </View>
        )}

        <View style={styles.info}>
          <Text style={[styles.title, isPlaying && styles.titlePlaying]} numberOfLines={1}>
            {track.title}
          </Text>
          <View style={styles.subtitleRow}>
            {showQuality && (
              <View style={[styles.qualityBadge, { backgroundColor: Colors.quality[quality] + '20' }]}>
                <Text style={[styles.qualityText, { color: Colors.quality[quality] }]}>
                  {getQualityLabel(quality)}
                </Text>
              </View>
            )}
            <Text style={[styles.artist, isPlaying && { color: Colors.primary + '99' }]} numberOfLines={1}>
              {track.artist ? track.artist.split(/[,&;/+]|\bfeat(?:uring)?\.\b|\bfeat\b|\bft\.\b|\bft\b|\bwith\b|\band\b/i)[0].trim() : 'Unknown Artist'}
            </Text>
          </View>
        </View>

        <View style={styles.rightContent}>
          <Text style={[styles.duration, isPlaying && { color: Colors.primary + '80' }]}>{formatDuration(track.duration)}</Text>
          <Pressable hitSlop={15} style={styles.moreBtn} onPress={() => openTrackOptions(track)}>
            <Ionicons name="ellipsis-vertical" size={18} color={isPlaying ? Colors.primary : Colors.textTertiary} />
          </Pressable>
        </View>
      </Animated.View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 12,
    height: 70, // Consistent height for FlatList optimization
  },
  pressed: {
    opacity: 0.6,
    backgroundColor: Colors.surfaceLight,
  },
  indexContainer: {
    width: 28,
    alignItems: 'center',
  },
  indexText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  artworkContainer: {
    width: 48,
    height: 48,
    borderRadius: 6,
    overflow: 'hidden',
  },
  artwork: {
    width: 48,
    height: 48,
  },
  artworkPlaceholder: {
    width: 48,
    height: 48,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 3,
  },
  title: {
    color: Colors.text,
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
  },
  titlePlaying: {
    color: Colors.primary,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  qualityBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  qualityText: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
  },
  artist: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    flex: 1,
  },
  duration: {
    color: Colors.textTertiary,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  moreBtn: {
    padding: 4,
  },
  vContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    height: 20,
    justifyContent: 'center',
  },
  vBar: {
    width: 3,
    borderRadius: 1.5,
  },
});

const VisualizerBar = memo(({ delay, isPlaying, isGlobalPlaying }: { delay: number, isPlaying: boolean, isGlobalPlaying: boolean }) => {
  const height = useSharedValue(4);

  React.useEffect(() => {
    if (isPlaying && isGlobalPlaying) {
      height.value = withRepeat(
        withSequence(
          withTiming(14 + Math.random() * 6, { duration: 350 + delay }),
          withTiming(4, { duration: 350 + delay })
        ),
        -1,
        true
      );
    } else {
      height.value = withTiming(isPlaying ? 8 : 4, { duration: 300 });
    }
  }, [isPlaying, isGlobalPlaying, delay]);

  const barStyle = useAnimatedStyle(() => ({
    height: height.value,
    backgroundColor: Colors.primary,
  }));

  return <Animated.View style={[styles.vBar, barStyle]} />;
});
