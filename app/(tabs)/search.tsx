import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import Colors from '@/constants/colors';
import { useMusic } from '@/lib/music-context';
import { TrackItem } from '@/components/TrackItem';
import { AlbumCard } from '@/components/AlbumCard';
import { Track, Album } from '@/lib/types';

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const topInset = isWeb ? 67 : insets.top;
  const [query, setQuery] = useState('');
  const { tracks, albums, currentTrack, playTrack } = useMusic();

  const filteredTracks = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return tracks.filter(t =>
      t.title.toLowerCase().includes(q) ||
      t.artist.toLowerCase().includes(q) ||
      t.album.toLowerCase().includes(q)
    ).slice(0, 20);
  }, [query, tracks]);

  const filteredAlbums = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return albums.filter(a =>
      a.name.toLowerCase().includes(q) ||
      a.artist.toLowerCase().includes(q)
    ).slice(0, 10);
  }, [query, albums]);

  const handleTrackPress = useCallback((track: Track) => {
    playTrack(track);
  }, [playTrack]);

  const handleAlbumPress = useCallback((album: Album) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/album/[id]', params: { id: album.id } });
  }, []);

  const hasResults = filteredTracks.length > 0 || filteredAlbums.length > 0;

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Search</Text>
      </View>

      <View style={styles.searchBarContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={Colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Songs, artists, albums..."
            placeholderTextColor={Colors.textTertiary}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={Colors.textTertiary} />
            </Pressable>
          )}
        </View>
      </View>

      {!query.trim() ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={48} color={Colors.textTertiary} />
          <Text style={styles.emptyTitle}>Find your music</Text>
          <Text style={styles.emptyText}>Search by song, artist, or album name</Text>
        </View>
      ) : !hasResults ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="musical-notes-outline" size={48} color={Colors.textTertiary} />
          <Text style={styles.emptyTitle}>No results</Text>
          <Text style={styles.emptyText}>Try a different search term</Text>
        </View>
      ) : (
        <FlatList
          data={[]}
          renderItem={null}
          keyExtractor={() => ''}
          scrollEnabled={true}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.listContent, { paddingBottom: currentTrack ? 160 : 100 }]}
          ListHeaderComponent={
            <>
              {filteredAlbums.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Albums</Text>
                  <FlatList
                    data={filteredAlbums}
                    renderItem={({ item }) => <AlbumCard album={item} onPress={handleAlbumPress} />}
                    keyExtractor={item => item.id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.horizontalList}
                    scrollEnabled={!!filteredAlbums.length}
                  />
                </View>
              )}

              {filteredTracks.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Tracks</Text>
                  {filteredTracks.map((track, i) => (
                    <TrackItem
                      key={track.id}
                      track={track}
                      onPress={handleTrackPress}
                      isPlaying={currentTrack?.id === track.id}
                    />
                  ))}
                </View>
              )}
            </>
          }
        />
      )}
    </View>
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
  },
  headerTitle: {
    color: Colors.text,
    fontSize: 32,
    fontFamily: 'Inter_700Bold',
  },
  searchBarContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: Colors.text,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
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
  listContent: {
    paddingTop: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  horizontalList: {
    paddingHorizontal: 16,
    gap: 12,
  },
});
