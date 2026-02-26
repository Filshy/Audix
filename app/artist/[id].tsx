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
const HEADER_ART_SIZE = 120;

export default function ArtistDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const insets = useSafeAreaInsets();
    const isWeb = Platform.OS === 'web';
    const topInset = isWeb ? 67 : insets.top;
    const bottomInset = isWeb ? 34 : insets.bottom;

    const { artists, tracks, currentTrack, playTrack, togglePlayPause } = useMusic();

    const artist = useMemo(() => artists.find(a => a.id === id) || artists.find(a => a.name === id), [artists, id]);

    const artistTracks = useMemo(() => {
        if (!artist) return [];
        return tracks.filter(t => t.artist === artist.name);
    }, [artist, tracks]);

    const totalDuration = useMemo(() => {
        return artistTracks.reduce((sum, t) => sum + t.duration, 0);
    }, [artistTracks]);

    const handleTrackPress = useCallback((track: Track) => {
        if (artist) {
            if (currentTrack?.id === track.id) {
                togglePlayPause();
            } else {
                playTrack(track);
            }
        }
    }, [artist, currentTrack, playTrack, togglePlayPause]);

    const handlePlayAll = useCallback(() => {
        if (artistTracks.length > 0) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            playTrack(artistTracks[0]);
        }
    }, [artistTracks, playTrack]);

    if (!artist) {
        return (
            <View style={[styles.container, { paddingTop: topInset }]}>
                <View style={styles.topBar}>
                    <Pressable onPress={() => router.back()} hitSlop={12}>
                        <Ionicons name="arrow-back" size={24} color={Colors.text} />
                    </Pressable>
                </View>
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Artist not found</Text>
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
            </View>

            <FlatList
                data={artistTracks}
                renderItem={({ item, index }) => (
                    <TrackItem
                        track={item}
                        index={index}
                        onPress={handleTrackPress}
                        isPlaying={currentTrack?.id === item.id}
                    />
                )}
                keyExtractor={item => item.id}
                scrollEnabled={!!artistTracks.length}
                showsVerticalScrollIndicator={false}
                initialNumToRender={20}
                maxToRenderPerBatch={20}
                windowSize={5}
                removeClippedSubviews={true}
                contentContainerStyle={{ paddingBottom: currentTrack ? 160 : bottomInset + 40 }}
                ListHeaderComponent={
                    <View style={styles.headerSection}>
                        <View style={styles.artworkContainer}>
                            {artist.artwork ? (
                                <Image source={{ uri: artist.artwork }} style={styles.artwork} contentFit="cover" />
                            ) : (
                                <LinearGradient
                                    colors={[Colors.surfaceHighlight, Colors.surface]}
                                    style={styles.artworkPlaceholder}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                >
                                    <Ionicons name="person" size={50} color={Colors.textTertiary} />
                                </LinearGradient>
                            )}
                        </View>

                        <Text style={styles.artistName}>{artist.name}</Text>

                        <View style={styles.metaRow}>
                            <Text style={styles.metaText}>
                                {artist.albums.length} albums · {artistTracks.length} tracks
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
        borderRadius: HEADER_ART_SIZE / 2,
        overflow: 'hidden',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
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
    artistName: {
        color: Colors.text,
        fontSize: 26,
        fontFamily: 'Inter_700Bold',
        textAlign: 'center',
        marginBottom: 8,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 20,
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
        width: 56,
        height: 56,
        borderRadius: 28,
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
    emptyText: {
        color: Colors.textSecondary,
        fontSize: 16,
        fontFamily: 'Inter_400Regular',
    },
});
