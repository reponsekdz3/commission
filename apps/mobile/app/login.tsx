import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert, Animated, KeyboardAvoidingView, Platform,
  Pressable, ScrollView, StatusBar, StyleSheet, Text,
  TextInput, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../src/lib/api";
import { saveSession } from "../src/lib/session";
import { useTheme } from "../src/stores/theme";
import { fonts, radius, shadows, spacing } from "../src/theme";
import { selection, impact } from "../src/lib/haptics";

export default function Login() {
  const c = useTheme(s => s.palette);
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfa, setMfa] = useState("");
  const [showMfa, setShowMfa] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const pwRef = useRef<TextInput>(null);
  const mfaRef = useRef<TextInput>(null);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 420, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, damping: 18, stiffness: 160, useNativeDriver: true }),
    ]).start();
  }, []);

  function shake() {
    impact();
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  }

  async function submit() {
    if (!email.trim() || !password) {
      setError("Email/phone and password are required.");
      shake();
      return;
    }
    setError("");
    setBusy(true);
    try {
      const d = await api<any>("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          identifier: email.trim(),
          password,
          ...(mfa ? { mfaCode: mfa } : {}),
        }),
      });
      await saveSession(d);
      selection();
      router.replace("/");
    } catch (e: any) {
      const msg: string = e?.message ?? "Sign in failed. Please try again.";
      if (/mfa|multi-factor|authenticator/i.test(msg)) setShowMfa(true);
      setError(msg);
      shake();
    } finally {
      setBusy(false);
    }
  }

  const inputStyle = (focused = false) => [
    s.input,
    {
      backgroundColor: c.surface2,
      borderColor: focused ? c.primary : c.border,
      color: c.text,
      shadowColor: focused ? c.primary : "transparent",
      shadowOpacity: focused ? 0.18 : 0,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 0 },
    },
  ];

  const [emailFocused, setEmailFocused] = useState(false);
  const [pwFocused, setPwFocused] = useState(false);
  const [mfaFocused, setMfaFocused] = useState(false);

  return (
    <KeyboardAvoidingView
      style={[s.root, { backgroundColor: c.bg }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar
        barStyle={c.bg === "#07100D" ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent
      />
      <ScrollView
        contentContainerStyle={[s.scroll, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {/* Brand */}
          <View style={s.brandRow}>
            <View style={[s.brandMark, { backgroundColor: c.primary, ...shadows.card }]}>
              <Text style={[s.brandMarkText, { color: c.primaryFg, fontFamily: fonts.displayStrong }]}>I</Text>
            </View>
            <Text style={[s.brandName, { color: c.text, fontFamily: fonts.displayStrong }]}>IMIZI</Text>
            <View style={[s.brandTag, { backgroundColor: c.primarySoft }]}>
              <Text style={[s.brandTagText, { color: c.primary, fontFamily: fonts.sansBold }]}>RWANDA</Text>
            </View>
          </View>

          {/* Hero copy */}
          <Text style={[s.eyebrow, { color: c.primary, fontFamily: fonts.sansBold }]}>SECURE ACCESS</Text>
          <Text style={[s.h1, { color: c.text, fontFamily: fonts.displayStrong }]}>Welcome back.</Text>
          <Text style={[s.meta, { color: c.muted, fontFamily: fonts.sans }]}>
            Access your bookings, messages, saved properties and property workspace.
          </Text>

          {/* Form card */}
          <Animated.View
            style={[
              s.card,
              { backgroundColor: c.surface, borderColor: c.border, transform: [{ translateX: shakeAnim }] },
              shadows.card,
            ]}
          >
            {/* Email */}
            <Text style={[s.label, { color: c.textSoft, fontFamily: fonts.sansSemi }]}>Email or phone</Text>
            <View style={s.inputWrap}>
              <Ionicons name="mail-outline" size={16} color={emailFocused ? c.primary : c.subtle} style={s.inputIcon} />
              <TextInput
                style={[inputStyle(emailFocused), s.inputWithIcon]}
                value={email}
                onChangeText={setEmail}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                placeholder="name@example.com or +250…"
                placeholderTextColor={c.subtle}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="username"
                returnKeyType="next"
                onSubmitEditing={() => pwRef.current?.focus()}
              />
            </View>

            {/* Password */}
            <Text style={[s.label, { color: c.textSoft, fontFamily: fonts.sansSemi }]}>Password</Text>
            <View style={s.inputWrap}>
              <Ionicons name="lock-closed-outline" size={16} color={pwFocused ? c.primary : c.subtle} style={s.inputIcon} />
              <TextInput
                ref={pwRef}
                style={[inputStyle(pwFocused), s.inputWithIcon, { paddingRight: 44 }]}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setPwFocused(true)}
                onBlur={() => setPwFocused(false)}
                placeholder="Your password"
                placeholderTextColor={c.subtle}
                secureTextEntry={!showPw}
                textContentType="password"
                returnKeyType={showMfa ? "next" : "done"}
                onSubmitEditing={() => showMfa ? mfaRef.current?.focus() : submit()}
              />
              <Pressable style={s.pwToggle} onPress={() => { selection(); setShowPw(v => !v); }}>
                <Ionicons name={showPw ? "eye-off-outline" : "eye-outline"} size={18} color={c.muted} />
              </Pressable>
            </View>

            {/* MFA toggle */}
            <Pressable
              style={s.mfaToggle}
              onPress={() => { selection(); setShowMfa(v => !v); }}
            >
              <Ionicons name="shield-checkmark-outline" size={14} color={c.primary} />
              <Text style={[s.mfaToggleText, { color: c.primary, fontFamily: fonts.sansBold }]}>
                {showMfa ? "Hide MFA code" : "I have an MFA code"}
              </Text>
            </Pressable>

            {showMfa && (
              <>
                <Text style={[s.label, { color: c.textSoft, fontFamily: fonts.sansSemi }]}>Authenticator code</Text>
                <View style={s.inputWrap}>
                  <Ionicons name="keypad-outline" size={16} color={mfaFocused ? c.primary : c.subtle} style={s.inputIcon} />
                  <TextInput
                    ref={mfaRef}
                    style={[inputStyle(mfaFocused), s.inputWithIcon]}
                    value={mfa}
                    onChangeText={setMfa}
                    onFocus={() => setMfaFocused(true)}
                    onBlur={() => setMfaFocused(false)}
                    placeholder="6-digit code"
                    placeholderTextColor={c.subtle}
                    keyboardType="number-pad"
                    maxLength={6}
                    returnKeyType="done"
                    onSubmitEditing={submit}
                  />
                </View>
              </>
            )}

            {/* Error */}
            {!!error && (
              <View style={[s.errorBox, { backgroundColor: c.dangerSoft, borderColor: c.danger + "44" }]}>
                <Ionicons name="warning-outline" size={15} color={c.danger} />
                <Text style={[s.errorText, { color: c.danger, fontFamily: fonts.sansSemi }]}>{error}</Text>
              </View>
            )}

            {/* Submit */}
            <Pressable
              style={({ pressed }) => [
                s.btn,
                { backgroundColor: c.primary, opacity: busy || pressed ? 0.82 : 1 },
                shadows.card,
              ]}
              onPress={submit}
              disabled={busy}
            >
              {busy ? (
                <View style={s.btnInner}>
                  <Ionicons name="sync-outline" size={18} color={c.primaryFg} />
                  <Text style={[s.btnText, { color: c.primaryFg, fontFamily: fonts.sansBold }]}>Signing in…</Text>
                </View>
              ) : (
                <View style={s.btnInner}>
                  <Text style={[s.btnText, { color: c.primaryFg, fontFamily: fonts.sansBold }]}>Sign in</Text>
                  <Ionicons name="arrow-forward" size={18} color={c.primaryFg} />
                </View>
              )}
            </Pressable>

            {/* Forgot */}
            <Pressable style={s.forgotBtn} onPress={() => { selection(); router.push("/forgot-password"); }}>
              <Text style={[s.forgotText, { color: c.muted, fontFamily: fonts.sansSemi }]}>Forgot password?</Text>
            </Pressable>
          </Animated.View>

          {/* Divider */}
          <View style={s.dividerRow}>
            <View style={[s.dividerLine, { backgroundColor: c.border }]} />
            <Text style={[s.dividerText, { color: c.subtle, fontFamily: fonts.sansSemi }]}>New to Imizi?</Text>
            <View style={[s.dividerLine, { backgroundColor: c.border }]} />
          </View>

          {/* Register CTA */}
          <Pressable
            style={({ pressed }) => [
              s.registerBtn,
              { borderColor: c.border, backgroundColor: pressed ? c.surface2 : c.surface },
            ]}
            onPress={() => { selection(); router.push("/register"); }}
          >
            <Text style={[s.registerText, { color: c.text, fontFamily: fonts.sansBold }]}>Create a free account</Text>
            <Ionicons name="arrow-forward-outline" size={16} color={c.primary} />
          </Pressable>

          {/* Legal */}
          <Text style={[s.legal, { color: c.subtle, fontFamily: fonts.sans }]}>
            By signing in you agree to our Terms of Service and Privacy Policy.
          </Text>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: spacing.xl, flexGrow: 1 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 24 },
  brandMark: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  brandMarkText: { fontSize: 17 },
  brandName: { fontSize: 19, letterSpacing: 3 },
  brandTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  brandTagText: { fontSize: 9, letterSpacing: 1 },
  eyebrow: { fontSize: 11, letterSpacing: 2, marginBottom: 8 },
  h1: { fontSize: 38, letterSpacing: -1.5, lineHeight: 42, marginBottom: 10 },
  meta: { fontSize: 14, lineHeight: 22, marginBottom: 24, opacity: 0.85 },
  card: { borderWidth: 1, borderRadius: radius.xl, padding: spacing.lg, gap: 2, marginBottom: 20 },
  label: { fontSize: 13, marginTop: 12, marginBottom: 6 },
  inputWrap: { position: "relative" },
  inputIcon: { position: "absolute", left: 13, top: "50%", marginTop: -8, zIndex: 1 },
  input: {
    borderWidth: 1, borderRadius: radius.md,
    paddingHorizontal: 14, paddingVertical: Platform.OS === "ios" ? 14 : 12,
    fontSize: 15,
  },
  inputWithIcon: { paddingLeft: 38 },
  pwToggle: { position: "absolute", right: 10, top: "50%", marginTop: -14, padding: 6, zIndex: 1 },
  mfaToggle: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 10, alignSelf: "flex-start" },
  mfaToggleText: { fontSize: 12 },
  errorBox: { flexDirection: "row", alignItems: "flex-start", gap: 8, padding: 12, borderRadius: radius.md, borderWidth: 1, marginTop: 8 },
  errorText: { flex: 1, fontSize: 13, lineHeight: 19 },
  btn: { marginTop: 14, paddingVertical: 15, borderRadius: radius.md, alignItems: "center" },
  btnInner: { flexDirection: "row", alignItems: "center", gap: 8 },
  btnText: { fontSize: 15 },
  forgotBtn: { paddingVertical: 14, alignItems: "center" },
  forgotText: { fontSize: 13 },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 12 },
  registerBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 15, borderRadius: radius.md, borderWidth: 1, marginBottom: 20,
  },
  registerText: { fontSize: 14 },
  legal: { fontSize: 11, lineHeight: 17, textAlign: "center", opacity: 0.7, marginBottom: 8 },
});
