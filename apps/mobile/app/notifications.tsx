import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../src/lib/api";
import { useTheme } from "../src/stores/theme";
import { fonts, spacing } from "../src/theme";
import { Button } from "../src/components/ui";

export default function Notifications() {
  const c = useTheme(s => s.palette);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["notifications"], queryFn: () => api<any[]>("/notifications", {}, true) });
  const read = useMutation({
    mutationFn: () => api("/notifications/read-all", { method: "PATCH" }, true),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
  const unread = (q.data || []).some((x: any) => !(x.read_at || x.readAt));

  return (
    <View style={[s.root, { backgroundColor: c.bg }]}>
      <FlatList
        data={q.data || []}
        contentContainerStyle={s.pad}
        keyExtractor={x => x.id}
        refreshing={q.isRefetching}
        onRefresh={() => void q.refetch()}
        ListHeaderComponent={
          <View style={s.head}>
            <View style={{ flex: 1 }}>
              <Text style={[s.eyebrow, { color: c.primary, fontFamily: fonts.sansBold }]}>ACTIVITY</Text>
              <Text style={[s.h1, { color: c.text, fontFamily: fonts.displayStrong }]}>Notifications.</Text>
            </View>
            {unread && (
              <Button title="Read all" size="sm" variant="ghost" onPress={() => read.mutate()} disabled={read.isPending} />
            )}
          </View>
        }
        ListEmptyComponent={
          q.isPending ? (
            <ActivityIndicator color={c.primary} />
          ) : (
            <View style={s.empty}>
              <Ionicons name="notifications-outline" size={36} color={c.subtle} />
              <Text style={{ color: c.muted, marginTop: 10, textAlign: "center" }}>No notifications yet.</Text>
            </View>
          )
        }
        renderItem={({ item }) => {
          const isRead = !!(item.read_at || item.readAt);
          return (
            <Pressable
              onPress={() => {
                const d = item.data || item.payload || {};
                if (d.bookingId) router.push({ pathname: "/booking/[id]", params: { id: String(d.bookingId) } });
                else if (d.propertyId) router.push({ pathname: "/property/[id]", params: { id: String(d.propertyId) } });
                else if (d.threadId) router.push({ pathname: "/chat/[threadId]", params: { threadId: String(d.threadId) } });
              }}
              style={[s.row, { backgroundColor: c.surface, borderColor: isRead ? c.border : c.primary, opacity: isRead ? 0.78 : 1 }]}
            >
              <View style={[s.icon, { backgroundColor: c.primarySoft }]}>
                <Ionicons name="notifications" size={16} color={c.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.bold, { color: c.text }]}>{item.title || item.type || "Notification"}</Text>
                <Text style={[s.body, { color: c.muted }]}>{item.body || item.message || ""}</Text>
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  pad: { padding: spacing.lg, paddingBottom: 100 },
  head: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 18, gap: 12 },
  eyebrow: { fontSize: 11, letterSpacing: 2 },
  h1: { fontSize: 32, marginTop: 4, letterSpacing: -1 },
  row: { borderWidth: 1, borderRadius: 17, padding: 15, marginBottom: 9, flexDirection: "row", gap: 12, alignItems: "flex-start" },
  icon: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  bold: { fontWeight: "900", fontSize: 15 },
  body: { marginTop: 4, lineHeight: 20, fontSize: 13 },
  empty: { alignItems: "center", padding: 40 },
});
