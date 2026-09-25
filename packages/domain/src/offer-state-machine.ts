import type { OfferStatus } from "@imizi/types";

const TRANSITIONS: Record<OfferStatus, OfferStatus[]> = {
  OFFER_PENDING: ["SELLER_REVIEWING", "WITHDRAWN", "EXPIRED"],
  SELLER_REVIEWING: ["ACCEPTED", "REJECTED", "COUNTERED", "EXPIRED"],
  COUNTERED: ["SELLER_REVIEWING", "ACCEPTED", "REJECTED", "WITHDRAWN", "EXPIRED"],
  ACCEPTED: [],
  REJECTED: [],
  WITHDRAWN: [],
  EXPIRED: [],
};

export function transitionOffer(from: OfferStatus, to: OfferStatus): OfferStatus {
  if (!TRANSITIONS[from].includes(to)) {
    throw new Error(`Illegal offer transition ${from} → ${to}`);
  }
  return to;
}
