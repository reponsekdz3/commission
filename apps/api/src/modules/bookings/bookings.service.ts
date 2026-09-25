import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import {
  calculateCommission,
  calculatePrice,
  datesOverlap,
  isHoldStatus,
  rwf,
  transitionBooking,
} from "@imizi/domain";
import { loadConfig } from "@imizi/config";
import { PlatformStore, UserRecord } from "../../store/platform.store";

@Injectable()
export class BookingsService {
  constructor(private readonly store: PlatformStore) {}

  quote(listingId: string, startDate: string, endDate: string) {
    const listing = this.store.listings.get(listingId);
    if (!listing) throw new NotFoundException();
    const start = new Date(startDate);
    const end = new Date(endDate);
    const nights = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000));
    const isSale = listing.listingType === "SALE";
    return calculatePrice({
      base: { amountMinor: listing.priceMinor, currency: listing.currency as "RWF" },
      deposit: isSale ? rwf(0) : { amountMinor: listing.priceMinor, currency: listing.currency as "RWF" },
      serviceFeeBps: 250,
      nights: listing.listingType === "SHORT_STAY" ? nights : 1,
    });
  }

  create(user: UserRecord, input: { listingId: string; unitId?: string; startDate: string; endDate: string; guests?: number; idempotencyKey: string }) {
    const existing = [...this.store.bookings.values()].find((b) => b.idempotencyKey === input.idempotencyKey);
    if (existing) return existing;
    const listing = this.store.listings.get(input.listingId);
    if (!listing) throw new NotFoundException("Listing not found");
    const start = new Date(input.startDate);
    const end = new Date(input.endDate);
    if (!(end > start)) throw new BadRequestException("Invalid date range");
    for (const booking of this.store.bookings.values()) {
      if (!isHoldStatus(booking.status as any)) continue;
      const sameUnit = Boolean(input.unitId) && booking.unitId === input.unitId;
      const sameListing = !input.unitId && booking.listingId === listing.id;
      if (!sameUnit && !sameListing) continue;
      if (datesOverlap(start, end, new Date(booking.startDate), new Date(booking.endDate))) {
        throw new BadRequestException("Dates overlap an existing reservation");
      }
    }
    const quote = this.quote(listing.id, input.startDate, input.endDate);
    const booking = {
      id: this.store.id(),
      listingId: listing.id,
      unitId: input.unitId,
      tenantId: user.id,
      status: "PENDING",
      startDate: input.startDate,
      endDate: input.endDate,
      amountMinor: quote.total.amountMinor,
      depositMinor: quote.deposit.amountMinor,
      currency: listing.currency,
      idempotencyKey: input.idempotencyKey,
      createdAt: this.store.now(),
    };
    booking.status = transitionBooking("PENDING", "PAYMENT_PENDING");
    this.store.bookings.set(booking.id, booking);
    this.store.analytics.push({ name: "booking_started", userId: user.id, payload: { bookingId: booking.id }, at: this.store.now() });
    return { booking, quote };
  }

  confirmFromPayment(bookingId: string) {
    const booking = this.store.bookings.get(bookingId);
    if (!booking) throw new NotFoundException();
    booking.status = transitionBooking(booking.status as any, "CONFIRMED");
    const listing = this.store.listings.get(booking.listingId)!;
    const property = this.store.properties.get(listing.propertyId)!;
    const commission = calculateCommission(
      { amountMinor: booking.amountMinor, currency: booking.currency as "RWF" },
      loadConfig().commissionBps,
    );
    this.store.ledger.push(
      { account: "TENANT", direction: "DEBIT", amountMinor: booking.amountMinor, currency: booking.currency, reference: booking.id },
      { account: "PLATFORM_HOLDING", direction: "CREDIT", amountMinor: booking.amountMinor, currency: booking.currency, reference: booking.id },
      { account: "LANDLORD", direction: "CREDIT", amountMinor: commission.landlord.amountMinor, currency: booking.currency, reference: booking.id },
      { account: "PLATFORM_REVENUE", direction: "CREDIT", amountMinor: commission.platform.amountMinor, currency: booking.currency, reference: booking.id },
    );
    this.store.leases.push({
      id: this.store.id(),
      bookingId: booking.id,
      terms: {
        tenantId: booking.tenantId,
        landlordId: property.ownerId,
        propertyId: property.id,
        rent: booking.amountMinor,
        deposit: booking.depositMinor,
        startDate: booking.startDate,
        endDate: booking.endDate,
        disclaimer: "Template only — have a qualified Rwandan lawyer review before production use.",
      },
      pdf: `lease://${booking.id}.pdf`,
    });
    this.store.notify(booking.tenantId, "BOOKING_CONFIRMED", "Booking confirmed", `Your stay at ${property.title} is confirmed.`);
    this.store.notify(property.ownerId, "PAYMENT_RECEIVED", "Payment received", `Booking ${booking.id} is paid.`);
    this.store.enqueue("receipt.generate", { bookingId: booking.id });
    return booking;
  }
}
