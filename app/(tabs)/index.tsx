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
  Modal,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeInDown,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  interpolate,
  Extrapolation,
  withRepeat,
  withTiming,
  withSequence,
  withDelay
} from 'react-native-reanimated';
import Colors from '@/constants/colors';
import { useMusic } from '@/lib/music-context';
import { PermissionGate } from '@/components/PermissionGate';
import { TrackItem } from '@/components/TrackItem';
import { PlaylistCard } from '@/components/PlaylistCard';
import { ArtistRow } from '@/components/ArtistRow';
import { BouncyButton } from '@/components/BouncyButton';
import { Track, Playlist, Artist, getQualityTier } from '@/lib/types';

type LibraryTab = 'tracks' | 'playlists' | 'artists';
type SortOrder = 'default' | 'quality-desc' | 'quality-asc';

export default function LibraryScreen() {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const topInset = isWeb ? 67 : insets.top;
  const [activeTab, setActiveTab] = useState<LibraryTab>('tracks');
  const [sortOrder, setSortOrder] = useState<SortOrder>('default');
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  const { tracks, playlists, artists, currentTrack, isPlaying, playTrack, playAlbum, isLoading, scanLibrary, createPlaylist } = useMusic();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await scanLibrary();
    setRefreshing(false);
  }, [scanLibrary]);

  const handleTrackPress = useCallback((track: Track) => {
    playTrack(track);
  }, [playTrack]);

  const handlePlaylistPress = useCallback((playlist: Playlist) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/playlist/[id]', params: { id: playlist.id } });
  }, []);

  const handleArtistPress = useCallback((artist: Artist) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/artist/[id]', params: { id: artist.id } });
  }, []);

  const handleCreatePlaylist = async () => {
    if (newPlaylistName.trim()) {
      await createPlaylist(newPlaylistName.trim());
      setNewPlaylistName('');
      setShowCreatePlaylist(false);
    }
  };

  const toggleSort = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSortOrder(prev => {
      if (prev === 'default') return 'quality-desc';
      if (prev === 'quality-desc') return 'quality-asc';
      return 'default';
    });
  };

  const sortedTracks = React.useMemo(() => {
    if (sortOrder === 'default') return tracks;
    return [...tracks].sort((a, b) => {
      const tierA = getQualityTier(a.bitrate, a.format);
      const tierB = getQualityTier(b.bitrate, b.format);
      const order = { lossless: 3, high: 2, standard: 1, low: 0 };
      const valA = order[tierA];
      const valB = order[tierB];
      if (sortOrder === 'quality-desc') {
        return valB - valA;
      } else {
        return valA - valB;
      }
    });
  }, [tracks, sortOrder]);

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

  const renderPlaylist = useCallback(({ item, index }: { item: Playlist; index: number }) => (
    <PlaylistCard playlist={item} onPress={handlePlaylistPress} />
  ), [handlePlaylistPress]);

  const renderArtist = useCallback(({ item, index }: { item: Artist; index: number }) => (
    <ArtistRow artist={item} onPress={handleArtistPress} />
  ), [handleArtistPress]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buongiorno';
    if (hour < 18) return 'Buon pomeriggio';
    return 'Buonasera';
  };

  // Mini Visualizer Bar
  const VisualizerBar = ({ delayValue }: { delayValue: number }) => {
    const height = useSharedValue(4);

    React.useEffect(() => {
      if (isPlaying) {
        height.value = withRepeat(
          withSequence(
            withTiming(12 + Math.random() * 8, { duration: 300 }),
            withTiming(4, { duration: 300 })
          ),
          -1,
          true
        );
      } else {
        height.value = withTiming(4, { duration: 300 });
      }
    }, [isPlaying]);

    const barStyle = useAnimatedStyle(() => ({
      height: height.value,
    }));

    return <Animated.View style={[styles.visualizerBar, barStyle]} />;
  };

  return (
    <PermissionGate>
      <View style={[styles.container, { paddingTop: topInset }]}>

        {/* Dynamic Mesh-like Background Layer */}
        <View style={StyleSheet.absoluteFill}>
          <LinearGradient
            colors={['rgba(27, 206, 166, 0.15)', 'rgba(255, 255, 255, 0.05)', 'transparent']}
            locations={[0, 0.2, 0.5]}
            style={StyleSheet.absoluteFill}
          />
        </View>

        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.headerTitle}>{getGreeting()}</Text>
            <View style={styles.visualizerContainer}>
              <VisualizerBar delayValue={0} />
              <VisualizerBar delayValue={150} />
              <VisualizerBar delayValue={300} />
            </View>
          </View>
          <View style={styles.statsRow}>
            <Text style={styles.statsText}>
              {tracks.length} tracks · {playlists.length} playlists
            </Text>
            {activeTab === 'tracks' && (
              <Pressable onPress={toggleSort} style={styles.sortButton}>
                <Ionicons
                  name={sortOrder === 'default' ? 'swap-vertical' : (sortOrder === 'quality-desc' ? 'arrow-down' : 'arrow-up')}
                  size={16}
                  color={sortOrder === 'default' ? Colors.textTertiary : Colors.primary}
                />
                <Text style={[styles.sortText, sortOrder !== 'default' && { color: Colors.primary }]}>
                  {sortOrder === 'default' ? 'Default' : 'Quality'}
                </Text>
              </Pressable>
            )}
            {activeTab === 'playlists' && (
              <Pressable onPress={() => setShowCreatePlaylist(true)} style={styles.sortButton}>
                <Ionicons name="add-circle" size={16} color={Colors.primary} />
                <Text style={[styles.sortText, { color: Colors.primary }]}>New</Text>
              </Pressable>
            )}
          </View>
        </View>

        <View style={styles.tabBar}>
          {(['tracks', 'playlists', 'artists'] as LibraryTab[]).map(tab => (
            <Pressable
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => handleTabChange(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'tracks' ? 'Tracks' : tab === 'playlists' ? 'Playlists' : 'Artists'}
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
                data={sortedTracks}
                renderItem={renderTrack}
                keyExtractor={item => item.id}
                contentContainerStyle={[styles.listContent, { paddingBottom: currentTrack ? 160 : 100 }]}
                showsVerticalScrollIndicator={false}
                scrollEnabled={!!tracks.length}
                initialNumToRender={12}
                maxToRenderPerBatch={10}
                windowSize={5}
                removeClippedSubviews={true}
                getItemLayout={(data, index) => ({
                  length: 68,
                  offset: 68 * index,
                  index,
                })}
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

            {activeTab === 'playlists' && (
              <FlatList
                data={playlists}
                renderItem={renderPlaylist}
                keyExtractor={item => item.id}
                numColumns={2}
                columnWrapperStyle={styles.albumGrid}
                contentContainerStyle={[styles.albumListContent, { paddingBottom: currentTrack ? 160 : 100 }]}
                showsVerticalScrollIndicator={false}
                scrollEnabled={!!playlists.length}
                initialNumToRender={10}
                maxToRenderPerBatch={10}
                windowSize={5}
                removeClippedSubviews={true}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Ionicons name="list-outline" size={48} color={Colors.textTertiary} />
                    <Text style={styles.emptyTitle}>No custom playlists</Text>
                    <Text style={styles.emptyText}>You haven't created any playlists yet.</Text>
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
                initialNumToRender={15}
                maxToRenderPerBatch={15}
                windowSize={5}
                removeClippedSubviews={true}
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

        <Modal
          visible={showCreatePlaylist}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setShowCreatePlaylist(false)}
        >
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>New Playlist</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Playlist Name"
                placeholderTextColor={Colors.textTertiary}
                value={newPlaylistName}
                onChangeText={setNewPlaylistName}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleCreatePlaylist}
              />
              <View style={styles.modalActions}>
                <Pressable style={styles.modalButton} onPress={() => setShowCreatePlaylist(false)}>
                  <Text style={styles.modalButtonCancel}>Cancel</Text>
                </Pressable>
                <BouncyButton style={styles.modalButtonPrimary} onPress={handleCreatePlaylist}>
                  <Text style={styles.modalButtonSave}>Create</Text>
                </BouncyButton>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: Colors.text,
    fontSize: 32,
    fontFamily: 'Inter_700Bold',
  },
  visualizerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    height: 24,
    paddingBottom: 4,
  },
  visualizerBar: {
    width: 4,
    backgroundColor: Colors.tidalCyan,
    borderRadius: 2,
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
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: 12,
    marginLeft: 12,
  },
  sortText: {
    color: Colors.textTertiary,
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    color: Colors.text,
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 16,
    textAlign: 'center',
  },
  textInput: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    padding: 16,
    color: Colors.text,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    justifyContent: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    justifyContent: 'center',
  },
  modalButtonCancel: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
  },
  modalButtonSave: {
    color: Colors.background,
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
});
