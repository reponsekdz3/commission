import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Pressable } from "../motion";
import { RemoteImage } from "../ui";
import { money, SearchItem } from "../../lib/api";
import { radius, spacing, shadows } from "../../theme";
import { useTheme } from "../../stores/theme";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  item: SearchItem;
  onPress: () => void;
  variant?: "default" | "compact" | "large";
  saved?: boolean;
  onSave?: () => void;
};

export function PropertyCard({ item, onPress, variant = "default", saved = false, onSave }: Props) {
  const c = useTheme(s => s.palette);
  const p = item.property;
  const l = item.listing;
  const uri = p.media?.[0]?.url;
  const isCompact = variant === "compact";
  const isLarge = variant === "large";

  const imgHeight = isCompact ? 100 : isLarge ? 240 : 190;

  return (
    <Pressable
      accessibilityLabel={p.title}
      onPress={onPress}
      style={[
        s.card,
        { backgroundColor: c.surface, borderColor: c.border },
        isCompact && s.compact,
        shadows.card,
      ]}
    >
      {/* Media */}
      <View style={[s.mediaWrap, { height: imgHeight, backgroundColor: c.surface3 }, isCompact && s.compactMedia]}>
        {uri
          ? <RemoteImage uri={uri} style={StyleSheet.absoluteFill} accessibilityLabel={p.title} />
          : (
            <View style={s.noMediaWrap}>
              <Ionicons name="home-outline" size={28} color={c.subtle} />
              <Text style={[s.noMediaText, { color: c.subtle }]}>No media</Text>
            </View>
          )
        }
        {/* Gradient overlay */}
        <View style={s.gradient} pointerEvents="none" />

        {/* Verified badge */}
        {p.verificationStatus === "VERIFIED" && (
          <View style={[s.verifiedBadge, { backgroundColor: "rgba(255,255,255,.92)" }]}>
            <Ionicons name="checkmark-circle" size={11} color="#065f46" />
            <Text style={s.verifiedText}>Verified</Text>
          </View>
        )}

        {/* Save button */}
        {onSave && (
          <Pressable
            accessibilityLabel={saved ? "Remove saved" : "Save property"}
            onPress={onSave}
            style={[s.saveBtn, { backgroundColor: "rgba(255,255,255,.92)" }]}
          >
            <Ionicons name={saved ? "heart" : "heart-outline"} size={16} color={saved ? "#0E9F6E" : "#5B6B66"} />
          </Pressable>
        )}

        {/* Type badge */}
        {p.propertyType && (
          <View style={s.typeBadge}>
            <Text style={s.typeBadgeText}>{p.propertyType}</Text>
          </View>
        )}
      </View>

      {/* Body */}
      <View style={[s.body, isCompact && s.compactBody]}>
        {/* Location */}
        <View style={s.locationRow}>
          <Ionicons name="location-outline" size={11} color={c.primary} />
          <Text style={[s.locationText, { color: c.primary }]} numberOfLines={1}>
            {p.district || "Rwanda"}
          </Text>
        </View>

        {/* Title */}
        <Text numberOfLines={isCompact ? 1 : 2} style={[s.title, { color: c.text }, isLarge && s.titleLarge]}>
          {p.title}
        </Text>

        {/* Price */}
        <Text style={[s.price, { color: c.text }]}>
          {money(l.priceMinor)}
          {l.listingType === "RENT" && <Text style={[s.priceSuffix, { color: c.muted }]}>/mo</Text>}
          {l.listingType === "SHORT_STAY" && <Text style={[s.priceSuffix, { color: c.muted }]}>/night</Text>}
        </Text>

        {/* Specs */}
        {!isCompact && (
          <View style={[s.specsRow, { borderTopColor: c.border }]}>
            {p.bedrooms != null && (
              <View style={s.specItem}>
                <Ionicons name="bed-outline" size={12} color={c.muted} />
                <Text style={[s.specText, { color: c.muted }]}>{p.bedrooms} bd</Text>
              </View>
            )}
            {p.bathrooms != null && (
              <View style={s.specItem}>
                <Ionicons name="water-outline" size={12} color={c.muted} />
                <Text style={[s.specText, { color: c.muted }]}>{p.bathrooms} ba</Text>
              </View>
            )}
            {p.areaValue != null && (
              <View style={s.specItem}>
                <Ionicons name="expand-outline" size={12} color={c.muted} />
                <Text style={[s.specText, { color: c.muted }]}>{p.areaValue} {p.areaUnit ?? ""}</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: spacing.md,
  },
  compact: {
    flexDirection: "row",
  },
  mediaWrap: {
    position: "relative",
    overflow: "hidden",
  },
  compactMedia: {
    width: 120,
    height: 100,
  },
  gradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    // React Native doesn't support CSS gradients natively; use a semi-transparent overlay
    backgroundColor: "rgba(11,18,16,.18)",
  },
  noMediaWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  noMediaText: {
    fontSize: 11,
    fontWeight: "700",
  },
  verifiedBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#065f46",
  },
  saveBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  typeBadge: {
    position: "absolute",
    bottom: 10,
    left: 10,
    backgroundColor: "rgba(0,0,0,.55)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#fff",
  },
  body: {
    padding: 14,
    flex: 1,
  },
  compactBody: {
    padding: 12,
    justifyContent: "center",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 5,
  },
  locationText: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 21,
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  titleLarge: {
    fontSize: 19,
    lineHeight: 26,
  },
  price: {
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  priceSuffix: {
    fontSize: 13,
    fontWeight: "600",
  },
  specsRow: {
    flexDirection: "row",
    gap: 12,
    borderTopWidth: 1,
    paddingTop: 10,
    flexWrap: "wrap",
  },
  specItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  specText: {
    fontSize: 11,
    fontWeight: "700",
  },
});
