import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import Colors from '@/constants/colors';
import { useMusic } from '@/lib/music-context';
import { formatDuration } from '@/lib/types';

export function MiniPlayer() {
  const { currentTrack, isPlaying, togglePlayPause, skipNext, position, duration } = useMusic();

  if (!currentTrack) return null;

  const progress = duration > 0 ? position / duration : 0;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/player/now-playing');
  };

  const handleToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    togglePlayPause();
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    skipNext();
  };

  const isWeb = Platform.OS === 'web';
  const isIOS = Platform.OS === 'ios';

  const content = (
    <>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>
      <View style={styles.content}>
        <Pressable style={styles.trackInfo} onPress={handlePress}>
          <View style={styles.artworkContainer}>
            {currentTrack.artwork ? (
              <Image source={{ uri: currentTrack.artwork }} style={styles.artwork} contentFit="cover" />
            ) : (
              <View style={styles.artworkPlaceholder}>
                <Ionicons name="musical-note" size={16} color={Colors.primary} />
              </View>
            )}
          </View>
          <View style={styles.textInfo}>
            <Text style={styles.title} numberOfLines={1}>{currentTrack.title}</Text>
            <Text style={styles.artist} numberOfLines={1}>{currentTrack.artist}</Text>
          </View>
        </Pressable>

        <View style={styles.controls}>
          <Pressable onPress={handleToggle} hitSlop={8}>
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={26}
              color={Colors.text}
            />
          </Pressable>
          <Pressable onPress={handleSkip} hitSlop={8}>
            <Ionicons name="play-forward" size={22} color={Colors.text} />
          </Pressable>
        </View>
      </View>
    </>
  );

  if (isIOS) {
    return (
      <Animated.View entering={SlideInDown.duration(300)} style={styles.container}>
        <BlurView intensity={80} tint="dark" style={styles.blurContainer}>
          {content}
        </BlurView>
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={SlideInDown.duration(300)} style={styles.container}>
      <View style={styles.solidContainer}>
        {content}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'web' ? 84 : 80,
    left: 8,
    right: 8,
    borderRadius: 12,
    overflow: 'hidden',
    zIndex: 100,
  },
  blurContainer: {
    overflow: 'hidden',
    borderRadius: 12,
  },
  solidContainer: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  progressBar: {
    height: 2,
    backgroundColor: Colors.surfaceHighlight,
  },
  progressFill: {
    height: 2,
    backgroundColor: Colors.primary,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  trackInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  artworkContainer: {
    width: 40,
    height: 40,
    borderRadius: 6,
    overflow: 'hidden',
  },
  artwork: {
    width: 40,
    height: 40,
  },
  artworkPlaceholder: {
    width: 40,
    height: 40,
    backgroundColor: Colors.surfaceHighlight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInfo: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: Colors.text,
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  artist: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingLeft: 8,
  },
});
