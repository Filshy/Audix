import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { NativeTabs, Icon, Label } from "expo-router/unstable-native-tabs";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { Platform, StyleSheet, View } from "react-native";
import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { BouncyButton } from "@/components/BouncyButton";

function NativeTabLayout() {
  return (
    <View style={{ flex: 1 }}>
      <NativeTabs>
        <NativeTabs.Trigger name="index">
          {/* @ts-ignore */}
          <Icon sf={{ default: "music.note.list", selected: "music.note.list" }} md="library-music" />
          <Label>Library</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="search" role="search">
          {/* @ts-ignore */}
          <Icon sf="magnifyingglass" md="search" />
          <Label>Search</Label>
        </NativeTabs.Trigger>
      </NativeTabs>
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
            backgroundColor: isWeb ? Colors.surface : (isIOS ? 'transparent' : Colors.surface),
            borderTopWidth: 1,
            borderTopColor: Colors.border,
            height: isWeb ? 84 : (60 + insets.bottom),
            elevation: 0,
            shadowColor: 'transparent',
            paddingBottom: isWeb ? 0 : insets.bottom,
          },
          tabBarBackground: () =>
            isIOS ? (
              <BlurView
                intensity={80}
                tint="dark"
                style={StyleSheet.absoluteFill}
              />
            ) : isWeb ? (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.surface }]} />
            ) : null,
          tabBarItemStyle: {
            paddingVertical: 8,
          },
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
            tabBarButton: (props) => (
              <BouncyButton {...props} style={props.style} scaleTo={0.9} />
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
            tabBarButton: (props) => (
              <BouncyButton {...props} style={props.style} scaleTo={0.9} />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}
