import { router, useLocalSearchParams } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useVideoPlayer, VideoView } from "expo-video";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api, money } from "../../src/lib/api";
import { Gallery, BookingBar } from "../../src/components/property";
import { Button, Chip, Input } from "../../src/components/ui";
import { isSignedIn } from "../../src/lib/session";
import { useTheme } from "../../src/stores/theme";
import { fonts, radius, shadows, spacing } from "../../src/theme";
import { selection } from "../../src/lib/haptics";

function PropertyVideo({ url }: { url: string }) {
  const player = useVideoPlayer(url, p => { p.loop = false; });
  return (
    <VideoView
      player={player}
      nativeControls
      style={{ width: "100%", height: 240, borderRadius: 18, marginTop: 12, backgroundColor: "#111" }}
    />
  );
}

export default function Property() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const c = useTheme(s => s.palette);
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [offer, setOffer] = useState("");
  const [showViewing, setShowViewing] = useState(false);

  const q = useQuery({
    queryKey: ["property", id],
    enabled: Boolean(id),
    queryFn: () => api<any>("/properties/" + id),
  });
  const p = q.data;
  const l = p?.listings?.[0];
  const media = useMemo(() => ((p?.media || []).filter((m: any) => m.url).map((m: any) => m.url)), [p]);

  const fav = useQuery({
    queryKey: ["favorite-state", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const rows = await api<any[]>("/favorites", {}, true);
      return rows.some((x: any) => String(x.propertyId || x.id) === String(id));
    },
  });
  const save = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error("Property is missing");
      return fav.data
        ? api("/favorites/" + id, { method: "DELETE" }, true)
        : api("/favorites/" + id, { method: "POST" }, true);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["favorite-state", id] }),
  });
  const slots = useQuery({
    queryKey: ["viewing-slots", l?.id],
    enabled: showViewing && Boolean(l?.id),
    queryFn: () => api<any[]>("/viewings/slots/" + l.id),
  });
  const offerMutation = useMutation({
    mutationFn: async () => {
      if (!l) throw new Error("Listing unavailable");
      return api("/offers", {
        method: "POST",
        body: JSON.stringify({ listingId: l.id, amountMinor: Number(offer), currency: l.currency || "RWF" }),
      }, true);
    },
    onSuccess: () => {
      setOffer("");
      Alert.alert("Offer sent", "The seller can now accept, reject or counter it.");
    },
  });

  async function auth() {
    if (!(await isSignedIn())) { router.push("/login"); return false; }
    return true;
  }
  async function chat() {
    if (!await auth()) return;
    try {
      await api("/messages", {
        method: "POST",
        body: JSON.stringify({ propertyId: p.id, recipientId: p.ownerId, body: "I am interested in this property. When can we view it?" }),
      }, true);
      router.push({ pathname: "/chat/[threadId]", params: { threadId: "property-" + p.id } });
    } catch (e) { Alert.alert("Message", e instanceof Error ? e.message : "Unable to start conversation"); }
  }
  async function requestViewing(slotStart: string) {
    if (!await auth()) return;
    try {
      await api("/viewings", { method: "POST", body: JSON.stringify({ listingId: l.id, slotStart }) }, true);
      setShowViewing(false);
      Alert.alert("Viewing requested", "Your selected slot is now with the owner or agent.");
    } catch (e) { Alert.alert("Viewing", e instanceof Error ? e.message : "Unable to request viewing"); }
  }

  if (q.isPending) {
    return (
      <View style={[s.center, { backgroundColor: c.bg }]}>
        <View style={[s.loadingIcon, { backgroundColor: c.primarySoft }]}>
          <Ionicons name="home-outline" size={28} color={c.primary} />
        </View>
        <Text style={[s.loadingText, { color: c.muted, fontFamily: fonts.sans }]}>Loading property…</Text>
      </View>
    );
  }
  if (q.isError || !p) {
    return (
      <View style={[s.center, { backgroundColor: c.bg }]}>
        <Text style={{ color: c.danger, fontFamily: fonts.sans }}>Unable to load this property.</Text>
        <Button title="Retry" onPress={() => void q.refetch()} />
      </View>
    );
  }

  const SPECS = [
    { icon: "bed-outline",    label: "Beds",    val: p.bedrooms },
    { icon: "water-outline",  label: "Baths",   val: p.bathrooms },
    { icon: "car-outline",    label: "Parking", val: p.parking },
    { icon: "expand-outline", label: "Area",    val: p.areaValue != null ? `${p.areaValue} ${p.areaUnit ?? ""}`.trim() : null },
  ] as const;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: l ? 120 : 40 }}>
        {/* Top controls */}
        <View style={[s.top, { top: insets.top + 10 }]}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.back()}
            style={[s.circle, { backgroundColor: c.glass, borderColor: c.border }]}
          >
            <Ionicons name="arrow-back" size={20} color={c.text} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => { selection(); save.mutate(); }}
            disabled={save.isPending}
            style={[s.circle, { backgroundColor: c.glass, borderColor: c.border }]}
          >
            <Ionicons
              name={fav.data ? "heart" : "heart-outline"}
              size={20}
              color={fav.data ? c.primary : c.text}
            />
          </Pressable>
        </View>

        {/* Gallery */}
        {media.length
          ? <Gallery urls={media} />
          : <View style={[s.noMedia, { backgroundColor: c.surface3 }]}>
              <Ionicons name="home-outline" size={36} color={c.subtle} />
              <Text style={{ color: c.muted, fontFamily: fonts.sans, marginTop: 8 }}>Media is still processing.</Text>
            </View>
        }

        <View style={s.pad}>
          {/* Badges */}
          <View style={s.badges}>
            <Chip
              label={p.verificationStatus === "VERIFIED" ? "✓ VERIFIED" : "LISTED"}
              active={p.verificationStatus === "VERIFIED"}
            />
            {p.propertyType && <Chip label={p.propertyType} />}
          </View>

          {/* Title */}
          <Text style={[s.title, { color: c.text, fontFamily: fonts.displayStrong }]}>{p.title}</Text>

          {/* Location */}
          <View style={s.locationRow}>
            <Ionicons name="location-outline" size={14} color={c.primary} />
            <Text style={[s.meta, { color: c.muted, fontFamily: fonts.sans }]}>
              {[p.village, p.cell, p.sector, p.district, p.province].filter(Boolean).join(" · ")}
            </Text>
          </View>

          {/* Price */}
          <Text style={[s.price, { color: c.text, fontFamily: fonts.displayStrong }]}>
            {l ? money(l.priceMinor) : "Price on request"}
            {l?.listingType === "RENT" && <Text style={{ fontSize: 15, color: c.muted, fontWeight: "600" }}> / month</Text>}
          </Text>

          {/* Spec grid */}
          <View style={s.specGrid}>
            {SPECS.map(({ icon, label, val }) => (
              <View key={label} style={[s.specCard, { backgroundColor: c.surface2, borderColor: c.border }]}>
                <Ionicons name={icon as any} size={18} color={c.primary} />
                <Text style={[s.specVal, { color: c.text, fontFamily: fonts.displayStrong }]}>
                  {String(val ?? "—")}
                </Text>
                <Text style={[s.specLabel, { color: c.muted, fontFamily: fonts.sans }]}>{label}</Text>
              </View>
            ))}
          </View>

          {/* Amenities */}
          {(p.amenities?.length ?? 0) > 0 && (
            <>
              <Text style={[s.heading, { color: c.text, fontFamily: fonts.displayStrong }]}>Amenities</Text>
              <View style={s.chips}>
                {(p.amenities || []).map((x: string) => <Chip key={x} label={x} />)}
              </View>
            </>
          )}

          {/* Description */}
          <Text style={[s.heading, { color: c.text, fontFamily: fonts.displayStrong }]}>Overview</Text>
          <Text style={[s.body, { color: c.muted, fontFamily: fonts.sans }]}>{p.description}</Text>

          {/* Map */}
          {p.latitude && p.longitude && (
            <>
              <Text style={[s.heading, { color: c.text, fontFamily: fonts.displayStrong }]}>Location</Text>
              <MapView
                style={s.map}
                initialRegion={{
                  latitude: Number(p.latitude), longitude: Number(p.longitude),
                  latitudeDelta: 0.02, longitudeDelta: 0.02,
                }}
              >
                <Marker coordinate={{ latitude: Number(p.latitude), longitude: Number(p.longitude) }} title={p.title} />
              </MapView>
            </>
          )}

          {/* Actions */}
          {l && (
            <View style={[s.actions, { backgroundColor: c.surface, borderColor: c.border }]}>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <Button title="Request viewing" variant="accent" size="sm" onPress={() => { selection(); setShowViewing(true); }} />
                <Button title="Message owner" variant="ghost" size="sm" onPress={() => void chat()} />
              </View>
              {l.listingType === "SALE" && (
                <View style={{ marginTop: 14 }}>
                  <Input
                    label="Offer amount (RWF minor units)"
                    value={offer}
                    onChangeText={v => setOffer(v.replace(/\D/g, ""))}
                    keyboardType="number-pad"
                  />
                  <Button
                    title={offerMutation.isPending ? "Sending…" : "Submit offer"}
                    onPress={() => offerMutation.mutate()}
                    disabled={!offer || offerMutation.isPending}
                  />
                  {offerMutation.isError && (
                    <Text style={{ color: c.danger, marginTop: 7, fontFamily: fonts.sans }}>
                      {offerMutation.error instanceof Error ? offerMutation.error.message : "Offer failed"}
                    </Text>
                  )}
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {l && (
        <BookingBar
          price={money(l.priceMinor) + (l.listingType === "RENT" ? "/mo" : "")}
          onBook={() => router.push({ pathname: "/booking", params: { listingId: l.id } })}
        />
      )}

      {/* Viewing modal */}
      <Modal visible={showViewing} transparent animationType="slide" onRequestClose={() => setShowViewing(false)}>
        <View style={[s.modal, { backgroundColor: c.scrim }]}>
          <View style={[s.sheet, { backgroundColor: c.surface }]}>
            <View style={s.sheetHandle} />
            <Text style={[s.heading, { color: c.text, marginTop: 0, fontFamily: fonts.displayStrong }]}>
              Choose a viewing slot
            </Text>
            {slots.isPending && (
              <Text style={{ color: c.muted, fontFamily: fonts.sans }}>Loading available slots…</Text>
            )}
            {slots.data?.map((slot: any) => (
              <Pressable
                key={String(slot.slotStart || slot.id)}
                onPress={() => void requestViewing(slot.slotStart)}
                style={[s.slot, { borderColor: c.border, backgroundColor: c.surface2 }]}
              >
                <Text style={{ color: c.text, fontWeight: "800", fontFamily: fonts.sansBold }}>
                  {new Date(slot.slotStart).toLocaleString()}
                </Text>
                <Text style={{ color: c.muted, fontFamily: fonts.sans }}>Request this slot →</Text>
              </Pressable>
            ))}
            {!slots.isPending && !slots.data?.length && (
              <Text style={{ color: c.muted, fontFamily: fonts.sans }}>
                No available viewing slots are currently published.
              </Text>
            )}
            <Button title="Close" variant="ghost" onPress={() => setShowViewing(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14, padding: 20 },
  loadingIcon: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  loadingText: { fontSize: 15 },
  top: { position: "absolute", left: 14, right: 14, zIndex: 4, flexDirection: "row", justifyContent: "space-between" },
  circle: { width: 44, height: 44, borderWidth: 1, borderRadius: 22, alignItems: "center", justifyContent: "center", ...shadows.card },
  pad: { padding: spacing.lg },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 10 },
  title: { fontSize: 30, marginTop: 12, letterSpacing: -0.8, lineHeight: 38 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8, marginBottom: 14 },
  meta: { fontSize: 13, lineHeight: 20, flex: 1 },
  price: { fontSize: 26, letterSpacing: -0.8, marginBottom: 18 },
  specGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 },
  specCard: {
    flex: 1, minWidth: "22%", borderWidth: 1, borderRadius: radius.md,
    padding: 12, alignItems: "center", gap: 4,
  },
  specVal: { fontSize: 18, letterSpacing: -0.4 },
  specLabel: { fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 8 },
  heading: { fontSize: 20, fontWeight: "900", marginTop: 24, marginBottom: 10, letterSpacing: -0.4 },
  body: { fontSize: 15, lineHeight: 24 },
  map: { height: 230, borderRadius: 18, marginTop: 4 },
  actions: { borderWidth: 1, borderRadius: 18, padding: 16, marginTop: 20 },
  slot: { borderWidth: 1, borderRadius: 14, padding: 13, marginTop: 8, gap: 4 },
  noMedia: { height: 270, alignItems: "center", justifyContent: "center", gap: 8 },
  modal: { flex: 1, justifyContent: "flex-end" },
  sheet: { padding: 20, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingBottom: 34 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#CBD5D1", alignSelf: "center", marginBottom: 16 },
});
