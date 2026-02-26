import React, { memo } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { Playlist } from '@/lib/types';

interface PlaylistCardProps {
    playlist: Playlist;
    onPress: (playlist: Playlist) => void;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 64) / 2;

export const PlaylistCard = memo(function PlaylistCard({ playlist, onPress }: PlaylistCardProps) {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
        scale.value = withSpring(0.95, { damping: 12, stiffness: 400 });
    };

    const handlePressOut = () => {
        scale.value = withSpring(1, { damping: 12, stiffness: 400 });
    };

    const handlePress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress(playlist);
    };

    return (
        <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={handlePress}
        >
            <Animated.View style={[styles.container, animatedStyle]}>
                <View style={styles.artworkContainer}>
                    {playlist.artwork ? (
                        <Image source={{ uri: playlist.artwork }} style={styles.artwork} contentFit="cover" />
                    ) : (
                        <View style={styles.artworkPlaceholder}>
                            <Ionicons name="list-outline" size={40} color={Colors.textTertiary} />
                        </View>
                    )}
                </View>
                <Text style={styles.title} numberOfLines={1}>{playlist.name}</Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                    {playlist.tracks.length} track{playlist.tracks.length !== 1 ? 's' : ''}
                </Text>
            </Animated.View>
        </Pressable>
    );
});

const styles = StyleSheet.create({
    container: {
        width: CARD_WIDTH,
        marginBottom: 24,
    },
    artworkContainer: {
        width: CARD_WIDTH,
        height: CARD_WIDTH,
        borderRadius: 12,
        backgroundColor: Colors.surface,
        marginBottom: 12,
        overflow: 'hidden',
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
        backgroundColor: Colors.surfaceLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        color: Colors.text,
        fontSize: 14,
        fontFamily: 'Inter_600SemiBold',
        marginBottom: 4,
    },
    subtitle: {
        color: Colors.textSecondary,
        fontSize: 12,
        fontFamily: 'Inter_400Regular',
    },
});
