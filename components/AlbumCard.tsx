import React from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { Album } from '@/lib/types';

const CARD_WIDTH = (Dimensions.get('window').width - 48 - 12) / 2;

interface AlbumCardProps {
  album: Album;
  onPress: (album: Album) => void;
}

export function AlbumCard({ album, onPress }: AlbumCardProps) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress(album);
  };

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] }]}
      onPress={handlePress}
    >
      <View style={styles.artworkContainer}>
        {album.artwork ? (
          <Image source={{ uri: album.artwork }} style={styles.artwork} contentFit="cover" />
        ) : (
          <View style={styles.artworkPlaceholder}>
            <Ionicons name="disc" size={36} color={Colors.textTertiary} />
          </View>
        )}
      </View>
      <Text style={styles.name} numberOfLines={1}>{album.name}</Text>
      <Text style={styles.artist} numberOfLines={1}>{album.artist}</Text>
    </Pressable>
  );
}

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
