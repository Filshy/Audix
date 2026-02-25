import React, { memo } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { Album } from '@/lib/types';

const CARD_WIDTH = (Dimensions.get('window').width - 48 - 12) / 2;

interface AlbumCardProps {
  album: Album;
  onPress: (album: Album) => void;
}

export const AlbumCard = memo(function AlbumCard({ album, onPress }: AlbumCardProps) {
  const scale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.5);

  React.useEffect(() => {
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000 }),
        withTiming(0.5, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress(album);
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
    >
      <Animated.View style={[styles.container, animatedStyle]}>
        <View style={styles.artworkContainer}>
          {album.artwork ? (
            <Image source={{ uri: album.artwork }} style={styles.artwork} contentFit="cover" />
          ) : (
            <Animated.View style={[styles.artworkPlaceholder, pulseStyle]}>
              <LinearGradient
                colors={[Colors.surfaceHighlight, Colors.surface]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <Ionicons name="disc" size={36} color={Colors.textTertiary} />
            </Animated.View>
          )}
        </View>
        <Text style={styles.name} numberOfLines={1}>{album.name}</Text>
        <Text style={styles.artist} numberOfLines={1}>{album.artist}</Text>
      </Animated.View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    gap: 6,
  },
  artworkContainer: {
    width: CARD_WIDTH,
    height: CARD_WIDTH,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceLight,
  },
  artwork: {
    width: '100%',
    height: '100%',
  },
  artworkPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceLight,
  },
  name: {
    color: Colors.text,
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  artist: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
});
