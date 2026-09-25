import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../common/current-user.decorator";
import { PlatformStore, UserRecord } from "../../store/platform.store";

@ApiTags("reviews")
@Controller("reviews")
export class ReviewsController {
  constructor(private readonly store: PlatformStore) {}

  @ApiBearerAuth()
  @Post()
  create(@CurrentUser() user: UserRecord, @Body() body: { bookingId: string; rating: number; body?: string }) {
    const booking = this.store.bookings.get(body.bookingId);
    if (!booking || booking.tenantId !== user.id) return { error: "forbidden" };
    if (booking.status !== "COMPLETED" && booking.status !== "CONFIRMED" && booking.status !== "ACTIVE") {
      return { error: "review_requires_transaction" };
    }
    const listing = this.store.listings.get(booking.listingId)!;
    const review = {
      id: this.store.id(),
      bookingId: booking.id,
      reviewerId: user.id,
      propertyId: listing.propertyId,
      rating: body.rating,
      body: body.body ?? "",
    };
    this.store.reviews.push(review);
    return review;
  }

  @Get("property/:propertyId")
  list(@Param("propertyId") propertyId: string) {
    return this.store.reviews.filter((r) => r.propertyId === propertyId);
  }
}
