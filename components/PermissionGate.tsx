import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useMusic } from '@/lib/music-context';

export function PermissionGate({ children }: { children: React.ReactNode }) {
  const { hasPermission, requestPermission, isLoading } = useMusic();

  if (Platform.OS === 'web' || hasPermission) {
    return <>{children}</>;
  }

  const handleRequest = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await requestPermission();
  };

  const handleOpenSettings = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      Linking.openSettings();
    } catch (e) {
      console.error('Could not open settings', e);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <LinearGradient
          colors={[Colors.primary + '30', Colors.accent + '30']}
          style={styles.iconGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name="musical-notes" size={48} color={Colors.primary} />
        </LinearGradient>
      </View>

      <Text style={styles.title}>Access Your Music</Text>
      <Text style={styles.description}>
        Sonora needs permission to access your music library to find and play your songs.
      </Text>

      <Pressable
        style={({ pressed }) => [styles.button, pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] }]}
        onPress={handleRequest}
      >
        <LinearGradient
          colors={[Colors.primary, Colors.primaryDim]}
          style={styles.buttonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name="shield-checkmark" size={20} color={Colors.background} />
          <Text style={styles.buttonText}>Grant Access</Text>
        </LinearGradient>
      </Pressable>

      {Platform.OS !== 'web' && (
        <Pressable onPress={handleOpenSettings} style={styles.settingsLink}>
          <Text style={styles.settingsText}>Open Settings</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  iconContainer: {
    marginBottom: 8,
  },
  iconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: Colors.text,
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
  },
  description: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
  button: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  buttonText: {
    color: Colors.background,
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  settingsLink: {
    marginTop: 8,
    padding: 8,
  },
  settingsText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textDecorationLine: 'underline',
  },
});
