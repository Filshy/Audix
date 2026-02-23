import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useMusic } from '@/lib/music-context';
import { PermissionGate } from '@/components/PermissionGate';
import { TrackItem } from '@/components/TrackItem';
import { AlbumCard } from '@/components/AlbumCard';
import { ArtistRow } from '@/components/ArtistRow';
import { Track, Album, Artist } from '@/lib/types';

type LibraryTab = 'tracks' | 'albums' | 'artists';

export default function LibraryScreen() {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const topInset = isWeb ? 67 : insets.top;
  const [activeTab, setActiveTab] = useState<LibraryTab>('tracks');
  const { tracks, albums, artists, currentTrack, playTrack, playAlbum, isLoading, scanLibrary } = useMusic();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await scanLibrary();
    setRefreshing(false);
  }, [scanLibrary]);

  const handleTrackPress = useCallback((track: Track) => {
    playTrack(track);
  }, [playTrack]);

  const handleAlbumPress = useCallback((album: Album) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/album/[id]', params: { id: album.id } });
  }, []);

  const handleArtistPress = useCallback((artist: Artist) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleTabChange = (tab: LibraryTab) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);
  };

  const renderTrack = useCallback(({ item, index }: { item: Track; index: number }) => (
    <TrackItem
      track={item}
      index={index}
      onPress={handleTrackPress}
      isPlaying={currentTrack?.id === item.id}
    />
  ), [currentTrack, handleTrackPress]);

  const renderAlbum = useCallback(({ item }: { item: Album }) => (
    <AlbumCard album={item} onPress={handleAlbumPress} />
  ), [handleAlbumPress]);

  const renderArtist = useCallback(({ item }: { item: Artist }) => (
    <ArtistRow artist={item} onPress={handleArtistPress} />
  ), [handleArtistPress]);

  return (
    <PermissionGate>
      <View style={[styles.container, { paddingTop: topInset }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Library</Text>
          <View style={styles.statsRow}>
            <Text style={styles.statsText}>
              {tracks.length} tracks · {albums.length} albums
            </Text>
          </View>
        </View>

        <View style={styles.tabBar}>
          {(['tracks', 'albums', 'artists'] as LibraryTab[]).map(tab => (
            <Pressable
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => handleTabChange(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'tracks' ? 'Tracks' : tab === 'albums' ? 'Albums' : 'Artists'}
              </Text>
            </Pressable>
          ))}
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Scanning your library...</Text>
          </View>
        ) : (
          <>
            {activeTab === 'tracks' && (
              <FlatList
                data={tracks}
                renderItem={renderTrack}
                keyExtractor={item => item.id}
                contentContainerStyle={[styles.listContent, { paddingBottom: currentTrack ? 160 : 100 }]}
                showsVerticalScrollIndicator={false}
                scrollEnabled={!!tracks.length}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor={Colors.primary}
                  />
                }
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Ionicons name="musical-notes-outline" size={48} color={Colors.textTertiary} />
                    <Text style={styles.emptyTitle}>No tracks found</Text>
                    <Text style={styles.emptyText}>
                      Add music files to your device and pull to refresh
                    </Text>
                  </View>
                }
              />
            )}

            {activeTab === 'albums' && (
              <FlatList
                data={albums}
                renderItem={renderAlbum}
                keyExtractor={item => item.id}
                numColumns={2}
                columnWrapperStyle={styles.albumGrid}
                contentContainerStyle={[styles.albumListContent, { paddingBottom: currentTrack ? 160 : 100 }]}
                showsVerticalScrollIndicator={false}
                scrollEnabled={!!albums.length}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Ionicons name="disc-outline" size={48} color={Colors.textTertiary} />
                    <Text style={styles.emptyTitle}>No albums found</Text>
                    <Text style={styles.emptyText}>Your music will be organized by album</Text>
                  </View>
                }
              />
            )}

            {activeTab === 'artists' && (
              <FlatList
                data={artists}
                renderItem={renderArtist}
                keyExtractor={item => item.id}
                contentContainerStyle={[styles.listContent, { paddingBottom: currentTrack ? 160 : 100 }]}
                showsVerticalScrollIndicator={false}
                scrollEnabled={!!artists.length}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Ionicons name="people-outline" size={48} color={Colors.textTertiary} />
                    <Text style={styles.emptyTitle}>No artists found</Text>
                    <Text style={styles.emptyText}>Artists will appear once you have music</Text>
                  </View>
                }
              />
            )}
          </>
        )}
      </View>
    </PermissionGate>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
    gap: 4,
  },
  headerTitle: {
    color: Colors.text,
    fontSize: 32,
    fontFamily: 'Inter_700Bold',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surfaceLight,
  },
  tabActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  tabTextActive: {
    color: Colors.background,
  },
  listContent: {
    paddingTop: 4,
  },
  albumListContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    gap: 16,
  },
  albumGrid: {
    gap: 12,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 12,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    color: Colors.text,
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
});
