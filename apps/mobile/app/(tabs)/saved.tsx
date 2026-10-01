import { router } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FlatList, Pressable, StatusBar, StyleSheet,
  Text, View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "../../src/lib/api";
import { RemoteImage, Button, PropertyCardSkeleton } from "../../src/components/ui";
import { useTheme } from "../../src/stores/theme";
import { fonts, radius, shadows, spacing, typography } from "../../src/theme";
import { selection } from "../../src/lib/haptics";

export default function Saved() {
  const c = useTheme(s => s.palette);
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["favorites"], queryFn: () => api<any[]>("/favorites", {}, true) });
  const remove = useMutation({
    mutationFn: (id: string) => api("/favorites/" + id, { method: "DELETE" }, true),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["favorites"] }),
  });
  const items = q.data ?? [];

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <StatusBar barStyle={c.statusBar === "#07100D" ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />
      <FlatList
        data={items}
        keyExtractor={(a: any) => String(a.propertyId || a.id)}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: 110 + insets.bottom }]}
        refreshing={q.isRefetching}
        onRefresh={() => void q.refetch()}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={[styles.eyebrow, { color: c.primary, fontFamily: fonts.sansBold }]}>SHORTLIST</Text>
            <Text style={[styles.h1, { color: c.text, fontFamily: fonts.displayStrong }]}>Saved.</Text>
            <Text style={[styles.sub, { color: c.muted, fontFamily: fonts.sans }]}>
              Your account-backed shortlist syncs across all your devices.
            </Text>
            {items.length > 0 && (
              <View style={[styles.countRow, { backgroundColor: c.primarySoft }]}>
                <Ionicons name="heart" size={14} color={c.primary} />
                <Text style={[styles.countText, { color: c.primary, fontFamily: fonts.sansBold }]}>
                  {items.length} saved {items.length === 1 ? "property" : "properties"}
                </Text>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          q.isPending ? (
            <PropertyCardSkeleton />
          ) : (
            <View style={styles.empty}>
              <Ionicons name="heart-outline" size={44} color={c.subtle} style={{ marginBottom: 14 }} />
              <Text style={[styles.emptyTitle, { color: c.text, fontFamily: fonts.displayStrong }]}>
                No saved properties
              </Text>
              <Text style={[styles.emptySub, { color: c.muted, fontFamily: fonts.sans }]}>
                Save listings from search results and they stay attached to your account.
              </Text>
              <Pressable
                style={[styles.exploreBtn, { backgroundColor: c.primary }]}
                onPress={() => { selection(); router.push("/search"); }}
              >
                <Text style={[styles.exploreBtnText, { color: c.primaryFg, fontFamily: fonts.sansBold }]}>
                  Explore properties
                </Text>
              </Pressable>
            </View>
          )
        }
        renderItem={({ item }: any) => {
          const id = String(item.propertyId || item.id);
          const p = item.property || item;
          const priceMinor = p.listings?.[0]?.priceMinor;
          const formatted = priceMinor
            ? new Intl.NumberFormat("en-RW", { style: "currency", currency: "RWF", maximumFractionDigits: 0 }).format(priceMinor)
            : null;
          return (
            <Pressable
              onPress={() => { selection(); router.push("/property/" + id); }}
              style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }, shadows.card]}
              android_ripple={{ color: c.ripple }}
            >
              <RemoteImage uri={p.media?.[0]?.url} style={styles.image} accessibilityLabel={p.title} />
              <View style={styles.cardBody}>
                {formatted && (
                  <Text style={[styles.price, { color: c.text, fontFamily: fonts.displayStrong }]}>
                    {formatted}
                  </Text>
                )}
                <Text style={[styles.title, { color: c.text, fontFamily: fonts.sansBold }]} numberOfLines={2}>
                  {p.title || item.title || id}
                </Text>
                {(p.district || item.district) && (
                  <View style={styles.locationRow}>
                    <Ionicons name="location-outline" size={12} color={c.primary} />
                    <Text style={[styles.district, { color: c.muted, fontFamily: fonts.sans }]}>
                      {p.district || item.district}
                    </Text>
                  </View>
                )}
                <View style={styles.specsRow}>
                  {p.bedrooms != null && (
                    <View style={styles.specItem}>
                      <Ionicons name="bed-outline" size={12} color={c.muted} />
                      <Text style={[styles.specText, { color: c.muted, fontFamily: fonts.sansMedium }]}>
                        {p.bedrooms} bd
                      </Text>
                    </View>
                  )}
                  {p.bathrooms != null && (
                    <View style={styles.specItem}>
                      <Ionicons name="water-outline" size={12} color={c.muted} />
                      <Text style={[styles.specText, { color: c.muted, fontFamily: fonts.sansMedium }]}>
                        {p.bathrooms} ba
                      </Text>
                    </View>
                  )}
                </View>
                <Button
                  title={remove.isPending && remove.variables === id ? "Removing…" : "Remove"}
                  size="sm"
                  variant="ghost"
                  onPress={() => { selection(); remove.mutate(id); }}
                  disabled={remove.isPending}
                  style={styles.removeBtn}
                />
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: spacing.md },
  header: { marginBottom: spacing.lg },
  eyebrow: { fontSize: 11, letterSpacing: 2, marginBottom: 6 },
  h1: { fontSize: typography.display, letterSpacing: -1.4, marginBottom: 8 },
  sub: { fontSize: 14, lineHeight: 21, opacity: 0.85, marginBottom: 14 },
  countRow: {
    flexDirection: "row", alignItems: "center", gap: 6,
    alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: radius.pill,
  },
  countText: { fontSize: 13 },
  card: {
    borderWidth: 1, borderRadius: radius.lg, overflow: "hidden",
    flexDirection: "row", gap: 0, marginBottom: spacing.sm,
  },
  image: { width: 120, height: 120 },
  cardBody: { flex: 1, padding: 12, justifyContent: "space-between" },
  price: { fontSize: 17, letterSpacing: -0.5, marginBottom: 4 },
  title: { fontSize: 14, lineHeight: 20, marginBottom: 4 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 4 },
  district: { fontSize: 12 },
  specsRow: { flexDirection: "row", gap: 12, marginBottom: 4 },
  specItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  specText: { fontSize: 11 },
  removeBtn: { alignSelf: "flex-start" },
  empty: { paddingVertical: 48, alignItems: "center", paddingHorizontal: 24 },
  emptyTitle: { fontSize: typography.subtitle, letterSpacing: -0.5, marginBottom: 10 },
  emptySub: { textAlign: "center", fontSize: 14, lineHeight: 21, marginBottom: 24 },
  exploreBtn: { paddingHorizontal: 24, paddingVertical: 14, borderRadius: radius.md },
  exploreBtnText: { fontSize: 15 },
});
