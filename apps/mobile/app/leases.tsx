import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../src/lib/api";
import { Button } from "../src/components/ui";
import { useTheme } from "../src/stores/theme";
import { fonts, spacing } from "../src/theme";

export default function Leases() {
  const c = useTheme(s => s.palette);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["leases"], queryFn: () => api<any[]>("/leases", {}, true) });
  const sign = useMutation({
    mutationFn: (id: string) => api("/leases/" + id + "/sign", { method: "POST" }, true),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leases"] }),
  });

  return (
    <View style={[s.root, { backgroundColor: c.bg }]}>
      <FlatList
        data={q.data || []}
        contentContainerStyle={s.pad}
        keyExtractor={x => x.id}
        refreshing={q.isRefetching}
        onRefresh={() => void q.refetch()}
        ListHeaderComponent={
          <View>
            <Text style={[s.eyebrow, { color: c.primary, fontFamily: fonts.sansBold }]}>RENTAL OPERATIONS</Text>
            <Text style={[s.title, { color: c.text, fontFamily: fonts.displayStrong }]}>Leases.</Text>
            <Text style={[s.sub, { color: c.muted }]}>Sign and manage tenancy agreements from your authenticated account.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[s.card, { backgroundColor: c.surface, borderColor: c.border }]}>
            <View style={s.head}>
              <View style={[s.icon, { backgroundColor: c.primarySoft }]}>
                <Ionicons name="document-text" size={16} color={c.primary} />
              </View>
              <Text style={[s.code, { color: c.text, flex: 1 }]} numberOfLines={1}>
                {item.property?.title || `Lease ${String(item.id).slice(0, 8)}…`}
              </Text>
            </View>
            <Text style={{ color: c.muted, marginTop: 8, fontSize: 13 }}>
              Tenant signed: {item.tenant_signature_hash ? "Yes" : "No"} · Landlord signed: {item.landlord_signature_hash ? "Yes" : "No"}
            </Text>
            <View style={s.row}>
              <Button
                title={sign.isPending ? "Signing…" : "Sign lease"}
                size="sm"
                onPress={() => sign.mutate(item.id)}
                disabled={Boolean(item.status === "COMPLETED") || sign.isPending}
              />
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={s.empty}>
            <Ionicons name="document-outline" size={32} color={c.subtle} />
            <Text style={{ color: c.muted, marginTop: 10 }}>No leases yet.</Text>
          </View>
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
  card: { borderWidth: 1, borderRadius: 18, padding: 15, marginBottom: 10 },
  head: { flexDirection: "row", alignItems: "center", gap: 10 },
  icon: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  code: { fontWeight: "900", fontSize: 16 },
  row: { marginTop: 12, flexDirection: "row" },
  empty: { alignItems: "center", padding: 40 },
});
