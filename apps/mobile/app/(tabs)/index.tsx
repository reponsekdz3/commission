import { router } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator, FlatList, Pressable,
  StatusBar, StyleSheet, Text, View,
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
  { key: "RENT", label: "Rent" },
  { key: "SALE", label: "Buy" },
  { key: "SHORT_STAY", label: "Stay" },
] as const;

const QUICK_ACTIONS = [
  { icon: "map" as const,         label: "Explore Map",    sub: "Live locations",    path: "/map",          accent: false },
  { icon: "heart" as const,       label: "Saved",          sub: "Your shortlist",    path: "/saved",        accent: false },
  { icon: "calendar" as const,    label: "Bookings",       sub: "Viewings & stays",  path: "/bookings",     accent: false },
  { icon: "add-circle" as const,  label: "List Property",  sub: "Reach seekers",     path: "/add-property", accent: true },
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
      {/* Status bar spacer */}
      <View style={{ height: insets.top + 8 }} />

      {/* Hero card */}
      <View style={[styles.hero, { backgroundColor: c.surface, borderColor: c.border }]}>
        <View style={styles.heroTop}>
          <View style={[styles.brandBadge, { backgroundColor: c.primarySoft }]}>
            <Text style={[styles.brandText, { color: c.primary, fontFamily: fonts.displayStrong }]}>IMIZI</Text>
            <View style={[styles.liveDot, { backgroundColor: c.primary }]} />
          </View>
          <Text style={[styles.heroSub, { color: c.muted, fontFamily: fonts.sans }]}>Rwanda property marketplace</Text>
        </View>

        <Text style={[styles.heroH1, { color: c.text, fontFamily: fonts.displayStrong }]}>
          Find a place{"\n"}that fits.
        </Text>
        <Text style={[styles.heroLead, { color: c.muted, fontFamily: fonts.sans }]}>
          Search verified homes, land and commercial spaces. Book viewings, pay securely and manage everything from one account.
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
        </View>

        {/* Type chips */}
        <View style={styles.chipRow}>
          {LISTING_TYPES.map(t => (
            <Chip key={t.key} label={t.label} active={type === t.key} onPress={() => { selection(); setType(t.key); }} />
          ))}
        </View>

        <Button title="Search properties" onPress={search} style={styles.searchBtn} />
      </View>

      {/* Quick actions */}
      <View style={styles.actionsGrid}>
        {QUICK_ACTIONS.map(a => (
          <Pressable
            key={a.label}
            onPress={() => { selection(); router.push(a.path as any); }}
            style={[styles.actionCard, { backgroundColor: c.surface, borderColor: c.border }]}
            android_ripple={{ color: c.ripple, borderless: false }}
          >
            <View style={[styles.actionIcon, { backgroundColor: a.accent ? c.accentSoft : c.primarySoft }]}>
              <Ionicons name={a.icon} size={22} color={a.accent ? c.accentText : c.primary} />
            </View>
            <Text style={[styles.actionLabel, { color: c.text, fontFamily: fonts.sansBold }]}>{a.label}</Text>
            <Text style={[styles.actionSub, { color: c.muted, fontFamily: fonts.sans }]}>{a.sub}</Text>
          </Pressable>
        ))}
      </View>

      {/* Status banner */}
      <View style={[styles.statusBar, { borderColor: c.border, backgroundColor: c.surface }]}>
        <View>
          <Text style={[styles.statusTitle, { color: c.text, fontFamily: fonts.sansBold }]}>Connected marketplace</Text>
          <Text style={[styles.statusSub, { color: c.muted, fontFamily: fonts.sans }]}>Live API · maps · bookings · payments · chat</Text>
        </View>
        <View style={[styles.liveDot2, { backgroundColor: c.primary, ...shadows.card }]} />
      </View>

      <OfflineBanner visible={query.isError && items.length > 0} />
      {query.isError && items.length === 0 && (
        <Text style={[styles.errorText, { color: c.danger, fontFamily: fonts.sans }]}>
          {query.error instanceof Error ? query.error.message : "Unable to load live listings."}
        </Text>
      )}

      <SectionTitle
        title={query.isFetching ? "Refreshing…" : `Featured ${type === "RENT" ? "rentals" : type === "SALE" ? "properties for sale" : "short stays"}`}
        action="View all"
        onAction={() => { selection(); router.push({ pathname: "/search", params: { listingType: type } }); }}
      />
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <StatusBar barStyle={c.statusBar === "#07100D" ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />
      <FlatList
        data={items}
        keyExtractor={x => x.listing.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: 110 + insets.bottom }]}
        refreshing={query.isFetching}
        onRefresh={() => void query.refetch()}
        ListHeaderComponent={ListHeader}
        renderItem={({ item }) => (
          <PropertyCard item={item} onPress={() => { selection(); router.push("/property/" + item.property.id); }} />
        )}
        ListEmptyComponent={
          query.isPending
            ? <ActivityIndicator color={c.primary} style={styles.loader} />
            : (
              <View style={styles.empty}>
                <Ionicons name="search" size={40} color={c.subtle} style={{ marginBottom: 12 }} />
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
  hero: { borderWidth: 1, borderRadius: radius.xl, padding: 20, marginBottom: spacing.md, marginTop: spacing.sm },
  heroTop: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  brandBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill },
  brandText: { fontSize: 13, letterSpacing: 2 },
  liveDot: { width: 7, height: 7, borderRadius: 4 },
  liveDot2: { width: 10, height: 10, borderRadius: 5 },
  heroSub: { fontSize: 12 },
  heroH1: { fontSize: typography.display, letterSpacing: -1.4, lineHeight: 40, marginBottom: 10 },
  heroLead: { fontSize: 14, lineHeight: 22, marginBottom: 18, opacity: 0.8 },
  searchRow: { marginBottom: 10 },
  searchField: {},
  chipRow: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginBottom: 14 },
  searchBtn: { marginTop: 2 },
  actionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.md },
  actionCard: { width: "47.5%", minHeight: 100, borderWidth: 1, borderRadius: radius.lg, padding: 14 },
  actionIcon: { width: 40, height: 40, borderRadius: radius.md, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  actionLabel: { fontSize: 14, marginBottom: 3 },
  actionSub: { fontSize: 11, lineHeight: 16 },
  statusBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderRadius: radius.md, padding: 14, marginBottom: spacing.md },
  statusTitle: { fontSize: 13 },
  statusSub: { fontSize: 11, marginTop: 3, opacity: 0.8 },
  loader: { marginTop: 40 },
  errorText: { textAlign: "center", marginVertical: spacing.md, fontSize: 14 },
  empty: { padding: 32, alignItems: "center" },
  emptyTitle: { fontSize: 22, marginBottom: 8 },
  emptySub: { textAlign: "center", fontSize: 14, lineHeight: 21, marginBottom: 20 },
  emptyBtn: {},
});
