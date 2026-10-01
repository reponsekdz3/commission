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
  TextInput,
  View,
} from "react-native";
import { api } from "../src/lib/api";
import { saveSession } from "../src/lib/session";
import { colors, fonts, radius, spacing } from "../src/theme";

const c = colors.light;

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfa, setMfa] = useState("");
  const [showMfa, setShowMfa] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      const d = await api<any>("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          identifier: email,
          password,
          ...(mfa ? { mfaCode: mfa } : {}),
        }),
      });
      await saveSession(d);
      router.replace("/");
    } catch (e: any) {
      Alert.alert("Sign in", e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={s.hero}>
          <View style={s.brandRow}>
            <View style={s.brandMark}>
              <Text style={s.brandMarkText}>I</Text>
            </View>
            <Text style={s.brandName}>IMIZI</Text>
            <View style={s.brandTag}>
              <Text style={s.brandTagText}>RWANDA</Text>
            </View>
          </View>
          <Text style={s.eyebrow}>SECURE ACCESS</Text>
          <Text style={s.h1}>Welcome back.</Text>
          <Text style={s.meta}>
            Use the same production account as web to access bookings, messages and your workspace.
          </Text>
        </View>

        <View style={s.card}>
          <Text style={s.label}>Email or phone</Text>
          <TextInput
            style={s.input}
            value={email}
            onChangeText={setEmail}
            placeholder="name@example.com or +250…"
            placeholderTextColor={c.subtle}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="username"
          />

          <Text style={s.label}>Password</Text>
          <TextInput
            style={s.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Your password"
            placeholderTextColor={c.subtle}
            secureTextEntry
            textContentType="password"
          />

          <Pressable onPress={() => setShowMfa(v => !v)} style={s.mfaToggle}>
            <Text style={s.mfaToggleText}>
              {showMfa ? "Hide MFA code" : "I have an MFA code"}
            </Text>
          </Pressable>

          {showMfa && (
            <>
              <Text style={s.label}>Authenticator code</Text>
              <TextInput
                style={s.input}
                value={mfa}
                onChangeText={setMfa}
                placeholder="6-digit code"
                placeholderTextColor={c.subtle}
                keyboardType="number-pad"
                maxLength={6}
              />
            </>
          )}

          <Pressable
            style={[s.btn, busy && s.btnDisabled]}
            onPress={submit}
            disabled={busy}
          >
            <Text style={s.btnText}>{busy ? "Signing in…" : "Sign in"}</Text>
          </Pressable>

          <Pressable style={s.linkBtn} onPress={() => router.push("/forgot-password")}>
            <Text style={s.linkText}>Forgot password?</Text>
          </Pressable>
        </View>

        <Pressable style={s.cancel} onPress={() => router.back()}>
          <Text style={s.cancelText}>Cancel</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: Platform.OS === "ios" ? 64 : 40,
    paddingBottom: 40,
    justifyContent: "center",
  },
  hero: { marginBottom: spacing.xxl },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 22 },
  brandMark: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: c.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  brandMarkText: { color: c.primaryFg, fontFamily: fonts.displayStrong, fontSize: 16 },
  brandName: {
    fontFamily: fonts.displayStrong,
    fontSize: 18,
    letterSpacing: 3,
    color: c.text,
  },
  brandTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: c.primarySoft,
  },
  brandTagText: {
    fontSize: 9,
    fontFamily: fonts.sansBold,
    color: c.primary,
    letterSpacing: 1,
  },
  eyebrow: {
    fontSize: 11,
    fontFamily: fonts.sansBold,
    letterSpacing: 2,
    color: c.primary,
    marginBottom: 8,
  },
  h1: {
    fontFamily: fonts.displayStrong,
    fontSize: 36,
    color: c.text,
    letterSpacing: -1,
    lineHeight: 40,
  },
  meta: {
    marginTop: 10,
    color: c.muted,
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 22,
  },
  card: {
    backgroundColor: c.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: c.border,
    padding: spacing.lg,
    gap: 4,
  },
  label: {
    fontSize: 13,
    fontFamily: fonts.sansSemi,
    color: c.textSoft,
    marginTop: 10,
    marginBottom: 6,
  },
  input: {
    backgroundColor: c.surface2,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 14 : 12,
    fontSize: 15,
    fontFamily: fonts.sans,
    color: c.text,
  },
  mfaToggle: { paddingVertical: 12, alignSelf: "flex-start" },
  mfaToggleText: { color: c.primary, fontFamily: fonts.sansBold, fontSize: 12 },
  btn: {
    marginTop: 14,
    backgroundColor: c.primary,
    paddingVertical: 15,
    borderRadius: radius.md,
    alignItems: "center",
  },
  btnDisabled: { opacity: 0.7 },
  btnText: { color: c.primaryFg, fontFamily: fonts.sansBold, fontSize: 15 },
  linkBtn: { paddingVertical: 14, alignItems: "center" },
  linkText: { color: c.muted, fontFamily: fonts.sansSemi, fontSize: 13 },
  cancel: { paddingVertical: 18, alignItems: "center" },
  cancelText: { color: c.subtle, fontFamily: fonts.sansSemi, fontSize: 13 },
});
