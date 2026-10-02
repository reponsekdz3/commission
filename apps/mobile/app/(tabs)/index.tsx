import { router } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator, FlatList, Pressable,
  StatusBar, StyleSheet, Text, View, Platform,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api, SearchItem } from "../../src/lib/api";
import { PropertyCard } from "../../src/components/PropertyCard";
import { Button, Chip, Field, OfflineBanner, SectionTitle } from "../../src/components/ui";
import { fonts, radius, shadows, spacing, typography } from "../../src/theme";
import { useTheme } from "../../src/stores/theme";
import { selection } from "../../src/lib/haptics";

const LISTING_TYPES = [
  { key: "RENT",       label: "Rent" },
  { key: "SALE",       label: "Buy" },
  { key: "SHORT_STAY", label: "Stay" },
] as const;

const QUICK_ACTIONS = [
  { icon: "map"         as const, label: "Explore Map",   sub: "Live locations",   path: "/map",          accent: false },
  { icon: "heart"       as const, label: "Saved",         sub: "Your shortlist",   path: "/saved",        accent: false },
  { icon: "calendar"   as const, label: "Bookings",      sub: "Viewings & stays", path: "/bookings",     accent: false },
  { icon: "add-circle" as const, label: "List Property", sub: "Reach seekers",    path: "/add-property", accent: true  },
] as const;

export default function Home() {
  const c = useTheme(s => s.palette);
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState("");
  const [type, setType] = useState<"RENT" | "SALE" | "SHORT_STAY">("RENT");

  const query = useQuery({
    queryKey: ["home-listings", type],
    queryFn: () => api<{ items: SearchItem[] }>(`/search?listingType=${type}&limit=10`),
    staleTime: 3 * 60_000,
  });
  const items = query.data?.items ?? [];

  const search = useCallback(() => {
    selection();
    router.push({ pathname: "/search", params: { q, listingType: type } });
  }, [q, type]);

  const ListHeader = (
    <View>
      <View style={{ height: insets.top + 8 }} />

      {/* ── Hero ── */}
      <View style={[styles.hero, { backgroundColor: c.surface, borderColor: c.border }]}>
        {/* Brand row */}
        <View style={styles.heroTop}>
          <View style={[styles.brandBadge, { backgroundColor: c.primarySoft }]}>
            <View style={[styles.liveDot, { backgroundColor: c.primary }]} />
            <Text style={[styles.brandText, { color: c.primary, fontFamily: fonts.displayStrong }]}>IMIZI</Text>
          </View>
          <Text style={[styles.heroSub, { color: c.muted, fontFamily: fonts.sans }]}>Rwanda property marketplace</Text>
        </View>

        <Text style={[styles.heroH1, { color: c.text, fontFamily: fonts.displayStrong }]}>
          Find a place{"\n"}that fits.
        </Text>
        <Text style={[styles.heroLead, { color: c.muted, fontFamily: fonts.sans }]}>
          Verified homes, land and commercial spaces. Book viewings, pay securely and manage everything from one account.
        </Text>

        {/* Search bar */}
        <View style={styles.searchRow}>
          <Field
            value={q}
            onChangeText={setQ}
            onSubmitEditing={search}
            placeholder="Kacyiru · 3 bedrooms · 800k"
            returnKeyType="search"
            style={styles.searchField}
          />
          <Pressable
            style={[styles.searchIconBtn, { backgroundColor: c.primary }]}
            onPress={search}
            android_ripple={{ color: c.ripple, borderless: false }}
          >
            <Ionicons name="search" size={20} color={c.primaryFg} />
          </Pressable>
        </View>

        {/* Type chips */}
        <View style={styles.chipRow}>
          {LISTING_TYPES.map(t => (
            <Chip key={t.key} label={t.label} active={type === t.key} onPress={() => { selection(); setType(t.key); }} />
          ))}
        </View>
      </View>

      {/* ── Quick actions ── */}
      <View style={styles.actionsGrid}>
        {QUICK_ACTIONS.map(a => (
          <Pressable
            key={a.label}
            onPress={() => { selection(); router.push(a.path as any); }}
            style={[
              styles.actionCard,
              {
                backgroundColor: a.accent
                  ? c.primary
                  : c.surface,
                borderColor: a.accent ? c.primary : c.border,
              },
            ]}
            android_ripple={{ color: c.ripple, borderless: false }}
          >
            <View style={[
              styles.actionIcon,
              { backgroundColor: a.accent ? "rgba(255,255,255,.18)" : c.primarySoft },
            ]}>
              <Ionicons name={a.icon} size={22} color={a.accent ? c.primaryFg : c.primary} />
            </View>
            <Text style={[
              styles.actionLabel,
              { color: a.accent ? c.primaryFg : c.text, fontFamily: fonts.sansBold },
            ]}>
              {a.label}
            </Text>
            <Text style={[
              styles.actionSub,
              { color: a.accent ? "rgba(255,255,255,.72)" : c.muted, fontFamily: fonts.sans },
            ]}>
              {a.sub}
            </Text>
            <Ionicons
              name="chevron-forward"
              size={14}
              color={a.accent ? "rgba(255,255,255,.6)" : c.subtle}
              style={styles.actionArrow}
            />
          </Pressable>
        ))}
      </View>

      {/* ── Live status strip ── */}
      <View style={[styles.statusBar, { borderColor: c.border, backgroundColor: c.surface }]}>
        <View style={styles.statusLeft}>
          <View style={[styles.statusDot, { backgroundColor: c.primary }]} />
          <View>
            <Text style={[styles.statusTitle, { color: c.text, fontFamily: fonts.sansBold }]}>Connected marketplace</Text>
            <Text style={[styles.statusSub, { color: c.muted, fontFamily: fonts.sans }]}>Live API · maps · bookings · payments · chat</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: c.primarySoft }]}>
          <Text style={[styles.statusBadgeText, { color: c.primary, fontFamily: fonts.sansBold }]}>Live</Text>
        </View>
      </View>

      <OfflineBanner visible={query.isError && items.length > 0} />
      {query.isError && items.length === 0 && (
        <Text style={[styles.errorText, { color: c.danger, fontFamily: fonts.sans }]}>
          {query.error instanceof Error ? query.error.message : "Unable to load live listings."}
        </Text>
      )}

      <SectionTitle
        title={query.isFetching
          ? "Refreshing…"
          : `Featured ${type === "RENT" ? "rentals" : type === "SALE" ? "for sale" : "short stays"}`}
        action="View all"
        onAction={() => { selection(); router.push({ pathname: "/search", params: { listingType: type } }); }}
      />
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <StatusBar
        barStyle={c.statusBar === "#07100D" ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent
      />
      <FlatList
        data={items}
        keyExtractor={x => x.listing.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: 110 + insets.bottom }]}
        refreshing={query.isFetching}
        onRefresh={() => void query.refetch()}
        ListHeaderComponent={ListHeader}
        renderItem={({ item }) => (
          <PropertyCard
            item={item}
            onPress={() => { selection(); router.push("/property/" + item.property.id); }}
          />
        )}
        ListEmptyComponent={
          query.isPending
            ? <ActivityIndicator color={c.primary} style={styles.loader} />
            : (
              <View style={[styles.empty, { backgroundColor: c.surface, borderColor: c.border }]}>
                <View style={[styles.emptyIcon, { backgroundColor: c.primarySoft }]}>
                  <Ionicons name="search" size={28} color={c.primary} />
                </View>
                <Text style={[styles.emptyTitle, { color: c.text, fontFamily: fonts.displayStrong }]}>No live listings</Text>
                <Text style={[styles.emptySub, { color: c.muted, fontFamily: fonts.sans }]}>
                  Try another property type or open Search for more filters.
                </Text>
                <Button title="Open advanced search" onPress={() => router.push("/search")} style={styles.emptyBtn} />
              </View>
            )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  listContent: { paddingHorizontal: spacing.md },

  // Hero
  hero: {
    borderWidth: 1, borderRadius: radius.xl, padding: 20,
    marginBottom: spacing.md, marginTop: spacing.sm,
    ...shadows.card,
  },
  heroTop: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 },
  brandBadge: {
    flexDirection: "row", alignItems: "center", gap: 7,
    paddingHorizontal: 11, paddingVertical: 6, borderRadius: radius.pill,
  },
  brandText: { fontSize: 13, letterSpacing: 2 },
  liveDot: { width: 7, height: 7, borderRadius: 4 },
  heroSub: { fontSize: 12, opacity: 0.8 },
  heroH1: {
    fontSize: typography.display, letterSpacing: -1.4,
    lineHeight: 40, marginBottom: 10,
  },
  heroLead: { fontSize: 14, lineHeight: 22, marginBottom: 18, opacity: 0.85 },
  searchRow: { flexDirection: "row", gap: 8, marginBottom: 12, alignItems: "center" },
  searchField: { flex: 1 },
  searchIconBtn: {
    width: 48, height: 48, borderRadius: radius.md,
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  chipRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },

  // Quick actions
  actionsGrid: {
    flexDirection: "row", flexWrap: "wrap",
    gap: spacing.sm, marginBottom: spacing.md,
  },
  actionCard: {
    width: "47.5%", minHeight: 108,
    borderWidth: 1, borderRadius: radius.lg,
    padding: 14, position: "relative",
    ...shadows.card,
  },
  actionIcon: {
    width: 42, height: 42, borderRadius: radius.md,
    alignItems: "center", justifyContent: "center", marginBottom: 10,
  },
  actionLabel: { fontSize: 14, marginBottom: 3 },
  actionSub: { fontSize: 11, lineHeight: 16 },
  actionArrow: { position: "absolute", right: 12, top: 14 },

  // Status strip
  statusBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    borderWidth: 1, borderRadius: radius.md, padding: 14,
    marginBottom: spacing.md, ...shadows.card,
  },
  statusLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  statusDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  statusTitle: { fontSize: 13 },
  statusSub: { fontSize: 11, marginTop: 2, opacity: 0.8 },
  statusBadge: {
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: radius.pill, flexShrink: 0,
  },
  statusBadgeText: { fontSize: 11 },

  // States
  loader: { marginTop: 40 },
  errorText: { textAlign: "center", marginVertical: spacing.md, fontSize: 14 },
  empty: {
    margin: spacing.sm, padding: 32, alignItems: "center",
    borderWidth: 1, borderRadius: radius.xl, borderStyle: "dashed",
    ...shadows.card,
  },
  emptyIcon: {
    width: 60, height: 60, borderRadius: 30,
    alignItems: "center", justifyContent: "center", marginBottom: 14,
  },
  emptyTitle: { fontSize: 20, letterSpacing: -0.4, marginBottom: 8 },
  emptySub: { textAlign: "center", fontSize: 14, lineHeight: 21, marginBottom: 20 },
  emptyBtn: {},
});
