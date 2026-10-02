import { describe, expect, it } from "vitest";
import { calculatePrice, parseNaturalSearch, transitionBooking, datesOverlap, rwf } from "@imizi/domain";

describe("api domain contracts", () => {
  it("parses Rwanda-style natural property searches", () => {
    const parsed = parseNaturalSearch("house near Kigali with 3 bedrooms under 1 million");
    expect(parsed.listingType).toBeUndefined();
    expect(parseNaturalSearch("gukodesha inzu 3 bedrooms under 1 million").listingType).toBe("RENT");
    expect(parsed.bedrooms).toBe(3);
    expect(parsed.maxPrice).toBe(1_000_000);
  });

  it("calculates booking totals deterministically", () => {
    const quote = calculatePrice({base:rwf(900_000),deposit:rwf(900_000),serviceFeeBps:250});
    expect(quote.serviceFee.amountMinor).toBe(22_500);
    expect(quote.total.amountMinor).toBeGreaterThan(900_000);
  });

  it("enforces booking lifecycle transitions and overlap rules", () => {
    expect(transitionBooking("PENDING","PAYMENT_PENDING")).toBe("PAYMENT_PENDING");
    expect(transitionBooking("PAYMENT_PENDING","CONFIRMED")).toBe("CONFIRMED");
    expect(transitionBooking("CONFIRMED","ACTIVE")).toBe("ACTIVE");
    expect(datesOverlap(new Date("2030-10-01"),new Date("2030-11-01"),new Date("2030-10-15"),new Date("2030-10-20"))).toBe(true);
    expect(datesOverlap(new Date("2030-10-01"),new Date("2030-11-01"),new Date("2030-11-01"),new Date("2030-12-01"))).toBe(false);
  });
});
