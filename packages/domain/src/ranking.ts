import type { RankingWeights } from "@imizi/types";
import { DEFAULT_RANKING_WEIGHTS } from "@imizi/types";

export interface RankingSignals {
  textRelevance: number;
  locationRelevance: number;
  filterMatch: number;
  availability: number;
  verified: number;
  listingQuality: number;
  freshness: number;
}

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

export function rankListing(
  signals: RankingSignals,
  weights: RankingWeights = DEFAULT_RANKING_WEIGHTS,
): number {
  const wSum =
    weights.textRelevance +
    weights.location +
    weights.filterMatch +
    weights.availability +
    weights.verified +
    weights.listingQuality +
    weights.freshness;
  const n = wSum === 0 ? 1 : wSum;
  return (
    (clamp01(signals.textRelevance) * weights.textRelevance +
      clamp01(signals.locationRelevance) * weights.location +
      clamp01(signals.filterMatch) * weights.filterMatch +
      clamp01(signals.availability) * weights.availability +
      clamp01(signals.verified) * weights.verified +
      clamp01(signals.listingQuality) * weights.listingQuality +
      clamp01(signals.freshness) * weights.freshness) /
    n
  );
}

export function freshnessFromUpdatedAt(updatedAt: Date, now = new Date()): number {
  const days = (now.getTime() - updatedAt.getTime()) / 86_400_000;
  if (days <= 1) return 1;
  if (days <= 7) return 0.8;
  if (days <= 30) return 0.5;
  if (days <= 90) return 0.25;
  return 0.05;
}

export function listingQualityScore(input: {
  photoCount: number;
  hasDescription: boolean;
  hasVideo: boolean;
  amenityCount: number;
}): number {
  const photos = Math.min(input.photoCount / 12, 1) * 0.45;
  const description = input.hasDescription ? 0.2 : 0;
  const video = input.hasVideo ? 0.15 : 0;
  const amenities = Math.min(input.amenityCount / 8, 1) * 0.2;
  return photos + description + video + amenities;
}
