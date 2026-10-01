import { useQuery } from "@tanstack/react-query";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api, money } from "../src/lib/api";
import { useTheme } from "../src/stores/theme";
import { Button } from "../src/components/ui";
import { fonts, radius, spacing } from "../src/theme";

const STATS = [
  { key: "properties", label: "Properties", icon: "home" as const },
  { key: "active", label: "Active", icon: "flash" as const },
  { key: "views", label: "Views", icon: "eye" as const },
  { key: "bookings", label: "Bookings", icon: "calendar" as const },
] as const;

export default function Dashboard() {
  const c = useTheme(s => s.palette);
  const q = useQuery({
    queryKey: ["landlord-dashboard"],
    queryFn: async () => {
      const [a, p] = await Promise.all([
        api<any>("/analytics/landlord", {}, true),
        api<any[]>("/properties/owned", {}, true),
      ]);
      return { a, p: p || [] };
    },
  });

  return (
    <ScrollView
      style={[s.root, { backgroundColor: c.bg }]}
      contentContainerStyle={s.pad}
      refreshControl={
        <RefreshControl refreshing={q.isFetching && !q.isPending} onRefresh={() => void q.refetch()} tintColor={c.primary} />
      }
    >
      <Text style={[s.eyebrow, { color: c.primary, fontFamily: fonts.sansBold }]}>
        OWNER WORKSPACE
      </Text>
      <Text style={[s.h1, { color: c.text, fontFamily: fonts.displayStrong }]}>
        Your portfolio.
      </Text>
      <Text style={[s.sub, { color: c.muted }]}>
        Live analytics, listings and booking activity from your Imizi account.
      </Text>

      {q.isPending && (
        <View style={s.loading}>
          <ActivityIndicator color={c.primary} />
          <Text style={{ color: c.muted, marginTop: 10 }}>Loading portfolio metrics…</Text>
        </View>
      )}

      {q.isError && (
        <View style={[s.errorBox, { backgroundColor: c.dangerSoft, borderColor: c.danger }]}>
          <Text style={{ color: c.danger, fontFamily: fonts.sansSemi }}>
            Unable to load portfolio metrics.
          </Text>
          <Button title="Retry" size="sm" variant="ghost" onPress={() => void q.refetch()} />
        </View>
      )}

      {q.data?.a && (
        <>
          <View style={s.stats}>
            {STATS.map(({ key, label, icon }) => (
              <View
                key={key}
                style={[s.stat, { backgroundColor: c.surface, borderColor: c.border }]}
              >
                <View style={s.statHead}>
                  <Text style={{ color: c.muted, fontSize: 11, fontFamily: fonts.sansBold }}>
                    {label.toUpperCase()}
                  </Text>
                  <View style={[s.statIcon, { backgroundColor: c.primarySoft }]}>
                    <Ionicons name={icon} size={14} color={c.primary} />
                  </View>
                </View>
                <Text style={[s.num, { color: c.text }]}>
                  {String(q.data.a[key] ?? 0)}
                </Text>
              </View>
            ))}
          </View>

          <View style={[s.revenue, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Text style={{ color: c.muted, fontFamily: fonts.sansSemi, fontSize: 12 }}>
              Recorded revenue
            </Text>
            <Text style={[s.money, { color: c.text }]}>
              {money(q.data.a.revenue || 0)}
            </Text>
          </View>
        </>
      )}

      <View style={s.sectionHead}>
        <Text style={[s.sectionTitle, { color: c.text }]}>Your properties</Text>
        <Pressable onPress={() => router.push("/add-property")}>
          <Text style={{ color: c.primary, fontFamily: fonts.sansBold, fontSize: 13 }}>Add new</Text>
        </Pressable>
      </View>

      {q.data?.p?.length === 0 && (
        <View style={[s.empty, { borderColor: c.border, backgroundColor: c.surface }]}>
          <Ionicons name="home-outline" size={28} color={c.subtle} />
          <Text style={{ color: c.text, fontFamily: fonts.sansBold, marginTop: 8 }}>
            No properties yet
          </Text>
          <Text style={{ color: c.muted, textAlign: "center", marginTop: 4, fontSize: 13 }}>
            Create your first listing to start receiving bookings.
          </Text>
        </View>
      )}

      {q.data?.p?.map((x: any) => (
        <Pressable
          key={x.id}
          style={[s.row, { backgroundColor: c.surface, borderColor: c.border }]}
          onPress={() => router.push("/property/" + x.id)}
        >
          <View style={[s.rowIcon, { backgroundColor: c.primarySoft }]}>
            <Ionicons name="home" size={16} color={c.primary} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[s.bold, { color: c.text }]} numberOfLines={1}>
              {x.title}
            </Text>
            <Text style={{ color: c.muted, marginTop: 4, fontSize: 12 }} numberOfLines={1}>
              {x.district} · {x.status} · {x.verificationStatus}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={c.subtle} />
        </Pressable>
      ))}

      <View style={{ marginTop: 16, gap: 10 }}>
        <Button title="Add new property" onPress={() => router.push("/add-property")} />
        <Button title="Open bookings" variant="ghost" onPress={() => router.push("/bookings")} />
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  pad: { padding: spacing.lg, paddingBottom: 110 },
  eyebrow: { fontSize: 11, letterSpacing: 2 },
  h1: { fontSize: 34, marginTop: 6, letterSpacing: -1 },
  sub: { fontSize: 14, lineHeight: 21, marginTop: 8, marginBottom: 20 },
  loading: { alignItems: "center", paddingVertical: 40 },
  errorBox: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 14,
    gap: 10,
    marginBottom: 12,
  },
  stats: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  stat: {
    width: "47%",
    flexGrow: 1,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  statHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  num: { fontSize: 26, fontWeight: "900", marginTop: 10, letterSpacing: -0.5 },
  revenue: {
    borderWidth: 1,
    borderRadius: 17,
    padding: 16,
    marginTop: 10,
    marginBottom: 8,
  },
  money: { fontSize: 28, fontWeight: "900", marginTop: 6, letterSpacing: -0.5 },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 22,
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 17, fontWeight: "800" },
  empty: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 17,
    padding: 28,
    alignItems: "center",
  },
  row: {
    borderWidth: 1,
    borderRadius: 17,
    padding: 14,
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  bold: { fontWeight: "800", fontSize: 14 },
});
