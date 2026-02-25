import React, { memo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { Artist } from '@/lib/types';

interface ArtistRowProps {
  artist: Artist;
  onPress: (artist: Artist) => void;
}

export const ArtistRow = memo(function ArtistRow({ artist, onPress }: ArtistRowProps) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress(artist);
  };

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={handlePress}
    >
      <View style={styles.avatarContainer}>
        {artist.artwork ? (
          <Image source={{ uri: artist.artwork }} style={styles.avatar} contentFit="cover" />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={22} color={Colors.textTertiary} />
          </View>
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{artist.name}</Text>
        <Text style={styles.detail}>
          {artist.albums.length} {artist.albums.length === 1 ? 'album' : 'albums'} · {artist.trackCount} {artist.trackCount === 1 ? 'track' : 'tracks'}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
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
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
  },
  avatar: {
    width: 50,
    height: 50,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 3,
  },
  name: {
    color: Colors.text,
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
  },
  detail: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
});
