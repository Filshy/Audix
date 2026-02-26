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
import Colors from '@/constants/colors';
import { useMusic } from '@/lib/music-context';
import { TrackItem } from '@/components/TrackItem';
import { Track, formatDuration } from '@/lib/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HEADER_ART_SIZE = SCREEN_WIDTH * 0.55;

export default function PlaylistDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const insets = useSafeAreaInsets();
    const isWeb = Platform.OS === 'web';
    const topInset = isWeb ? 67 : insets.top;
    const bottomInset = isWeb ? 34 : insets.bottom;

    const { playlists, currentTrack, playTrack, queue, togglePlayPause } = useMusic();

    const playlist = useMemo(() => playlists.find(p => p.id === id), [playlists, id]);

    const totalDuration = useMemo(() => {
        if (!playlist) return 0;
        return playlist.tracks.reduce((sum, t) => sum + t.duration, 0);
    }, [playlist]);

    const handleTrackPress = useCallback((track: Track) => {
        if (playlist) {
            if (currentTrack?.id === track.id) {
                togglePlayPause();
            } else {
                playTrack(track);
                // We could theoretically set the queue to the playlist here if playTrack doesn't already
            }
        }
    }, [playlist, currentTrack, playTrack, togglePlayPause]);

    const handlePlayAll = useCallback(() => {
        if (playlist && playlist.tracks.length > 0) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            playTrack(playlist.tracks[0]);
        }
    }, [playlist, playTrack]);

    if (!playlist) {
        return (
            <View style={[styles.container, { paddingTop: topInset }]}>
                <View style={styles.topBar}>
                    <Pressable onPress={() => router.back()} hitSlop={12}>
                        <Ionicons name="arrow-back" size={24} color={Colors.text} />
                    </Pressable>
                </View>
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Playlist not found</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { paddingTop: topInset }]}>
            <View style={styles.topBar}>
                <Pressable onPress={() => router.back()} hitSlop={12}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </Pressable>
                <Pressable onPress={() => { }} hitSlop={12}>
                    <Ionicons name="ellipsis-horizontal" size={24} color={Colors.text} />
                </Pressable>
            </View>

            <FlatList
                data={playlist.tracks}
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
                scrollEnabled={!!playlist.tracks.length}
                showsVerticalScrollIndicator={false}
                initialNumToRender={20}
                maxToRenderPerBatch={20}
                windowSize={5}
                removeClippedSubviews={true}
                contentContainerStyle={{ paddingBottom: currentTrack ? 160 : bottomInset + 40 }}
                ListHeaderComponent={
                    <View style={styles.headerSection}>
                        <View style={styles.artworkContainer}>
                            {playlist.artwork ? (
                                <Image source={{ uri: playlist.artwork }} style={styles.artwork} contentFit="cover" />
                            ) : (
                                <LinearGradient
                                    colors={[Colors.surfaceHighlight, Colors.surface]}
                                    style={styles.artworkPlaceholder}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                >
                                    <Ionicons name="list" size={60} color={Colors.textTertiary} />
                                </LinearGradient>
                            )}
                        </View>

                        <Text style={styles.playlistName}>{playlist.name}</Text>

                        <View style={styles.metaRow}>
                            <Text style={styles.metaText}>
                                {playlist.tracks.length} tracks · {formatDuration(totalDuration)}
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
                                    <Ionicons name="play" size={24} color="#000" style={{ marginLeft: 4 }} />
                                </LinearGradient>
                                <Text style={styles.playAllText}>Play</Text>
                            </Pressable>
                        </View>
                    </View>
                }
                ListEmptyComponent={
                    <View style={styles.emptyTracksContainer}>
                        <Ionicons name="musical-notes-outline" size={48} color={Colors.textTertiary} />
                        <Text style={styles.emptyTitle}>Playlist is empty</Text>
                        <Text style={styles.emptyText}>Add some tracks to this playlist</Text>
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
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 12,
        zIndex: 10,
    },
    headerSection: {
        alignItems: 'center',
        paddingTop: 10,
        paddingBottom: 24,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        marginBottom: 16,
    },
    artworkContainer: {
        width: HEADER_ART_SIZE,
        height: HEADER_ART_SIZE,
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 16,
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
    },
    playlistName: {
        color: Colors.text,
        fontSize: 28,
        fontFamily: 'Inter_700Bold',
        textAlign: 'center',
        marginBottom: 8,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 24,
    },
    metaText: {
        color: Colors.textSecondary,
        fontSize: 14,
        fontFamily: 'Inter_500Medium',
    },
    actionsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    playAllButton: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    playAllGradient: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    playAllText: {
        color: Colors.primary,
        fontSize: 12,
        fontFamily: 'Inter_600SemiBold',
        letterSpacing: 1,
        marginTop: 4,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyTracksContainer: {
        marginTop: 60,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
    },
    emptyTitle: {
        color: Colors.text,
        fontSize: 18,
        fontFamily: 'Inter_600SemiBold',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyText: {
        color: Colors.textSecondary,
        fontSize: 14,
        fontFamily: 'Inter_400Regular',
        textAlign: 'center',
    },
});
