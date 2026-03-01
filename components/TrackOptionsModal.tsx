import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView, TextInput } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useMusic } from '@/lib/music-context';

export function TrackOptionsModal() {
    const { activeTrackForOptions, closeTrackOptions, playlists, createPlaylist, addTrackToPlaylist } = useMusic();
    const [isCreating, setIsCreating] = useState(false);
    const [newPlaylistName, setNewPlaylistName] = useState('');

    if (!activeTrackForOptions) return null;

    const handleClose = () => {
        setIsCreating(false);
        setNewPlaylistName('');
        closeTrackOptions();
    };

    const handleAddToPlaylist = async (playlistId: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        await addTrackToPlaylist(playlistId, activeTrackForOptions);
        handleClose();
    };

    const handleCreatePlaylist = async () => {
        if (!newPlaylistName.trim()) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        await createPlaylist(newPlaylistName.trim());
        // The new playlist will be added to the end of the array.
        // We could automatically add the song, but the playlists array will update asynchronously.
        // For now, let's just create it and let the user tap it, or we could find it.
        setIsCreating(false);
        setNewPlaylistName('');
    };

    return (
        <Modal
            visible={true}
            transparent
            animationType="slide"
            onRequestClose={handleClose}
        >
            <Pressable style={styles.overlay} onPress={handleClose}>
                <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />

                <Pressable style={styles.content} onPress={(e) => e.stopPropagation()}>
                    <View style={styles.header}>
                        {activeTrackForOptions.artwork ? (
                            <Image source={{ uri: activeTrackForOptions.artwork }} style={styles.artwork} contentFit="cover" />
                        ) : (
                            <View style={styles.artworkPlaceholder}>
                                <Ionicons name="musical-note" size={24} color={Colors.textTertiary} />
                            </View>
                        )}
                        <View style={styles.headerInfo}>
                            <Text style={styles.title} numberOfLines={1}>{activeTrackForOptions.title}</Text>
                            <Text style={styles.artist} numberOfLines={1}>{activeTrackForOptions.artist || 'Unknown Artist'}</Text>
                        </View>
                        <Pressable onPress={handleClose} style={styles.closeBtn} hitSlop={10}>
                            <Ionicons name="close" size={24} color={Colors.textSecondary} />
                        </Pressable>
                    </View>

                    <View style={styles.divider} />

                    {isCreating ? (
                        <View style={styles.createSection}>
                            <Text style={styles.sectionTitle}>New Playlist</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Playlist name..."
                                placeholderTextColor={Colors.textTertiary}
                                value={newPlaylistName}
                                onChangeText={setNewPlaylistName}
                                autoFocus
                                onSubmitEditing={handleCreatePlaylist}
                            />
                            <View style={styles.createActions}>
                                <Pressable style={styles.actionBtn} onPress={() => setIsCreating(false)}>
                                    <Text style={styles.actionBtnText}>Cancel</Text>
                                </Pressable>
                                <Pressable
                                    style={[styles.actionBtn, styles.actionBtnPrimary, !newPlaylistName.trim() && { opacity: 0.5 }]}
                                    onPress={handleCreatePlaylist}
                                    disabled={!newPlaylistName.trim()}
                                >
                                    <Text style={[styles.actionBtnText, { color: '#000' }]}>Create</Text>
                                </Pressable>
                            </View>
                        </View>
                    ) : (
                        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
                            <Text style={styles.sectionTitle}>Add to Playlist</Text>

                            <Pressable style={styles.playlistRow} onPress={() => setIsCreating(true)}>
                                <View style={[styles.playlistIcon, { backgroundColor: Colors.surfaceLight }]}>
                                    <Ionicons name="add" size={24} color={Colors.text} />
                                </View>
                                <Text style={styles.playlistName}>New Playlist...</Text>
                            </Pressable>

                            {playlists.map(playlist => (
                                <Pressable
                                    key={playlist.id}
                                    style={styles.playlistRow}
                                    onPress={() => handleAddToPlaylist(playlist.id)}
                                >
                                    <View style={styles.playlistIcon}>
                                        <Ionicons name="list" size={20} color={Colors.textSecondary} />
                                    </View>
                                    <View style={styles.playlistInfo}>
                                        <Text style={styles.playlistName} numberOfLines={1}>{playlist.name}</Text>
                                        <Text style={styles.playlistCount}>{playlist.tracks.length} tracks</Text>
                                    </View>
                                </Pressable>
                            ))}
                            <View style={{ height: 40 }} />
                        </ScrollView>
                    )}
                </Pressable>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    content: {
        backgroundColor: '#1E1E24',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        minHeight: 300,
        maxHeight: '80%',
        padding: 24,
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginBottom: 20,
    },
    artwork: {
        width: 56,
        height: 56,
        borderRadius: 8,
    },
    artworkPlaceholder: {
        width: 56,
        height: 56,
        borderRadius: 8,
        backgroundColor: Colors.surfaceLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerInfo: {
        flex: 1,
        gap: 4,
    },
    title: {
        color: Colors.text,
        fontSize: 18,
        fontFamily: 'Inter_600SemiBold',
    },
    artist: {
        color: Colors.textSecondary,
        fontSize: 14,
        fontFamily: 'Inter_400Regular',
    },
    closeBtn: {
        padding: 4,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginBottom: 20,
    },
    sectionTitle: {
        color: Colors.textSecondary,
        fontSize: 13,
        fontFamily: 'Inter_600SemiBold',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    list: {
        flexGrow: 0,
    },
    playlistRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        paddingVertical: 12,
        paddingHorizontal: 4,
    },
    playlistIcon: {
        width: 48,
        height: 48,
        borderRadius: 8,
        backgroundColor: Colors.surfaceLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    playlistInfo: {
        flex: 1,
        gap: 4,
    },
    playlistName: {
        color: Colors.text,
        fontSize: 16,
        fontFamily: 'Inter_500Medium',
    },
    playlistCount: {
        color: Colors.textTertiary,
        fontSize: 13,
        fontFamily: 'Inter_400Regular',
    },
    createSection: {
        padding: 4,
    },
    input: {
        backgroundColor: Colors.surfaceLight,
        borderRadius: 12,
        padding: 16,
        color: Colors.text,
        fontSize: 16,
        fontFamily: 'Inter_400Regular',
        marginBottom: 24,
    },
    createActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
    },
    actionBtn: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 24,
        backgroundColor: Colors.surfaceLight,
    },
    actionBtnPrimary: {
        backgroundColor: Colors.primary,
    },
    actionBtnText: {
        color: Colors.text,
        fontSize: 15,
        fontFamily: 'Inter_600SemiBold',
    },
});
