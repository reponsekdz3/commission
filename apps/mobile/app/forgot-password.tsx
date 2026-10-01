import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { api } from "../src/lib/api";
import { Input, Button } from "../src/components/ui";
import { useTheme } from "../src/stores/theme";
import { fonts, radius, spacing } from "../src/theme";

export default function ForgotPassword() {
  const c = useTheme(s => s.palette);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      await api("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) });
      router.push({ pathname: "/reset-password", params: { email } });
    } catch (e) {
      Alert.alert("Recovery", e instanceof Error ? e.message : "Unable to send recovery code");
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[s.root, { backgroundColor: c.bg }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={s.brandRow}>
          <View style={[s.brandMark, { backgroundColor: c.primary }]}>
            <Text style={[s.brandMarkText, { color: c.primaryFg }]}>I</Text>
          </View>
          <Text style={[s.brandName, { color: c.text }]}>IMIZI</Text>
        </View>

        <Text style={[s.eyebrow, { color: c.primary, fontFamily: fonts.sansBold }]}>
          ACCOUNT RECOVERY
        </Text>
        <Text style={[s.h1, { color: c.text, fontFamily: fonts.displayStrong }]}>
          Reset your password.
        </Text>
        <Text style={[s.meta, { color: c.muted }]}>
          A six-digit code will be sent to your account email so you can choose a new password.
        </Text>

        <View style={[s.card, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="you@example.com"
          />
          <Button
            title={busy ? "Sending…" : "Send recovery code"}
            onPress={() => void submit()}
            disabled={busy || !email.includes("@")}
          />
        </View>

        <Pressable style={s.back} onPress={() => router.back()}>
          <Text style={{ color: c.subtle, fontFamily: fonts.sansSemi }}>Back to sign in</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: Platform.OS === "ios" ? 64 : 40,
    paddingBottom: 40,
    justifyContent: "center",
    gap: 8,
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 20 },
  brandMark: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  brandMarkText: { fontFamily: fonts.displayStrong, fontSize: 16 },
  brandName: { fontFamily: fonts.displayStrong, fontSize: 18, letterSpacing: 3 },
  eyebrow: { fontSize: 11, letterSpacing: 2 },
  h1: { fontSize: 34, marginTop: 4, letterSpacing: -1 },
  meta: { lineHeight: 21, marginBottom: 16, fontSize: 14 },
  card: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: 12,
  },
  back: { paddingVertical: 18, alignItems: "center" },
});
