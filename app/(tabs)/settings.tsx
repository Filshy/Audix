import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useMusic } from '@/lib/music-context';
import { Equalizer } from '@/components/Equalizer';
import { BouncyButton } from '@/components/BouncyButton';

export default function SettingsScreen() {
    const insets = useSafeAreaInsets();
    const { customScanPaths, removeCustomScanPath, addCustomScanPath } = useMusic();
    const [activeTab, setActiveTab] = useState<'audio' | 'paths'>('audio');

    return (
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Impostazioni</Text>
            </View>

            {/* Tabs */}
            <View style={styles.tabsContainer}>
                <Pressable
                    style={[styles.tab, activeTab === 'audio' && styles.tabActive]}
                    onPress={() => setActiveTab('audio')}
                >
                    <Text style={[styles.tabText, activeTab === 'audio' && styles.tabTextActive]}>Audio</Text>
                </Pressable>
                <Pressable
                    style={[styles.tab, activeTab === 'paths' && styles.tabActive]}
                    onPress={() => setActiveTab('paths')}
                >
                    <Text style={[styles.tabText, activeTab === 'paths' && styles.tabTextActive]}>Libreria</Text>
                </Pressable>
            </View>

            {/* Content */}
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {activeTab === 'audio' && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="options-outline" size={24} color={Colors.primary} />
                            <Text style={styles.sectionTitle}>Equalizzatore Audiofilo</Text>
                        </View>
                        <Text style={styles.sectionSubtitle}>
                            Regola le frequenze per ottimizzare la tua esperienza di ascolto.
                        </Text>
                        <Equalizer />
                    </View>
                )}

                {activeTab === 'paths' && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="folder-open-outline" size={24} color={Colors.primary} />
                            <Text style={styles.sectionTitle}>Percorsi di Scansione</Text>
                        </View>
                        <Text style={styles.sectionSubtitle}>
                            Seleziona cartelle specifiche per limitare la ricerca della musica.
                        </Text>

                        <View style={styles.pathsList}>
                            {customScanPaths.length === 0 ? (
                                <View style={styles.emptyPathsContainer}>
                                    <Ionicons name="document-text-outline" size={32} color={Colors.textTertiary} />
                                    <Text style={styles.emptyPathsText}>Nessuna cartella personalizzata.</Text>
                                </View>
                            ) : (
                                customScanPaths.map((path) => (
                                    <View key={path} style={styles.pathItem}>
                                        <View style={styles.pathInfo}>
                                            <Ionicons name="folder" size={20} color={Colors.textSecondary} />
                                            <Text style={styles.pathText} numberOfLines={2}>
                                                {decodeURIComponent(path.split('/').pop() || path)}
                                            </Text>
                                        </View>
                                        <Pressable
                                            style={styles.removePathBtn}
                                            hitSlop={8}
                                            onPress={() => removeCustomScanPath(path)}
                                        >
                                            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                                        </Pressable>
                                    </View>
                                ))
                            )}

                            <BouncyButton style={styles.addPathBtn} onPress={addCustomScanPath}>
                                <Ionicons name="add" size={20} color="#000" />
                                <Text style={styles.addPathText}>Aggiungi Cartella</Text>
                            </BouncyButton>
                        </View>
                    </View>
                )}
            </ScrollView>
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
        paddingVertical: 16,
    },
    headerTitle: {
        color: Colors.text,
        fontSize: 28,
        fontFamily: 'Inter_700Bold',
    },
    tabsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginTop: 8,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    tab: {
        paddingVertical: 12,
        marginRight: 24,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabActive: {
        borderBottomColor: Colors.primary,
    },
    tabText: {
        color: Colors.textSecondary,
        fontSize: 15,
        fontFamily: 'Inter_600SemiBold',
    },
    tabTextActive: {
        color: Colors.text,
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    section: {
        marginBottom: 32,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 8,
    },
    sectionTitle: {
        color: Colors.text,
        fontSize: 20,
        fontFamily: 'Inter_700Bold',
    },
    sectionSubtitle: {
        color: Colors.textSecondary,
        fontSize: 14,
        fontFamily: 'Inter_400Regular',
        marginBottom: 20,
        lineHeight: 20,
    },
    pathsList: {
        gap: 12,
    },
    pathItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.surface,
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    pathInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        flex: 1,
        marginRight: 16,
    },
    pathText: {
        color: Colors.text,
        fontSize: 15,
        fontFamily: 'Inter_500Medium',
    },
    removePathBtn: {
        padding: 8,
        backgroundColor: 'rgba(255,59,48,0.1)',
        borderRadius: 12,
    },
    emptyPathsContainer: {
        alignItems: 'center',
        paddingVertical: 40,
        gap: 12,
        backgroundColor: Colors.surface,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    emptyPathsText: {
        color: Colors.textSecondary,
        fontSize: 15,
        fontFamily: 'Inter_400Regular',
    },
    addPathBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: Colors.primary,
        paddingVertical: 16,
        borderRadius: 20,
        marginTop: 12,
    },
    addPathText: {
        color: Colors.background,
        fontSize: 16,
        fontFamily: 'Inter_600SemiBold',
    },
});
