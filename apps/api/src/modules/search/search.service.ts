import { Injectable } from "@nestjs/common";
import {
  clampLimit,
  decodeCursor,
  encodeCursor,
  freshnessFromUpdatedAt,
  listingQualityScore,
  parseNaturalSearch,
  rankListing,
} from "@imizi/domain";
import { haversineMeters } from "@imizi/maps";
import { PlatformStore } from "../../store/platform.store";

@Injectable()
export class SearchService {
  constructor(private readonly store: PlatformStore) {}

  search(query: Record<string, any>) {
    const cacheKey = `search:${JSON.stringify(query)}`;
    const cached = this.store.cacheGet(cacheKey);
    if (cached) return cached;

    const parsed = query.q ? parseNaturalSearch(String(query.q)) : undefined;
    const listingType = query.listingType ?? parsed?.listingType;
    const propertyType = query.propertyType ?? parsed?.type;
    const district = query.district ?? parsed?.locationText;
    const bedroomsMin = query.bedroomsMin ?? parsed?.bedrooms;
    const maxPrice = query.maxPriceMinor ?? parsed?.maxPrice;
    const limit = clampLimit(query.limit ? Number(query.limit) : 20);
    let cursor: { createdAt: string; id: string } | undefined;
    if (query.cursor) cursor = decodeCursor(String(query.cursor));

    const origin =
      query.lat && query.lng ? { latitude: Number(query.lat), longitude: Number(query.lng) } : undefined;
    const bounds =
      query.north && query.south && query.east && query.west
        ? {
            north: Number(query.north),
            south: Number(query.south),
            east: Number(query.east),
            west: Number(query.west),
          }
        : undefined;

    const results = [];
    for (const listing of this.store.listings.values()) {
      const property = this.store.properties.get(listing.propertyId);
      if (!property || property.status !== "PUBLISHED" || listing.status !== "ACTIVE") continue;
      if (listingType && listing.listingType !== listingType) continue;
      if (propertyType && property.propertyType !== propertyType) continue;
      if (district && !`${property.district} ${property.province}`.toLowerCase().includes(String(district).toLowerCase())) continue;
      if (bedroomsMin && (property.bedrooms ?? 0) < Number(bedroomsMin)) continue;
      if (maxPrice && listing.priceMinor > Number(maxPrice)) continue;
      if (query.minPriceMinor && listing.priceMinor < Number(query.minPriceMinor)) continue;
      if (query.verifiedOnly && property.verificationStatus !== "VERIFIED") continue;
      if (query.amenities) {
        const needed = String(query.amenities)
          .split(",")
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean);
        if (needed.some((a) => !property.amenities.map((x) => x.toLowerCase()).includes(a))) continue;
      }
      if (bounds) {
        if (property.latitude > bounds.north || property.latitude < bounds.south) continue;
        if (property.longitude > bounds.east || property.longitude < bounds.west) continue;
      }
      let distanceMeters: number | undefined;
      if (origin) {
        distanceMeters = Math.round(
          haversineMeters(origin, { latitude: property.latitude, longitude: property.longitude }),
        );
        if (query.radiusKm && distanceMeters > Number(query.radiusKm) * 1000) continue;
      }
      if (cursor) {
        if (listing.createdAt > cursor.createdAt) continue;
        if (listing.createdAt === cursor.createdAt && listing.id >= cursor.id) continue;
      }

      const textRelevance = parsed
        ? Number(`${property.title} ${property.description}`.toLowerCase().includes(parsed.raw.toLowerCase().slice(0, 12)))
        : 0.5;
      const locationRelevance = origin ? Math.max(0, 1 - (distanceMeters ?? 0) / 20_000) : district ? 0.8 : 0.4;
      const score = rankListing({
        textRelevance: textRelevance || 0.6,
        locationRelevance,
        filterMatch: 0.9,
        availability: 1,
        verified: property.verificationStatus === "VERIFIED" ? 1 : 0,
        listingQuality: listingQualityScore({
          photoCount: property.media.length,
          hasDescription: property.description.length > 40,
          hasVideo: property.media.some((m) => m.kind === "VIDEO"),
          amenityCount: property.amenities.length,
        }),
        freshness: freshnessFromUpdatedAt(new Date(property.updatedAt)),
      });
      results.push({ listing, property, score, distanceMeters });
    }

    results.sort((a, b) => b.score - a.score);
    const page = results.slice(0, limit);
    const last = page[page.length - 1];
    const payload = {
      items: page,
      nextCursor: last ? encodeCursor({ createdAt: last.listing.createdAt, id: last.listing.id }) : null,
      fallback: this.store.cacheGet("search-engine") ?? "ranked-postgres-with-opensearch-fallback",
    };
    this.store.analytics.push({ name: "search_performed", payload: query, at: this.store.now() });
    this.store.cacheSet(cacheKey, payload, 15_000);
    return payload;
  }

  suggest(q: string) {
    const key = `suggest:${q}`;
    const cached = this.store.cacheGet(key);
    if (cached) return cached;
    const parsed = parseNaturalSearch(q);
    const payload = { parsed, suggestions: ["Kigali", "Kicukiro", "Gasabo", "Musanze", "Rubavu", "Huye"] };
    this.store.cacheSet(key, payload, 300_000);
    return payload;
  }
}
