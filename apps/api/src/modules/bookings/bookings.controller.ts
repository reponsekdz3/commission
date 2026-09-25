import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { createBookingSchema } from "@imizi/validation";
import { CurrentUser } from "../../common/current-user.decorator";
import { Public } from "../../common/public.decorator";
import { BookingsService } from "./bookings.service";
import { PlatformStore, UserRecord } from "../../store/platform.store";
import { transitionBooking } from "@imizi/domain";

@ApiTags("bookings")
@Controller("bookings")
export class BookingsController {
  constructor(
    private readonly bookings: BookingsService,
    private readonly store: PlatformStore,
  ) {}

  @ApiBearerAuth()
  @Get()
  mine(@CurrentUser() user: UserRecord) {
    const ownedListingIds = new Set(
      [...this.store.listings.values()]
        .filter((l) => this.store.properties.get(l.propertyId)?.ownerId === user.id)
        .map((l) => l.id),
    );
    return [...this.store.bookings.values()].filter(
      (b) => b.tenantId === user.id || ownedListingIds.has(b.listingId) || user.roles.includes("SUPER_ADMIN"),
    );
  }

  @Public()
  @Post("quote")
  quote(@Body() body: { listingId: string; startDate: string; endDate: string }) {
    return this.bookings.quote(body.listingId, body.startDate, body.endDate);
  }

  @ApiBearerAuth()
  @Post()
  create(@CurrentUser() user: UserRecord, @Body() body: unknown) {
    return this.bookings.create(user, createBookingSchema.parse(body));
  }

  @ApiBearerAuth()
  @Get(":id")
  get(@CurrentUser() user: UserRecord, @Param("id") id: string) {
    const booking = this.store.bookings.get(id);
    if (!booking) return { error: "not_found" };
    if (booking.tenantId !== user.id && !user.roles.includes("SUPER_ADMIN")) {
      const listing = this.store.listings.get(booking.listingId);
      const property = listing ? this.store.properties.get(listing.propertyId) : undefined;
      if (property?.ownerId !== user.id) return { error: "forbidden" };
    }
    return booking;
  }

  @ApiBearerAuth()
  @Post(":id/cancel")
  cancel(@CurrentUser() user: UserRecord, @Param("id") id: string) {
    const booking = this.store.bookings.get(id);
    if (!booking) return { error: "not_found" };
    if (booking.tenantId !== user.id) return { error: "forbidden" };
    booking.status = transitionBooking(booking.status as any, "CANCELLED");
    this.store.analytics.push({ name: "booking_cancelled", userId: user.id, payload: { id }, at: this.store.now() });
    return booking;
  }
}
