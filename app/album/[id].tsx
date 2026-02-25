import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Colors from '@/constants/colors';
import { useMusic } from '@/lib/music-context';
import { TrackItem } from '@/components/TrackItem';
import { Track, formatDuration, getQualityTier, getQualityLabel } from '@/lib/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HEADER_ART_SIZE = SCREEN_WIDTH * 0.55;

export default function AlbumDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const topInset = isWeb ? 67 : insets.top;
  const bottomInset = isWeb ? 34 : insets.bottom;

  const { albums, currentTrack, playTrack, playAlbum } = useMusic();

  const album = useMemo(() => albums.find(a => a.id === id), [albums, id]);

  const totalDuration = useMemo(() => {
    if (!album) return 0;
    return album.tracks.reduce((sum, t) => sum + t.duration, 0);
  }, [album]);

  const handleTrackPress = useCallback((track: Track) => {
    if (album) {
      playTrack(track);
    }
  }, [album, playTrack]);

  const handlePlayAll = useCallback(() => {
    if (album) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      playAlbum(album);
    }
  }, [album, playAlbum]);

  if (!album) {
    return (
      <View style={[styles.container, { paddingTop: topInset }]}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </Pressable>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Album not found</Text>
        </View>
      </View>
    );
  }

  const bestQuality = album.tracks.reduce((best, track) => {
    const tier = getQualityTier(track.bitrate, track.format?.toLowerCase());
    const order = { lossless: 3, high: 2, standard: 1, low: 0 };
    return order[tier] > order[best] ? tier : best;
  }, 'low' as 'lossless' | 'high' | 'standard' | 'low');

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
      </View>

      <FlatList
        data={album.tracks}
        renderItem={({ item, index }) => (
          <TrackItem
            track={item}
            index={index}
            onPress={handleTrackPress}
            isPlaying={currentTrack?.id === item.id}
            showIndex={true}
          />
        )}
        keyExtractor={item => item.id}
        scrollEnabled={!!album.tracks.length}
        showsVerticalScrollIndicator={false}
        initialNumToRender={20}
        maxToRenderPerBatch={20}
        windowSize={5}
        removeClippedSubviews={true}
        contentContainerStyle={{ paddingBottom: currentTrack ? 160 : bottomInset + 40 }}
        ListHeaderComponent={
          <View style={styles.headerSection}>
            <View style={styles.artworkContainer}>
              {album.artwork ? (
                <Image source={{ uri: album.artwork }} style={styles.artwork} contentFit="cover" />
              ) : (
                <LinearGradient
                  colors={[Colors.surfaceHighlight, Colors.surface]}
                  style={styles.artworkPlaceholder}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="disc" size={60} color={Colors.textTertiary} />
                </LinearGradient>
              )}
            </View>

            <Text style={styles.albumName}>{album.name}</Text>
            <Text style={styles.albumArtist}>{album.artist}</Text>

            <View style={styles.metaRow}>
              <View style={[styles.qualityPill, { backgroundColor: Colors.quality[bestQuality] + '20' }]}>
                <Text style={[styles.qualityPillText, { color: Colors.quality[bestQuality] }]}>
                  {getQualityLabel(bestQuality)}
                </Text>
              </View>
              <Text style={styles.metaText}>
                {album.tracks.length} tracks · {formatDuration(totalDuration)}
              </Text>
            </View>

            <View style={styles.actionsRow}>
              <Pressable
                onPress={handlePlayAll}
                style={({ pressed }) => [styles.playAllButton, pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] }]}
              >
                <LinearGradient
                  colors={[Colors.primary, Colors.primaryDim]}
                  style={styles.playAllGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="play" size={20} color={Colors.background} />
                  <Text style={styles.playAllText}>Play All</Text>
                </LinearGradient>
              </Pressable>

              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                style={styles.shuffleButton}
              >
                <Ionicons name="shuffle" size={20} color={Colors.primary} />
              </Pressable>
            </View>

            <View style={styles.trackListHeader}>
              <Text style={styles.trackListTitle}>Tracks</Text>
            </View>
          </View>
        }
      />
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
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 8,
    gap: 6,
  },
  artworkContainer: {
    width: HEADER_ART_SIZE,
    height: HEADER_ART_SIZE,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 16,
  },
  artwork: {
    width: HEADER_ART_SIZE,
    height: HEADER_ART_SIZE,
  },
  artworkPlaceholder: {
    width: HEADER_ART_SIZE,
    height: HEADER_ART_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  albumName: {
    color: Colors.text,
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
  },
  albumArtist: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  qualityPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  qualityPillText: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
  },
  metaText: {
    color: Colors.textTertiary,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
    marginBottom: 12,
  },
  playAllButton: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  playAllGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 24,
  },
  playAllText: {
    color: Colors.background,
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  shuffleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackListHeader: {
    width: '100%',
    paddingTop: 8,
  },
  trackListTitle: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
});
