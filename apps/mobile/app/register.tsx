import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated, KeyboardAvoidingView, Platform,
  Pressable, ScrollView, StatusBar, StyleSheet, Text,
  TextInput, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../src/lib/api";
import { useTheme } from "../src/stores/theme";
import { fonts, radius, shadows, spacing } from "../src/theme";
import { selection, impact } from "../src/lib/haptics";

function pwScore(pw: string) {
  let s = 0;
  if (pw.length >= 10) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[a-z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  return s;
}

const PW_COLORS = ["#E3E8E6", "#DC2626", "#F59E0B", "#0284C7", "#16A34A"];
const PW_LABELS = ["", "Weak", "Fair", "Good", "Strong"];

function PasswordStrength({ pw, c }: { pw: string; c: any }) {
  const score = useMemo(() => pwScore(pw), [pw]);
  if (!pw) return null;
  return (
    <View style={ps.wrap}>
      <View style={ps.bars}>
        {[1, 2, 3, 4].map(i => (
          <View
            key={i}
            style={[ps.bar, { backgroundColor: i <= score ? PW_COLORS[score] : c.border }]}
          />
        ))}
        <Text style={[ps.label, { color: PW_COLORS[score], fontFamily: fonts.sansBold }]}>
          {PW_LABELS[score]}
        </Text>
      </View>
      <View style={ps.checks}>
        {[
          { label: "10+ chars", pass: pw.length >= 10 },
          { label: "Uppercase", pass: /[A-Z]/.test(pw) },
          { label: "Lowercase", pass: /[a-z]/.test(pw) },
          { label: "Number",    pass: /[0-9]/.test(pw) },
        ].map(({ label, pass }) => (
          <View key={label} style={[ps.check, { backgroundColor: pass ? c.primarySoft : c.surface3 }]}>
            <Ionicons name={pass ? "checkmark" : "close"} size={10} color={pass ? c.primary : c.subtle} />
            <Text style={[ps.checkText, { color: pass ? c.primary : c.subtle, fontFamily: fonts.sansSemi }]}>
              {label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const ps = StyleSheet.create({
  wrap: { marginTop: 10, gap: 8 },
  bars: { flexDirection: "row", alignItems: "center", gap: 5 },
  bar: { flex: 1, height: 4, borderRadius: 999 },
  label: { fontSize: 11, marginLeft: 4 },
  checks: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  check: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  checkText: { fontSize: 10 },
});

export default function Register() {
  const c = useTheme(s => s.palette);
  const insets = useSafeAreaInsets();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(28)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const emailRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const pwRef = useRef<TextInput>(null);

  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [pwFocused, setPwFocused] = useState(false);

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
    if (!fullName.trim() || !email.trim() || !phone.trim() || !password) {
      setError("All fields are required.");
      shake();
      return;
    }
    if (password.length < 10) {
      setError("Password must be at least 10 characters.");
      shake();
      return;
    }
    setError("");
    setBusy(true);
    try {
      await api("/auth/register", {
        method: "POST",
        body: JSON.stringify({ fullName: fullName.trim(), email: email.trim(), phone: phone.trim(), password }),
      });
      selection();
      setSuccess(true);
    } catch (e: any) {
      setError(e?.message ?? "Registration failed. Please try again.");
      shake();
    } finally {
      setBusy(false);
    }
  }

  const inputStyle = (focused: boolean) => [
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

  if (success) {
    return (
      <View style={[s.root, s.successRoot, { backgroundColor: c.bg }]}>
        <StatusBar barStyle={c.bg === "#07100D" ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />
        <View style={[s.successCard, { backgroundColor: c.surface, borderColor: c.border }, shadows.floating]}>
          <View style={[s.successIcon, { backgroundColor: c.primarySoft }]}>
            <Ionicons name="checkmark-circle" size={48} color={c.primary} />
          </View>
          <Text style={[s.successTitle, { color: c.text, fontFamily: fonts.displayStrong }]}>Account created!</Text>
          <Text style={[s.successSub, { color: c.muted, fontFamily: fonts.sans }]}>
            Your account is ready. Sign in to start exploring properties across Rwanda.
          </Text>
          <Pressable
            style={[s.btn, { backgroundColor: c.primary }, shadows.card]}
            onPress={() => { selection(); router.replace("/login"); }}
          >
            <View style={s.btnInner}>
              <Text style={[s.btnText, { color: c.primaryFg, fontFamily: fonts.sansBold }]}>Go to sign in</Text>
              <Ionicons name="arrow-forward" size={18} color={c.primaryFg} />
            </View>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[s.root, { backgroundColor: c.bg }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar barStyle={c.bg === "#07100D" ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />
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

          <Text style={[s.eyebrow, { color: c.primary, fontFamily: fonts.sansBold }]}>JOIN IMIZI</Text>
          <Text style={[s.h1, { color: c.text, fontFamily: fonts.displayStrong }]}>Create your account.</Text>
          <Text style={[s.meta, { color: c.muted, fontFamily: fonts.sans }]}>
            Search, save, message, book and manage properties across Rwanda from one account.
          </Text>

          {/* Perks */}
          <View style={[s.perksRow, { backgroundColor: c.surface, borderColor: c.border }]}>
            {["Free to join", "Verified listings", "Secure RWF payments", "Real-time bookings"].map(p => (
              <View key={p} style={s.perkItem}>
                <Ionicons name="checkmark-circle" size={14} color={c.primary} />
                <Text style={[s.perkText, { color: c.textSoft, fontFamily: fonts.sansSemi }]}>{p}</Text>
              </View>
            ))}
          </View>

          {/* Form card */}
          <Animated.View
            style={[
              s.card,
              { backgroundColor: c.surface, borderColor: c.border, transform: [{ translateX: shakeAnim }] },
              shadows.card,
            ]}
          >
            {/* Full name */}
            <Text style={[s.label, { color: c.textSoft, fontFamily: fonts.sansSemi }]}>Full name</Text>
            <View style={s.inputWrap}>
              <Ionicons name="person-outline" size={16} color={nameFocused ? c.primary : c.subtle} style={s.inputIcon} />
              <TextInput
                style={[inputStyle(nameFocused), s.inputWithIcon]}
                value={fullName}
                onChangeText={setFullName}
                onFocus={() => setNameFocused(true)}
                onBlur={() => setNameFocused(false)}
                placeholder="Jean-Pierre Habimana"
                placeholderTextColor={c.subtle}
                autoCapitalize="words"
                textContentType="name"
                returnKeyType="next"
                onSubmitEditing={() => emailRef.current?.focus()}
              />
            </View>

            {/* Email */}
            <Text style={[s.label, { color: c.textSoft, fontFamily: fonts.sansSemi }]}>Email address</Text>
            <View style={s.inputWrap}>
              <Ionicons name="mail-outline" size={16} color={emailFocused ? c.primary : c.subtle} style={s.inputIcon} />
              <TextInput
                ref={emailRef}
                style={[inputStyle(emailFocused), s.inputWithIcon]}
                value={email}
                onChangeText={setEmail}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                placeholder="you@example.com"
                placeholderTextColor={c.subtle}
                autoCapitalize="none"
                keyboardType="email-address"
                textContentType="emailAddress"
                returnKeyType="next"
                onSubmitEditing={() => phoneRef.current?.focus()}
              />
            </View>

            {/* Phone */}
            <Text style={[s.label, { color: c.textSoft, fontFamily: fonts.sansSemi }]}>Phone number</Text>
            <View style={s.inputWrap}>
              <Ionicons name="call-outline" size={16} color={phoneFocused ? c.primary : c.subtle} style={s.inputIcon} />
              <TextInput
                ref={phoneRef}
                style={[inputStyle(phoneFocused), s.inputWithIcon]}
                value={phone}
                onChangeText={setPhone}
                onFocus={() => setPhoneFocused(true)}
                onBlur={() => setPhoneFocused(false)}
                placeholder="+250 7XX XXX XXX"
                placeholderTextColor={c.subtle}
                keyboardType="phone-pad"
                textContentType="telephoneNumber"
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
                placeholder="Min. 10 characters"
                placeholderTextColor={c.subtle}
                secureTextEntry={!showPw}
                textContentType="newPassword"
                returnKeyType="done"
                onSubmitEditing={submit}
              />
              <Pressable style={s.pwToggle} onPress={() => { selection(); setShowPw(v => !v); }}>
                <Ionicons name={showPw ? "eye-off-outline" : "eye-outline"} size={18} color={c.muted} />
              </Pressable>
            </View>
            <PasswordStrength pw={password} c={c} />

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
              <View style={s.btnInner}>
                {busy
                  ? <><Ionicons name="sync-outline" size={18} color={c.primaryFg} /><Text style={[s.btnText, { color: c.primaryFg, fontFamily: fonts.sansBold }]}>Creating…</Text></>
                  : <><Text style={[s.btnText, { color: c.primaryFg, fontFamily: fonts.sansBold }]}>Create free account</Text><Ionicons name="arrow-forward" size={18} color={c.primaryFg} /></>
                }
              </View>
            </Pressable>

            <Text style={[s.legal, { color: c.subtle, fontFamily: fonts.sans }]}>
              By creating an account you agree to our Terms of Service and Privacy Policy.
            </Text>
          </Animated.View>

          {/* Sign in link */}
          <View style={s.dividerRow}>
            <View style={[s.dividerLine, { backgroundColor: c.border }]} />
            <Text style={[s.dividerText, { color: c.subtle, fontFamily: fonts.sansSemi }]}>Already have an account?</Text>
            <View style={[s.dividerLine, { backgroundColor: c.border }]} />
          </View>
          <Pressable
            style={({ pressed }) => [s.registerBtn, { borderColor: c.border, backgroundColor: pressed ? c.surface2 : c.surface }]}
            onPress={() => { selection(); router.replace("/login"); }}
          >
            <Text style={[s.registerText, { color: c.text, fontFamily: fonts.sansBold }]}>Sign in instead</Text>
            <Ionicons name="arrow-forward-outline" size={16} color={c.primary} />
          </Pressable>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: spacing.xl, flexGrow: 1 },
  successRoot: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl },
  successCard: { width: "100%", maxWidth: 380, borderWidth: 1, borderRadius: radius.xl, padding: 32, alignItems: "center", gap: 12 },
  successIcon: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  successTitle: { fontSize: 26, letterSpacing: -0.8, textAlign: "center" },
  successSub: { fontSize: 14, lineHeight: 22, textAlign: "center", opacity: 0.8 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 24 },
  brandMark: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  brandMarkText: { fontSize: 17 },
  brandName: { fontSize: 19, letterSpacing: 3 },
  brandTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  brandTagText: { fontSize: 9, letterSpacing: 1 },
  eyebrow: { fontSize: 11, letterSpacing: 2, marginBottom: 8 },
  h1: { fontSize: 36, letterSpacing: -1.4, lineHeight: 40, marginBottom: 10 },
  meta: { fontSize: 14, lineHeight: 22, marginBottom: 16, opacity: 0.85 },
  perksRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, padding: 14, borderRadius: radius.lg, borderWidth: 1, marginBottom: 20 },
  perkItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  perkText: { fontSize: 12 },
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
  errorBox: { flexDirection: "row", alignItems: "flex-start", gap: 8, padding: 12, borderRadius: radius.md, borderWidth: 1, marginTop: 8 },
  errorText: { flex: 1, fontSize: 13, lineHeight: 19 },
  btn: { marginTop: 16, paddingVertical: 15, borderRadius: radius.md, alignItems: "center" },
  btnInner: { flexDirection: "row", alignItems: "center", gap: 8 },
  btnText: { fontSize: 15 },
  legal: { fontSize: 11, lineHeight: 17, textAlign: "center", opacity: 0.7, marginTop: 14 },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 12 },
  registerBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 15, borderRadius: radius.md, borderWidth: 1, marginBottom: 20,
  },
  registerText: { fontSize: 14 },
});
