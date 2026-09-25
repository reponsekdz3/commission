import { describe, expect, it } from "vitest";
import { parseNaturalSearch, calculatePrice, rwf, transitionBooking } from "@imizi/domain";
import { SearchService } from "./modules/search/search.service";
import { PlatformStore } from "./store/platform.store";
import { BookingsService } from "./modules/bookings/bookings.service";

describe("api domain wiring", () => {
  it("seeds marketplace inventory", () => {
    const store = new PlatformStore();
    expect(store.properties.size).toBeGreaterThan(3);
    expect(store.listings.size).toBeGreaterThan(4);
    expect(store.users.size).toBeGreaterThan(3);
  });

  it("ranks and filters Kigali 3-bed rentals", async () => {
    const store = new PlatformStore();
    const search = new SearchService(store);
    const parsed = parseNaturalSearch("house near Kigali with 3 bedrooms under 1 million");
    const result = await search.search({
      q: parsed.raw,
      listingType: "RENT",
      bedroomsMin: 3,
      maxPriceMinor: 1_000_000,
    });
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.items[0].listing.listingType).toBe("RENT");
  });

  it("blocks overlapping bookings then confirms payment server-side", async () => {
    const store = new PlatformStore();
    const bookings = new BookingsService(store);
    const listing = [...store.listings.values()].find((l) => l.listingType === "RENT")!;
    const tenant = [...store.users.values()].find((u) => u.roles.includes("TENANT"))!;
    const first = await bookings.create(tenant, {
      listingId: listing.id,
      startDate: "2030-10-01",
      endDate: "2030-11-01",
      idempotencyKey: "idem-1-xxxxx",
    });
    expect((first as any).booking.status).toBe("PAYMENT_PENDING");
    expect(() => bookings.create(tenant, {
        listingId: listing.id,
        startDate: "2030-10-15",
        endDate: "2030-10-20",
        idempotencyKey: "idem-2-xxxxx",
      }),
    ).toThrow();
    const confirmed = await bookings.confirmFromPayment((first as any).booking.id);
    expect(confirmed?.status).toBe("CONFIRMED");
    expect(transitionBooking("CONFIRMED", "ACTIVE")).toBe("ACTIVE");
    expect(calculatePrice({ base: rwf(900000), deposit: rwf(900000), serviceFeeBps: 250 }).serviceFee.amountMinor).toBe(22500);
  });
});
