import React from "react";
import { Tabs } from "expo-router";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";
import { selection } from "../../src/lib/haptics";
import { useTheme } from "../../src/stores/theme";
import { fonts } from "../../src/theme";

const TABS = [
  { name: "index",    label: "Home",    icon: "home-outline",                   iconFilled: "home" },
  { name: "search",   label: "Search",  icon: "search-outline",                 iconFilled: "search" },
  { name: "saved",    label: "Saved",   icon: "heart-outline",                  iconFilled: "heart" },
  { name: "messages", label: "Inbox",   icon: "chatbubble-ellipses-outline",    iconFilled: "chatbubble-ellipses" },
  { name: "profile",  label: "Profile", icon: "person-outline",                 iconFilled: "person" },
] as const;

function TabIcon({ name, label, focused, color }: { name: string; label: string; focused: boolean; color: string }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  React.useEffect(() => {
    if (focused) {
      scale.value = withSpring(1.12, { damping: 12, stiffness: 280 });
    } else {
      scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    }
  }, [focused]);

  return (
    <Animated.View style={[styles.tabItem, animStyle]}>
      <View style={[styles.iconWrap, focused && { backgroundColor: color + "18" }]}>
        <Ionicons
          name={(focused ? name.replace("-outline", "") : name) as keyof typeof Ionicons.glyphMap}
          size={22}
          color={color}
        />
      </View>
      <Text style={[styles.tabLabel, { color, fontFamily: focused ? fonts.sansBold : fonts.sansMedium }]}>
        {label}
      </Text>
      {focused && <View style={[styles.activeDot, { backgroundColor: color }]} />}
    </Animated.View>
  );
}

export default function TabsLayout() {
  const c = useTheme(s => s.palette);
  const insets = useSafeAreaInsets();
  const TAB_HEIGHT = 60 + insets.bottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          height: TAB_HEIGHT,
          paddingBottom: insets.bottom,
          backgroundColor: "transparent",
          borderTopWidth: 0,
          elevation: 0,
          position: "absolute",
        },
        tabBarBackground: () => (
          <BlurView
            intensity={Platform.OS === "ios" ? 70 : 50}
            tint={c.bg === "#07100D" ? "dark" : "light"}
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: c.glass,
                borderTopWidth: StyleSheet.hairlineWidth,
                borderTopColor: c.border,
              },
            ]}
          />
        ),
        tabBarButton: ({ children, onPress, accessibilityState, accessibilityLabel }) => {
          const focused = !!accessibilityState?.selected;
          return (
            <Pressable
              accessibilityRole="tab"
              accessibilityLabel={accessibilityLabel}
              accessibilityState={accessibilityState}
              onPress={() => { selection(); onPress?.(); }}
              style={styles.tabButton}
              android_ripple={{ color: c.ripple, borderless: true, radius: 32 }}
            >
              {children}
            </Pressable>
          );
        },
      }}
    >
      {TABS.map(tab => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.label,
            tabBarIcon: ({ focused, color }) => (
              <TabIcon
                name={focused ? tab.iconFilled : tab.icon}
                label={tab.label}
                focused={focused}
                color={focused ? c.primary : c.muted}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabButton: { flex: 1, alignItems: "center", justifyContent: "center" },
  tabItem: { alignItems: "center", justifyContent: "center", gap: 2, paddingTop: 6 },
  iconWrap: { width: 40, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  tabLabel: { fontSize: 10, letterSpacing: 0.2 },
  activeDot: { width: 4, height: 4, borderRadius: 2, marginTop: 2 },
});
