import type { RiskLevel } from "@imizi/types";

export interface FraudSignals {
  listingsLast24h: number;
  duplicatePhotoHits: number;
  priceVsMedianRatio: number;
  reportCount: number;
  accountsFromSameDeviceLastHour: number;
  paymentAnomalyScore: number;
  fakeContactScore: number;
  duplicatePropertyScore: number;
  locationMismatchScore: number;
}

export function scoreFraud(signals: FraudSignals): { score: number; level: RiskLevel } {
  const score = Math.min(
    100,
    signals.listingsLast24h * 8 +
      signals.duplicatePhotoHits * 15 +
      (signals.priceVsMedianRatio > 0 && signals.priceVsMedianRatio < 0.4 ? 20 : 0) +
      signals.reportCount * 10 +
      signals.accountsFromSameDeviceLastHour * 12 +
      signals.paymentAnomalyScore * 20 +
      signals.fakeContactScore * 15 +
      signals.duplicatePropertyScore * 18 +
      signals.locationMismatchScore * 12,
  );

  let level: RiskLevel = "LOW";
  if (score >= 80) level = "BLOCKED";
  else if (score >= 55) level = "HIGH";
  else if (score >= 30) level = "MEDIUM";
  return { score, level };
}

export function shouldQueueForModeration(level: RiskLevel): boolean {
  return level === "HIGH" || level === "BLOCKED";
}
