import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import { useMusic } from '@/lib/music-context';
import { BlurView } from 'expo-blur';

export function SettingsModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
    const { customScanPaths, addCustomScanPath, removeCustomScanPath } = useMusic();

    const getFolderName = (uri: string) => {
        try {
            return decodeURIComponent(uri.split('/').pop() || uri).replace(/%3A/g, ':');
        } catch {
            return uri;
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
            <BlurView style={styles.overlay} intensity={80} tint="dark">
                <View style={styles.content}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Impostazioni</Text>
                        <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
                            <Ionicons name="close" size={24} color={Colors.textSecondary} />
                        </Pressable>
                    </View>

                    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
                        <Text style={styles.sectionTitle}>Cartelle di Scansione</Text>
                        <Text style={styles.description}>
                            Di default, l'app cerca la musica in tutte le cartelle di sistema. Se vuoi restringere la ricerca per nascondere file indesiderati (es. vocali di WhatsApp), seleziona cartelle specifiche qui sotto.
                        </Text>

                        {customScanPaths.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Ionicons name="folder-open-outline" size={32} color={Colors.textTertiary} />
                                <Text style={styles.emptyText}>Tutte le cartelle scansionate.</Text>
                            </View>
                        ) : (
                            <View style={styles.pathsList}>
                                {customScanPaths.map((path, idx) => (
                                    <View key={`path-${idx}`} style={styles.pathItem}>
                                        <View style={styles.pathInfo}>
                                            <Ionicons name="folder" size={20} color={Colors.primary} />
                                            <Text style={styles.pathText} numberOfLines={1}>{getFolderName(path)}</Text>
                                        </View>
                                        <Pressable onPress={() => removeCustomScanPath(path)} hitSlop={12}>
                                            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                                        </Pressable>
                                    </View>
                                ))}
                            </View>
                        )}

                        <Pressable style={styles.addButton} onPress={addCustomScanPath}>
                            <Ionicons name="add-circle-outline" size={20} color={Colors.background} />
                            <Text style={styles.addButtonText}>Aggiungi Cartella</Text>
                        </Pressable>
                    </ScrollView>
                </View>
            </BlurView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    content: {
        backgroundColor: Colors.surface,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingTop: 24,
        paddingHorizontal: 24,
        paddingBottom: 48,
        maxHeight: '90%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 28,
    },
    title: {
        color: Colors.text,
        fontSize: 28,
        fontFamily: 'Inter_700Bold',
    },
    closeBtn: {
        backgroundColor: Colors.surfaceHighlight,
        padding: 10,
        borderRadius: 24,
    },
    scroll: {
        flexGrow: 0,
    },
    scrollContent: {
        gap: 16,
    },
    sectionTitle: {
        color: Colors.text,
        fontSize: 20,
        fontFamily: 'Inter_600SemiBold',
        marginBottom: 4,
    },
    description: {
        color: Colors.textSecondary,
        fontSize: 15,
        fontFamily: 'Inter_400Regular',
        lineHeight: 22,
        marginBottom: 12,
    },
    emptyState: {
        backgroundColor: Colors.surfaceHighlight,
        padding: 32,
        borderRadius: 20,
        alignItems: 'center',
        gap: 12,
    },
    emptyText: {
        color: Colors.textTertiary,
        fontSize: 15,
        fontFamily: 'Inter_500Medium',
    },
    pathsList: {
        gap: 12,
    },
    pathItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.surfaceHighlight,
        padding: 16,
        borderRadius: 16,
    },
    pathInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        flex: 1,
        paddingRight: 16,
    },
    pathText: {
        color: Colors.text,
        fontSize: 16,
        fontFamily: 'Inter_500Medium',
    },
    addButton: {
        backgroundColor: Colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 18,
        borderRadius: 16,
        gap: 10,
        marginTop: 12,
    },
    addButtonText: {
        color: Colors.background,
        fontSize: 17,
        fontFamily: 'Inter_600SemiBold',
    },
});
