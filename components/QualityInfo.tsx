import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import { Track, getQualityTier, getQualityLabel, formatFileSize } from '@/lib/types';

interface QualityInfoProps {
  track: Track;
}

export function QualityInfo({ track }: QualityInfoProps) {
  const quality = getQualityTier(track.bitrate, track.format?.toLowerCase());
  const qualityColor = Colors.quality[quality];

  return (
    <View style={styles.container}>
      <View style={[styles.qualityHeader, { borderColor: qualityColor + '40' }]}>
        <View style={[styles.qualityBadge, { backgroundColor: qualityColor + '20' }]}>
          <Ionicons name="diamond" size={12} color={qualityColor} />
          <Text style={[styles.qualityLabel, { color: qualityColor }]}>
            {getQualityLabel(quality)}
          </Text>
        </View>
      </View>

      <View style={styles.grid}>
        <View style={styles.infoItem}>
          <MaterialCommunityIcons name="file-music" size={16} color={Colors.textSecondary} />
          <Text style={styles.infoLabel}>Format</Text>
          <Text style={styles.infoValue}>{track.format || 'Unknown'}</Text>
        </View>

        <View style={styles.infoItem}>
          <Ionicons name="speedometer" size={16} color={Colors.textSecondary} />
          <Text style={styles.infoLabel}>Bitrate</Text>
          <Text style={styles.infoValue}>
            {track.bitrate ? `${track.bitrate} kbps` : 'Unknown'}
          </Text>
        </View>

        <View style={styles.infoItem}>
          <MaterialCommunityIcons name="sine-wave" size={16} color={Colors.textSecondary} />
          <Text style={styles.infoLabel}>Sample Rate</Text>
          <Text style={styles.infoValue}>
            {track.sampleRate ? `${(track.sampleRate / 1000).toFixed(1)} kHz` : 'Unknown'}
          </Text>
        </View>

        <View style={styles.infoItem}>
          <MaterialCommunityIcons name="numeric" size={16} color={Colors.textSecondary} />
          <Text style={styles.infoLabel}>Bit Depth</Text>
          <Text style={styles.infoValue}>
            {track.bitDepth ? `${track.bitDepth}-bit` : 'Unknown'}
          </Text>
        </View>

        <View style={styles.infoItem}>
          <Ionicons name="headset" size={16} color={Colors.textSecondary} />
          <Text style={styles.infoLabel}>Channels</Text>
          <Text style={styles.infoValue}>
            {track.channels === 2 ? 'Stereo' : track.channels === 1 ? 'Mono' : `${track.channels || 'Unknown'}`}
          </Text>
        </View>

        <View style={styles.infoItem}>
          <Ionicons name="document" size={16} color={Colors.textSecondary} />
          <Text style={styles.infoLabel}>File Size</Text>
          <Text style={styles.infoValue}>{formatFileSize(track.fileSize)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  qualityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qualityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  qualityLabel: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 1,
    backgroundColor: Colors.border,
    borderRadius: 12,
    overflow: 'hidden',
  },
  infoItem: {
    width: '49.5%',
    backgroundColor: Colors.surface,
    paddingVertical: 14,
    paddingHorizontal: 14,
    alignItems: 'flex-start',
    gap: 4,
  },
  infoLabel: {
    color: Colors.textTertiary,
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    color: Colors.text,
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
});
