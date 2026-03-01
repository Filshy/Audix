import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '@/constants/colors';

const BAND_LABELS = ['60Hz', '230Hz', '910Hz', '3.6kHz', '14kHz'];

const PRESETS: Record<string, number[]> = {
    Flat: [0, 0, 0, 0, 0],
    Bass: [6, 4, 0, 2, 0],
    Acoustic: [3, 1, 2, 4, 3],
    Electronic: [5, 3, -2, 4, 4],
    Rock: [4, -2, 1, 3, 5],
    Vocal: [-2, 1, 4, 3, 0],
};

export function Equalizer() {
    const [activePreset, setActivePreset] = useState('Flat');
    const [bands, setBands] = useState<number[]>(PRESETS.Flat);

    React.useEffect(() => {
        const loadEq = async () => {
            const saved = await AsyncStorage.getItem('user_equalizer_v1');
            if (saved) {
                const { preset, bands } = JSON.parse(saved);
                setActivePreset(preset);
                setBands(bands);
            }
        };
        loadEq();
    }, []);

    const saveEq = async (preset: string, newBands: number[]) => {
        await AsyncStorage.setItem('user_equalizer_v1', JSON.stringify({ preset, bands: newBands }));
    };

    const handleBandChange = (index: number, percentage: number) => {
        const newBands = [...bands];
        // Convert percentage 0-1 to -12 to +12 scale
        const db = Math.round((percentage * 24) - 12);
        newBands[index] = db;
        setBands(newBands);
        const newPreset = 'Custom';
        if (activePreset !== newPreset) setActivePreset(newPreset);
        saveEq(newPreset, newBands);
    };

    const applyPreset = (presetName: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setActivePreset(presetName);
        const newBands = PRESETS[presetName];
        setBands(newBands);
        saveEq(presetName, newBands);
    };

    return (
        <View style={styles.container}>
            {/* Presets Row */}
            <View style={styles.presetsWrapper}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetsList}>
                    {Object.keys(PRESETS).map(preset => (
                        <Pressable
                            key={preset}
                            style={[
                                styles.presetBtn,
                                activePreset === preset && styles.presetBtnActive
                            ]}
                            onPress={() => applyPreset(preset)}
                        >
                            <Text style={[
                                styles.presetText,
                                activePreset === preset && styles.presetTextActive
                            ]}>
                                {preset}
                            </Text>
                        </Pressable>
                    ))}
                    <Pressable
                        style={[styles.presetBtn, activePreset === 'Custom' && styles.presetBtnActive]}
                        onPress={() => setActivePreset('Custom')}
                    >
                        <Text style={[styles.presetText, activePreset === 'Custom' && styles.presetTextActive]}>Custom</Text>
                    </Pressable>
                </ScrollView>
            </View>

            {/* Main Eq Body */}
            <View style={styles.eqBody}>
                {/* Y Axis Labels */}
                <View style={styles.yAxis}>
                    <Text style={styles.yAxisLabel}>+12</Text>
                    <Text style={styles.yAxisLabel}>0</Text>
                    <Text style={styles.yAxisLabel}>-12</Text>
                </View>

                {/* Sliders Area */}
                <View style={styles.slidersContainer}>
                    {bands.map((val, index) => (
                        <View key={index} style={styles.sliderColumn}>
                            {/* Visual DB Label */}
                            <Text style={styles.currentValueLabel}>{val > 0 ? `+${val}` : val}</Text>

                            {/* Vertical Slider Wrapper */}
                            <View
                                style={[styles.verticalSliderContainer, { width: 40 }]}
                                onStartShouldSetResponder={() => true}
                                onResponderGrant={(e) => {
                                    const touchY = 140 - Math.min(140, Math.max(0, e.nativeEvent.locationY));
                                    handleBandChange(index, touchY / 140);
                                }}
                                onResponderMove={(e) => {
                                    const touchY = 140 - Math.min(140, Math.max(0, e.nativeEvent.locationY));
                                    handleBandChange(index, touchY / 140);
                                }}
                                onResponderRelease={() => Haptics.selectionAsync()}
                            >
                                <View style={styles.trackBase} pointerEvents="none">
                                    <View style={[styles.trackFill, { height: `${((val + 12) / 24) * 100}%` }]} />
                                    <View style={[styles.thumb, { bottom: `${((val + 12) / 24) * 100}%`, marginBottom: -10 }]} />
                                </View>
                            </View>

                            <Text style={styles.xAxisLabel}>{BAND_LABELS[index]}</Text>
                        </View>
                    ))}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
        backgroundColor: Colors.surface,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    presetsWrapper: {
        marginBottom: 24,
    },
    presetsList: {
        paddingRight: 16,
        gap: 8,
    },
    presetBtn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: Colors.surfaceHighlight,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    presetBtnActive: {
        backgroundColor: Colors.primary + '20',
        borderColor: Colors.primary + '50',
    },
    presetText: {
        color: Colors.textSecondary,
        fontSize: 13,
        fontFamily: 'Inter_500Medium',
    },
    presetTextActive: {
        color: Colors.primary,
    },
    eqBody: {
        flexDirection: 'row',
        height: 220,
        alignItems: 'stretch',
    },
    yAxis: {
        width: 30,
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingVertical: 20,
    },
    yAxisLabel: {
        color: Colors.textTertiary,
        fontSize: 11,
        fontFamily: 'Inter_600SemiBold',
    },
    slidersContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    sliderColumn: {
        width: 50,
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    currentValueLabel: {
        color: Colors.text,
        fontSize: 12,
        fontFamily: 'Inter_600SemiBold',
    },
    verticalSliderContainer: {
        height: 140,
        width: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    trackBase: {
        width: 6,
        height: 140,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 3,
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    trackFill: {
        width: '100%',
        backgroundColor: Colors.primary,
        borderRadius: 3,
    },
    thumb: {
        position: 'absolute',
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: Colors.text,
        borderWidth: 2,
        borderColor: Colors.primary,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    xAxisLabel: {
        color: Colors.textTertiary,
        fontSize: 11,
        fontFamily: 'Inter_500Medium',
    }
});
