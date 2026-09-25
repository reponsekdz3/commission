import { Body, Controller, Get, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Public } from "../../common/public.decorator";
import { CurrentUser } from "../../common/current-user.decorator";
import { PlatformStore, UserRecord } from "../../store/platform.store";

@ApiTags("analytics")
@Controller("analytics")
export class AnalyticsController {
  constructor(private readonly store: PlatformStore) {}

  @Public()
  @Post("events")
  track(@Body() body: { name: string; propertyId?: string; payload?: Record<string, unknown> }, @CurrentUser() user?: UserRecord) {
    this.store.analytics.push({
      name: body.name,
      userId: user?.id,
      propertyId: body.propertyId,
      payload: body.payload ?? {},
      at: this.store.now(),
    });
    return { ok: true };
  }

  @Public()
  @Get("platform")
  platform() {
    const listings = [...this.store.listings.values()].filter((l) => l.status === "ACTIVE");
    return {
      activeListings: listings.length,
      properties: this.store.properties.size,
      searches: this.store.analytics.filter((e) => e.name === "search_performed").length,
      bookings: this.store.bookings.size,
      gmv: [...this.store.bookings.values()].reduce((s, b) => s + b.amountMinor, 0),
    };
  }

  @ApiBearerAuth()
  @Get("landlord")
  landlord(@CurrentUser() user: UserRecord) {
    const owned = [...this.store.properties.values()].filter((p) => p.ownerId === user.id);
    const ids = new Set(owned.map((p) => p.id));
    const listings = [...this.store.listings.values()].filter((l) => ids.has(l.propertyId));
    const bookings = [...this.store.bookings.values()].filter((b) =>
      listings.some((l) => l.id === b.listingId),
    );
    return {
      properties: owned.length,
      active: owned.filter((p) => p.status === "PUBLISHED").length,
      rented: bookings.filter((b) => b.status === "ACTIVE" || b.status === "CONFIRMED").length,
      forSale: listings.filter((l) => l.listingType === "SALE").length,
      views: this.store.views.filter((v) => ids.has(v.propertyId)).length,
      inquiries: this.store.messages.length,
      bookings: bookings.length,
      revenue: bookings.reduce((s, b) => s + b.amountMinor, 0),
    };
  }
}
