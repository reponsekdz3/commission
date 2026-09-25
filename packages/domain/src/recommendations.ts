export interface RecommendationProfile {
  viewedDistricts: string[];
  favoriteTypes: string[];
  bedroomHistogram: Record<number, number>;
  minBudget?: number;
  maxBudget?: number;
  amenityAffinity: string[];
}

export interface RecommendableListing {
  id: string;
  district?: string;
  propertyType: string;
  bedrooms?: number;
  priceMinor: number;
  amenities: string[];
}

export function scoreRecommendation(
  profile: RecommendationProfile,
  listing: RecommendableListing,
): number {
  let score = 0;
  if (listing.district && profile.viewedDistricts.includes(listing.district)) score += 30;
  if (profile.favoriteTypes.includes(listing.propertyType)) score += 20;
  if (listing.bedrooms != null && profile.bedroomHistogram[listing.bedrooms]) {
    score += Math.min(20, profile.bedroomHistogram[listing.bedrooms] * 5);
  }
  if (profile.minBudget != null && profile.maxBudget != null) {
    if (listing.priceMinor >= profile.minBudget && listing.priceMinor <= profile.maxBudget) {
      score += 20;
    }
  }
  const amenityHits = listing.amenities.filter((a) =>
    profile.amenityAffinity.includes(a),
  ).length;
  score += Math.min(10, amenityHits * 3);
  return score;
}

export function recommend(
  profile: RecommendationProfile,
  listings: RecommendableListing[],
  limit = 12,
): RecommendableListing[] {
  return [...listings]
    .map((listing) => ({ listing, score: scoreRecommendation(profile, listing) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.listing);
}

export function buildProfileFromEvents(events: Array<{
  district?: string;
  propertyType?: string;
  bedrooms?: number;
  priceMinor?: number;
  amenities?: string[];
  kind: "view" | "favorite" | "search";
}>): RecommendationProfile {
  const viewedDistricts: string[] = [];
  const favoriteTypes: string[] = [];
  const bedroomHistogram: Record<number, number> = {};
  const amenityAffinity: string[] = [];
  const prices: number[] = [];
  for (const event of events) {
    if (event.district) viewedDistricts.push(event.district);
    if (event.propertyType) favoriteTypes.push(event.propertyType);
    if (event.bedrooms != null) {
      bedroomHistogram[event.bedrooms] = (bedroomHistogram[event.bedrooms] ?? 0) + 1;
    }
    if (event.priceMinor != null) prices.push(event.priceMinor);
    amenityAffinity.push(...(event.amenities ?? []));
  }
  prices.sort((a, b) => a - b);
  return {
    viewedDistricts: [...new Set(viewedDistricts)],
    favoriteTypes: [...new Set(favoriteTypes)],
    bedroomHistogram,
    minBudget: prices.length ? prices[Math.floor(prices.length * 0.2)] : undefined,
    maxBudget: prices.length ? prices[Math.floor(prices.length * 0.8)] : undefined,
    amenityAffinity: [...new Set(amenityAffinity)],
  };
}
