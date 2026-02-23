export interface Track {
  id: string;
  uri: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  artwork?: string;
  bitrate?: number;
  format?: string;
  sampleRate?: number;
  channels?: number;
  bitDepth?: number;
  fileSize?: number;
  filename: string;
  metadataFetched?: boolean;
}

export interface Album {
  id: string;
  name: string;
  artist: string;
  artwork?: string;
  tracks: Track[];
  year?: string;
}

export interface Artist {
  id: string;
  name: string;
  artwork?: string;
  albums: Album[];
  trackCount: number;
}

export type RepeatMode = 'off' | 'all' | 'one';

export type QualityTier = 'lossless' | 'high' | 'standard' | 'low';

export function getQualityTier(bitrate?: number, format?: string): QualityTier {
  if (format === 'flac' || format === 'alac' || format === 'wav' || format === 'aiff') {
    return 'lossless';
  }
  if (bitrate && bitrate >= 320) return 'high';
  if (bitrate && bitrate >= 192) return 'standard';
  return 'low';
}

export function getQualityLabel(tier: QualityTier): string {
  switch (tier) {
    case 'lossless': return 'LOSSLESS';
    case 'high': return 'HI-RES';
    case 'standard': return 'HIGH';
    case 'low': return 'STANDARD';
  }
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatFileSize(bytes?: number): string {
  if (!bytes) return 'Unknown';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getFormatFromFilename(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const formatMap: Record<string, string> = {
    'mp3': 'MP3',
    'flac': 'FLAC',
    'wav': 'WAV',
    'aac': 'AAC',
    'm4a': 'AAC',
    'ogg': 'OGG',
    'wma': 'WMA',
    'aiff': 'AIFF',
    'alac': 'ALAC',
    'opus': 'OPUS',
  };
  return formatMap[ext] || ext.toUpperCase();
}
