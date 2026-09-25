
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function Layout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShadowVisible: false, headerTintColor: "#183c2c" }}>
        <Stack.Screen name="index" options={{ title: "Imizi" }} />
        <Stack.Screen name="login" options={{ title: "Sign in" }} />
        <Stack.Screen name="search" options={{ title: "Search properties" }} />
        <Stack.Screen name="map" options={{ title: "Nearby map" }} />
        <Stack.Screen name="property/[id]" options={{ title: "Property" }} />
        <Stack.Screen name="booking" options={{ title: "Book" }} />
        <Stack.Screen name="messages" options={{ title: "Messages" }} />
      </Stack>
    </>
  );
}
