import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Pressable, ScrollView, StatusBar, StyleSheet,
  Text, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../src/lib/api";
import { useTheme } from "../../src/stores/theme";
import { clearSession, user } from "../../src/lib/session";
import { fonts, radius, shadows, spacing, typography } from "../../src/theme";
import { selection } from "../../src/lib/haptics";

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super admin", ADMIN: "Admin", MODERATOR: "Moderator",
  VERIFICATION_AGENT: "Verification", FINANCE_ADMIN: "Finance",
  AGENCY_ADMIN: "Agency admin", AGENT: "Agent",
  PROPERTY_MANAGER: "Prop. manager", LANDLORD: "Landlord",
  SELLER: "Seller", TENANT: "Tenant", BUYER: "Buyer", USER: "Customer",
};

const MENU_ITEMS: { label: string; path: string; icon: any; adminOnly?: boolean }[] = [
  { label: "My listings",       path: "/my-listings",      icon: "home-outline" },
  { label: "Add property",      path: "/add-property",     icon: "add-circle-outline" },
  { label: "Owner dashboard",   path: "/dashboard",        icon: "stats-chart-outline" },
  { label: "Bookings",          path: "/bookings",         icon: "calendar-outline" },
  { label: "Offers",            path: "/offers",           icon: "pricetag-outline" },
  { label: "Leases",            path: "/leases",           icon: "document-text-outline" },
  { label: "Maintenance",       path: "/maintenance",      icon: "construct-outline" },
  { label: "Messages",          path: "/messages",         icon: "chatbubble-outline" },
  { label: "Notifications",     path: "/notifications",    icon: "notifications-outline" },
  { label: "Saved searches",    path: "/saved-searches",   icon: "bookmark-outline" },
  { label: "Account & privacy", path: "/settings/account", icon: "person-outline" },
  { label: "Security",          path: "/settings/security", icon: "shield-outline" },
  { label: "Admin console",     path: "/admin",            icon: "settings-outline", adminOnly: true },
];

export default function Profile() {
  const c = useTheme(s => s.palette);
  const mode = useTheme(s => s.mode);
  const setMode = useTheme(s => s.setMode);
  const insets = useSafeAreaInsets();

  const [u, setU] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    user().then(async x => {
      setU(x);
      if (!x) return;
      try {
        const [analytics, notifications] = await Promise.all([
          api<any>("/analytics/landlord", {}, true).catch(() => null),
          api<any[]>("/notifications", {}, true).catch(() => []),
        ]);
        setStats(analytics);
        setUnread((notifications ?? []).filter((n: any) => !n.read_at && !n.readAt).length);
      } catch {}
    });
  }, []);

  async function signOut() {
    selection();
    await clearSession();
    setU(null);
    setStats(null);
  }

  const isAdmin = u?.roles?.some((r: string) => ["SUPER_ADMIN", "ADMIN", "MODERATOR"].includes(r));

  if (!u) {
    return (
      <View style={[styles.root, { backgroundColor: c.bg, paddingTop: insets.top + 20, paddingHorizontal: spacing.lg }]}>
        <StatusBar barStyle={c.statusBar === "#07100D" ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />
        <Text style={[styles.eyebrow, { color: c.primary, fontFamily: fonts.sansBold }]}>IMIZI ACCOUNT</Text>
        <Text style={[styles.h1, { color: c.text, fontFamily: fonts.displayStrong }]}>Your property life,{"\n"}one account.</Text>
        <Text style={[styles.lead, { color: c.muted, fontFamily: fonts.sans }]}>
          Search, viewings, bookings, payments, messages and management — all connected to one backend identity.
        </Text>
        <Pressable style={[styles.signInBtn, { backgroundColor: c.primary }]} onPress={() => { selection(); router.push("/login"); }}>
          <Text style={[styles.signInBtnText, { color: c.primaryFg, fontFamily: fonts.sansBold }]}>Sign in</Text>
        </Pressable>
        <Pressable style={[styles.registerBtn, { borderColor: c.border }]} onPress={() => { selection(); router.push("/register"); }}>
          <Text style={[styles.registerBtnText, { color: c.text, fontFamily: fonts.sansMedium }]}>Create account</Text>
        </Pressable>
      </View>
    );
  }

  const initials = (u.fullName || "?").split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: c.bg }]}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: 110 + insets.bottom }]}
    >
      <StatusBar barStyle={c.statusBar === "#07100D" ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />

      {/* Avatar + name */}
      <View style={[styles.profileCard, { backgroundColor: c.surface, borderColor: c.border }]}>
        <View style={[styles.avatar, { backgroundColor: c.primary }]}>
          <Text style={[styles.avatarText, { color: c.primaryFg, fontFamily: fonts.displayStrong }]}>{initials}</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={[styles.profileName, { color: c.text, fontFamily: fonts.displayStrong }]}>{u.fullName || "Account"}</Text>
          <Text style={[styles.profileMeta, { color: c.muted, fontFamily: fonts.sans }]}>{u.email || u.phone}</Text>
          {(u.roles ?? []).length > 0 && (
            <View style={[styles.roleInline, { backgroundColor: c.primarySoft }]}>
              <Text style={[styles.roleInlineText, { color: c.primary, fontFamily: fonts.sansBold }]}>
                {ROLE_LABELS[u.roles[0]] ?? u.roles[0]}
              </Text>
            </View>
          )}
        </View>
        {unread > 0 && (
          <View style={[styles.badge, { backgroundColor: c.danger }]}>
            <Text style={[styles.badgeText, { color: "#fff" }]}>{unread}</Text>
          </View>
        )}
      </View>

      {/* Role chips */}
      <View style={styles.rolesRow}>
        {(u.roles ?? []).map((r: string) => (
          <View key={r} style={[styles.roleChip, { backgroundColor: c.primarySoft, borderColor: c.border }]}>
            <Text style={[styles.roleText, { color: c.primary, fontFamily: fonts.sansBold }]}>{ROLE_LABELS[r] ?? r}</Text>
          </View>
        ))}
      </View>

      {/* Stats */}
      {stats && (
        <View style={styles.statsGrid}>
          {[
            ["Properties", stats.properties ?? 0, "home-outline"],
            ["Active", stats.active ?? 0, "checkmark-circle-outline"],
            ["Views", stats.views ?? 0, "eye-outline"],
            ["Bookings", stats.bookings ?? 0, "calendar-outline"],
          ].map(([label, value, icon]) => (
            <View key={String(label)} style={[styles.statCard, { backgroundColor: c.surface, borderColor: c.border }]}>
              <Ionicons name={icon as any} size={18} color={c.primary} />
              <Text style={[styles.statValue, { color: c.text, fontFamily: fonts.displayStrong }]}>{String(value)}</Text>
              <Text style={[styles.statLabel, { color: c.muted, fontFamily: fonts.sans }]}>{String(label)}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Theme toggle */}
      <Pressable
        style={[styles.menuRow, { backgroundColor: c.surface, borderColor: c.border }]}
        onPress={() => { selection(); setMode(mode === "dark" ? "light" : "dark"); }}
        android_ripple={{ color: c.ripple }}
      >
        <View style={[styles.menuIcon, { backgroundColor: c.primarySoft }]}>
          <Ionicons name={mode === "dark" ? "sunny-outline" : "moon-outline"} size={18} color={c.primary} />
        </View>
        <Text style={[styles.menuLabel, { color: c.text, fontFamily: fonts.sansMedium }]}>
          Appearance · {mode === "dark" ? "Switch to Light" : "Switch to Dark"}
        </Text>
        <Ionicons name="chevron-forward" size={16} color={c.subtle} />
      </Pressable>

      {/* Menu items */}
      <Text style={[styles.sectionTitle, { color: c.muted, fontFamily: fonts.sansBold }]}>OPERATIONS</Text>
      {MENU_ITEMS.filter(m => !m.adminOnly || isAdmin).map(item => (
        <Pressable
          key={item.label}
          style={[styles.menuRow, { backgroundColor: c.surface, borderColor: c.border }]}
          onPress={() => { selection(); router.push(item.path as any); }}
          android_ripple={{ color: c.ripple }}
        >
          <View style={[styles.menuIcon, { backgroundColor: c.surface2 }]}>
            <Ionicons name={item.icon} size={18} color={c.primary} />
          </View>
          <Text style={[styles.menuLabel, { color: c.text, fontFamily: fonts.sansMedium }]}>{item.label}</Text>
          {item.label === "Notifications" && unread > 0 && (
            <View style={[styles.badge, { backgroundColor: c.danger }]}>
              <Text style={[styles.badgeText, { color: "#fff" }]}>{unread}</Text>
            </View>
          )}
          <Ionicons name="chevron-forward" size={16} color={c.subtle} />
        </Pressable>
      ))}

      {/* Sign out */}
      <Pressable
        style={[styles.signOutBtn, { borderColor: c.border, backgroundColor: c.surface }]}
        onPress={signOut}
        android_ripple={{ color: c.ripple }}
      >
        <Ionicons name="log-out-outline" size={18} color={c.danger} />
        <Text style={[styles.signOutText, { color: c.danger, fontFamily: fonts.sansBold }]}>Sign out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  profileCard: { flexDirection: "row", alignItems: "center", gap: 14, borderWidth: 1, borderRadius: radius.lg, padding: 16, ...shadows.card },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 20 },
  profileInfo: { flex: 1 },
  profileName: { fontSize: typography.subtitle, letterSpacing: -0.4 },
  profileMeta: { fontSize: 13, marginTop: 3, opacity: 0.8 },
  badge: { minWidth: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  badgeText: { fontSize: 11, fontWeight: "900" },
  rolesRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  roleChip: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 5 },
  roleText: { fontSize: 11 },
  roleInline: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill, marginTop: 5 },
  roleInlineText: { fontSize: 10 },
  statsGrid: { flexDirection: "row", gap: spacing.sm },
  statCard: { flex: 1, borderWidth: 1, borderRadius: radius.md, padding: 14, alignItems: "center", gap: 4, ...shadows.card },
  statValue: { fontSize: 24, letterSpacing: -0.6 },
  statLabel: { fontSize: 11 },
  sectionTitle: { fontSize: 11, letterSpacing: 1.2, marginTop: spacing.sm, marginBottom: -2 },
  menuRow: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderRadius: radius.md, padding: 14, ...shadows.card },
  menuIcon: { width: 36, height: 36, borderRadius: radius.sm, alignItems: "center", justifyContent: "center" },
  menuLabel: { flex: 1, fontSize: 14 },
  signOutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1, borderRadius: radius.md, padding: 15, marginTop: spacing.sm },
  signOutText: { fontSize: 14 },
  eyebrow: { fontSize: 11, letterSpacing: 2, marginBottom: 8 },
  h1: { fontSize: typography.display, letterSpacing: -1.4, lineHeight: 40, marginBottom: 12 },
  lead: { fontSize: 15, lineHeight: 23, marginBottom: 28 },
  signInBtn: { borderRadius: radius.md, padding: 16, alignItems: "center", marginBottom: 10 },
  signInBtnText: { fontSize: 16 },
  registerBtn: { borderWidth: 1, borderRadius: radius.md, padding: 16, alignItems: "center" },
  registerBtnText: { fontSize: 16 },
});
