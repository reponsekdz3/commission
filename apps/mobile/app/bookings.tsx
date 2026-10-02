import { router } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../src/lib/api";
import { Button, OfflineBanner } from "../src/components/ui";
import { useTheme } from "../src/stores/theme";
import { fonts, radius, spacing } from "../src/theme";

export default function Bookings() {
  const c = useTheme(s => s.palette);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["bookings"], queryFn: () => api<any[]>("/bookings", {}, true) });
  const cancel = useMutation({
    mutationFn: (id: string) => api("/bookings/" + id + "/cancel", { method: "POST" }, true),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bookings"] }),
  });
  const items = q.data || [];

  return (
    <View style={[s.root, { backgroundColor: c.bg }]}>
      <FlatList
        data={items}
        contentContainerStyle={s.pad}
        keyExtractor={x => x.id}
        refreshing={q.isRefetching}
        onRefresh={() => void q.refetch()}
        ListHeaderComponent={
          <View>
            <Text style={[s.eyebrow, { color: c.primary, fontFamily: fonts.sansBold }]}>TRANSACTIONS</Text>
            <Text style={[s.title, { color: c.text, fontFamily: fonts.displayStrong }]}>Bookings.</Text>
            <Text style={[s.sub, { color: c.muted }]}>Upcoming and historical reservations from the live booking service.</Text>
            {q.isError && <OfflineBanner visible />}
            {items.length > 0 && (
              <View style={s.stats}>
                {[
                  ["Total", items.length],
                  ["Open", items.filter((b: any) => !["CANCELLED", "COMPLETED"].includes(b.status)).length],
                ].map(([label, value]) => (
                  <View key={String(label)} style={[s.stat, { backgroundColor: c.surface, borderColor: c.border }]}>
                    <Text style={{ color: c.muted, fontSize: 11, fontFamily: fonts.sansBold }}>{String(label).toUpperCase()}</Text>
                    <Text style={[s.statNum, { color: c.text }]}>{String(value)}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push({ pathname: "/booking/[id]", params: { id: item.id } })}
            style={[s.card, { backgroundColor: c.surface, borderColor: c.border }]}
          >
            <View style={s.row}>
              <View style={[s.icon, { backgroundColor: c.primarySoft }]}>
                <Ionicons name="calendar" size={16} color={c.primary} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[s.code, { color: c.text }]} numberOfLines={1}>
                  {item.property?.title || `${String(item.id).slice(0, 8)}…`}
                </Text>
                <Text style={{ color: c.muted, marginTop: 4, fontSize: 12 }}>
                  {item.startDate} → {item.endDate}
                </Text>
              </View>
              <View style={[s.statusPill, { backgroundColor: c.primarySoft }]}>
                <Text style={[s.status, { color: c.primary }]}>{item.status}</Text>
              </View>
            </View>
            {item.status !== "CANCELLED" && item.status !== "COMPLETED" && (
              <Button
                title={cancel.isPending ? "Cancelling…" : "Cancel booking"}
                variant="ghost"
                size="sm"
                onPress={() => cancel.mutate(item.id)}
                disabled={cancel.isPending}
              />
            )}
          </Pressable>
        )}
        ListEmptyComponent={
          !q.isPending ? (
            <View style={s.empty}>
              <Ionicons name="calendar-outline" size={36} color={c.subtle} />
              <Text style={{ color: c.text, fontFamily: fonts.sansBold, marginTop: 10 }}>No bookings yet</Text>
              <Text style={{ color: c.muted, textAlign: "center", marginTop: 6 }}>Created reservations appear here in real time.</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  pad: { padding: spacing.lg, paddingBottom: 110 },
  eyebrow: { fontSize: 11, letterSpacing: 2, marginTop: 8 },
  title: { fontSize: 34, marginTop: 5, letterSpacing: -1 },
  sub: { fontSize: 14, lineHeight: 21, marginTop: 6, marginBottom: 18 },
  stats: { flexDirection: "row", gap: 8, marginBottom: 8 },
  stat: { flex: 1, borderWidth: 1, borderRadius: 16, padding: 14 },
  statNum: { fontSize: 22, fontWeight: "900", marginTop: 4 },
  card: { borderWidth: 1, borderRadius: 18, padding: 15, marginBottom: 10, gap: 12 },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  icon: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  code: { fontWeight: "900", fontSize: 16 },
  statusPill: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  status: { fontWeight: "900", fontSize: 10 },
  empty: { alignItems: "center", padding: 40 },
});
