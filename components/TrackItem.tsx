import React, { memo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { Track, formatDuration, getQualityTier, getQualityLabel } from '@/lib/types';

interface TrackItemProps {
  track: Track;
  index?: number;
  onPress: (track: Track) => void;
  isPlaying?: boolean;
  showIndex?: boolean;
  showQuality?: boolean;
}

export const TrackItem = memo(function TrackItem({ track, index, onPress, isPlaying, showIndex, showQuality = true }: TrackItemProps) {
  const quality = getQualityTier(track.bitrate, track.format?.toLowerCase());

  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
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
              <Ionicons name="musical-note" size={14} color={Colors.primary} />
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
                <Ionicons name="volume-high" size={14} color={Colors.primary} />
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
            <Text style={styles.artist} numberOfLines={1}>
              {track.artist}
            </Text>
          </View>
        </View>

        <Text style={styles.duration}>{formatDuration(track.duration)}</Text>
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
});
