import { describe, expect, it } from "vitest";
import {
  calculateCommission,
  calculatePrice,
  datesOverlap,
  hasPermission,
  matchesSavedSearch,
  parseNaturalSearch,
  paymentIsAuthoritative,
  rankListing,
  rentCollectionEntries,
  assertBalanced,
  rwf,
  scoreFraud,
  transitionBooking,
  transitionOffer,
  transitionPayment,
  transitionVerification,
} from "./index";

describe("booking state machine", () => {
  it("follows the rental lifecycle", () => {
    expect(transitionBooking("PENDING", "PAYMENT_PENDING")).toBe("PAYMENT_PENDING");
    expect(transitionBooking("PAYMENT_PENDING", "CONFIRMED")).toBe("CONFIRMED");
    expect(transitionBooking("CONFIRMED", "ACTIVE")).toBe("ACTIVE");
    expect(transitionBooking("ACTIVE", "COMPLETED")).toBe("COMPLETED");
  });

  it("rejects illegal transitions", () => {
    expect(() => transitionBooking("COMPLETED", "PENDING")).toThrow();
  });

  it("detects overlapping stays", () => {
    expect(
      datesOverlap(
        new Date("2026-10-01"),
        new Date("2026-11-01"),
        new Date("2026-10-15"),
        new Date("2026-10-20"),
      ),
    ).toBe(true);
    expect(
      datesOverlap(
        new Date("2026-10-01"),
        new Date("2026-11-01"),
        new Date("2026-11-01"),
        new Date("2026-12-01"),
      ),
    ).toBe(false);
  });
});

describe("payments", () => {
  it("never trusts the client success flag", () => {
    expect(paymentIsAuthoritative(true, "PENDING_PROVIDER")).toBe(false);
    expect(paymentIsAuthoritative(false, "SUCCEEDED")).toBe(true);
  });

  it("allows refund after success", () => {
    expect(transitionPayment("SUCCEEDED", "REFUNDED")).toBe("REFUNDED");
  });
});

describe("pricing and ledger", () => {
  it("computes rent + deposit + fees in integer francs", () => {
    const result = calculatePrice({
      base: rwf(900_000),
      deposit: rwf(900_000),
      serviceFeeBps: 250,
      taxBps: 0,
    });
    expect(result.serviceFee.amountMinor).toBe(22_500);
    expect(result.total.amountMinor).toBe(1_822_500);
  });

  it("splits commission without floating point", () => {
    const split = calculateCommission(rwf(900_000), 500);
    expect(split.platform.amountMinor).toBe(45_000);
    expect(split.landlord.amountMinor).toBe(855_000);
  });

  it("posts a balanced rent collection journal", () => {
    const entries = rentCollectionEntries({
      amount: rwf(900_000),
      commission: rwf(45_000),
      reference: "PAY-1",
    });
    expect(() => assertBalanced(entries)).not.toThrow();
  });
});

describe("search parser and ranking", () => {
  it("parses a Kinyarwanda/English hybrid query", () => {
    const parsed = parseNaturalSearch("house near Kigali with 3 bedrooms under 1 million");
    expect(parsed.type).toBe("HOUSE");
    expect(parsed.bedrooms).toBe(3);
    expect(parsed.maxPrice).toBe(1_000_000);
    expect(parsed.locationText?.toLowerCase()).toContain("kigali");
  });

  it("ranks verified nearby listings above stale ones", () => {
    const hot = rankListing({
      textRelevance: 0.8,
      locationRelevance: 0.9,
      filterMatch: 1,
      availability: 1,
      verified: 1,
      listingQuality: 0.8,
      freshness: 1,
    });
    const cold = rankListing({
      textRelevance: 0.8,
      locationRelevance: 0.2,
      filterMatch: 0.4,
      availability: 0,
      verified: 0,
      listingQuality: 0.2,
      freshness: 0.05,
    });
    expect(hot).toBeGreaterThan(cold);
  });
});

describe("rbac, fraud, offers, verification", () => {
  it("does not treat isAdmin as a boolean flag", () => {
    expect(hasPermission(["USER"], "payment:refund")).toBe(false);
    expect(hasPermission(["FINANCE_ADMIN"], "payment:refund")).toBe(true);
  });

  it("queues high-risk listings", () => {
    const { level } = scoreFraud({
      listingsLast24h: 12,
      duplicatePhotoHits: 3,
      priceVsMedianRatio: 0.2,
      reportCount: 2,
      accountsFromSameDeviceLastHour: 4,
      paymentAnomalyScore: 0.8,
      fakeContactScore: 0.5,
      duplicatePropertyScore: 0.7,
      locationMismatchScore: 0.4,
    });
    expect(["HIGH", "BLOCKED"]).toContain(level);
  });

  it("supports offer counters and verification review", () => {
    expect(transitionOffer("SELLER_REVIEWING", "COUNTERED")).toBe("COUNTERED");
    expect(transitionVerification("UNDER_REVIEW", "VERIFIED")).toBe("VERIFIED");
  });

  it("matches saved searches for alerts", () => {
    expect(
      matchesSavedSearch(
        {
          listingType: "RENT",
          district: "Kicukiro",
          bedroomsMin: 2,
          bedroomsMax: 3,
          maxPriceMinor: 900_000,
          amenities: ["parking"],
        },
        {
          listingType: "RENT",
          propertyType: "HOUSE",
          district: "Kicukiro",
          bedrooms: 3,
          priceMinor: 850_000,
          amenities: ["parking", "water"],
        },
      ),
    ).toBe(true);
  });
});
