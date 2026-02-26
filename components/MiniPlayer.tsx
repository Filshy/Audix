import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import Animated, { FadeIn, SlideInDown, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import Colors from '@/constants/colors';
import { useMusic } from '@/lib/music-context';
import { formatDuration } from '@/lib/types';
import { BouncyButton } from './BouncyButton';

const AnimatedImage = Animated.createAnimatedComponent(Image);

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

  const content = (
    <>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>
      <View style={styles.content}>
        <Pressable
          style={({ pressed }) => [styles.trackInfo, { opacity: pressed ? 0.5 : 1 }]}
          onPress={handlePress}>
          <View style={styles.artworkContainer}>
            {currentTrack.artwork ? (
              <AnimatedImage
                // @ts-ignore
                sharedTransitionTag="artwork-player"
                source={{ uri: currentTrack.artwork }}
                style={styles.artwork}
                contentFit="cover"
              />
            ) : (
              <View style={styles.placeholderArtwork}>
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
          <BouncyButton
            onPress={handleToggle}
            hitSlop={12}
          >
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={26}
              color={Colors.text}
            />
          </BouncyButton>
          <BouncyButton onPress={handleSkip} hitSlop={12}>
            <Ionicons name="play-forward" size={22} color={Colors.text} />
          </BouncyButton>
        </View>
      </View>
    </>
  );

  const isWeb = Platform.OS === 'web';
  const isIOS = Platform.OS === 'ios';

  if (isIOS) {
    return (
      <Animated.View entering={SlideInDown.duration(300)} style={styles.container}>
        <View style={StyleSheet.absoluteFill}>
          <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]} />
        </View>
        {content}
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={SlideInDown.duration(300)} style={styles.container}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(30,30,30,0.95)' }]} />
      <View style={styles.solidContainer}>
        {content}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'web' ? 84 : 96,
    left: 8,
    right: 8,
    borderRadius: 12,
    overflow: 'hidden',
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  blurContainer: {
    overflow: 'hidden',
    borderRadius: 12,
  },
  solidContainer: {
    flex: 1,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
  },
  progressBar: {
    height: 2,
    backgroundColor: 'transparent',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  progressFill: {
    height: 2,
    backgroundColor: Colors.tidalCyan,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    paddingRight: 16,
  },
  trackInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  artworkContainer: {
    width: 48,
    height: 48,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceHighlight,
  },
  artwork: {
    width: 48,
    height: 48,
  },
  placeholderArtwork: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceHighlight,
  },
  textInfo: {
    flex: 1,
    marginRight: 12,
    justifyContent: 'center',
  },
  title: {
    color: Colors.text,
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 2,
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
  },
});
