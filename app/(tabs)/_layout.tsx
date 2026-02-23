import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { NativeTabs, Icon, Label } from "expo-router/unstable-native-tabs";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { Platform, StyleSheet, View } from "react-native";
import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { MiniPlayer } from "@/components/MiniPlayer";

function NativeTabLayout() {
  return (
    <View style={{ flex: 1 }}>
      <NativeTabs>
        <NativeTabs.Trigger name="index">
          <Icon sf={{ default: "music.note.list", selected: "music.note.list" }} md="library-music" />
          <Label>Library</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="search" role="search">
          <Icon sf="magnifyingglass" md="search" />
          <Label>Search</Label>
        </NativeTabs.Trigger>
      </NativeTabs>
      <MiniPlayer />
    </View>
  );
}

function ClassicTabLayout() {
  const isWeb = Platform.OS === "web";
  const isIOS = Platform.OS === "ios";
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.textTertiary,
          tabBarStyle: {
            position: "absolute",
            backgroundColor: isIOS ? "transparent" : Colors.surface,
            borderTopWidth: isWeb ? 1 : 0,
            borderTopColor: Colors.border,
            elevation: 0,
            ...(isWeb ? { height: 84 } : {}),
          },
          tabBarBackground: () =>
            isIOS ? (
              <BlurView
                intensity={100}
                tint="dark"
                style={StyleSheet.absoluteFill}
              />
            ) : isWeb ? (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.surface }]} />
            ) : null,
          tabBarLabelStyle: {
            fontFamily: 'Inter_500Medium',
            fontSize: 11,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Library",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="library" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: "Search",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="search" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
      <MiniPlayer />
    </View>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}
