import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import { Platform, View } from "react-native";
import { router } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import {
  Sora_600SemiBold,
  Sora_700Bold,
  Sora_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/sora";
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from "@expo-google-fonts/plus-jakarta-sans";
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
} from "@expo-google-fonts/jetbrains-mono";
import { api } from "../src/lib/api";
import { asyncStoragePersister } from "../src/lib/queryPersistence";
import { ThemeProvider, useTheme } from "../src/stores/theme";
import { DebugPanel } from "../src/components/DebugPanel";

const client = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 24 * 60 * 60 * 1000,
      retry: 1,
      refetchOnReconnect: true,
    },
  },
});

function AppStack() {
  const c = useTheme((s) => s.palette);
  return (
    <>
      <StatusBar style={c.statusBar === "#07100D" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: c.bg },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="login" />
      </Stack>
    </>
  );
}

export default function Root() {
  const c = useTheme((s) => s.palette);
  const [fontsLoaded] = useFonts({
    Sora_600SemiBold,
    Sora_700Bold,
    Sora_800ExtraBold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
  });

  useEffect(() => {
    const open = (response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data as any;
      if (!data) return;
      if (data.type === "chat" || data.threadId || data.conversationId) router.push({ pathname: "/chat/[threadId]", params: { threadId: String(data.threadId || data.conversationId) } });
      else if (data.type === "property" || data.propertyId) router.push({ pathname: "/property/[id]", params: { id: String(data.propertyId) } });
      else if (data.type === "booking" || data.bookingId) router.push({ pathname: "/booking/[id]", params: { id: String(data.bookingId) } });
    };
    const sub = Notifications.addNotificationResponseReceivedListener(open);
    Notifications.getLastNotificationResponseAsync().then((r) => { if (r) open(r); }).catch(() => {});
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (Platform.OS === "web") return;
    void (async () => {
      try {
        const permission = await Notifications.getPermissionsAsync();
        let status = permission.status;
        if (status !== "granted") status = (await Notifications.requestPermissionsAsync()).status;
        if (status !== "granted") return;
        const projectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID;
        if (!projectId) return;
        const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        await api(
          "/notifications/push-token",
          {
            method: "POST",
            body: JSON.stringify({
              token,
              platform: Platform.OS === "ios" ? "ios" : "android",
            }),
          },
          true,
        );
      } catch {
        // Push registration is best-effort and must not block app startup.
      }
    })();
  }, []);

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: c.bg }} />;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <PersistQueryClientProvider
            client={client}
            persistOptions={{ persister: asyncStoragePersister, maxAge: 24 * 60 * 60 * 1000 }}
          >
            <><AppStack /><DebugPanel /></>
          </PersistQueryClientProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
