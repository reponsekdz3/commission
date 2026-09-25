import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { createListingSchema } from "@imizi/validation";
import { Public } from "../../common/public.decorator";
import { CurrentUser } from "../../common/current-user.decorator";
import { PlatformStore, UserRecord } from "../../store/platform.store";
import { assertPropertyAccess } from "../../common/access";

@ApiTags("listings")
@Controller()
export class ListingsController {
  constructor(private readonly store: PlatformStore) {}

  @ApiBearerAuth()
  @Post("listings")
  create(@CurrentUser() user: UserRecord, @Body() body: unknown) {
    const data = createListingSchema.parse(body);
    const property = this.store.properties.get(data.propertyId);
    if (!property) return { error: "not_found" };
    assertPropertyAccess(user, property, true);
    const listing = {
      id: this.store.id(),
      propertyId: data.propertyId,
      unitId: data.unitId,
      listingType: data.listingType,
      status: "ACTIVE",
      priceMinor: data.priceMinor,
      currency: data.currency,
      availableFrom: data.availableFrom ?? this.store.now(),
      createdAt: this.store.now(),
      updatedAt: this.store.now(),
    };
    this.store.listings.set(listing.id, listing);
    this.store.enqueue("search.index", { listingId: listing.id });
    return listing;
  }

  @Public()
  @Get("listings/:id")
  get(@Param("id") id: string) {
    const listing = this.store.listings.get(id);
    if (!listing) return { error: "not_found" };
    const property = this.store.properties.get(listing.propertyId);
    return { listing, property };
  }

  @Public()
  @Get("units/:id")
  unit(@Param("id") id: string) {
    return this.store.units.get(id) ?? { error: "not_found" };
  }
}
