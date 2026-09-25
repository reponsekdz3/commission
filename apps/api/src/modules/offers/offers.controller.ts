import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { offerSchema } from "@imizi/validation";
import { transitionOffer } from "@imizi/domain";
import { CurrentUser } from "../../common/current-user.decorator";
import { PlatformStore, UserRecord } from "../../store/platform.store";

@ApiTags("offers")
@ApiBearerAuth()
@Controller("offers")
export class OffersController {
  constructor(private readonly store: PlatformStore) {}

  @Post()
  create(@CurrentUser() user: UserRecord, @Body() body: unknown) {
    const data = offerSchema.parse(body);
    const offer = {
      id: this.store.id(),
      listingId: data.listingId,
      buyerId: user.id,
      amountMinor: data.amountMinor,
      currency: data.currency,
      status: transitionOffer("OFFER_PENDING", "SELLER_REVIEWING"),
      message: data.message,
    };
    this.store.offers.push(offer);
    return offer;
  }

  @Post(":id/respond")
  respond(
    @CurrentUser() user: UserRecord,
    @Param("id") id: string,
    @Body() body: { action: "ACCEPT" | "REJECT" | "COUNTER"; amountMinor?: number },
  ) {
    const offer = this.store.offers.find((o) => o.id === id);
    if (!offer) return { error: "not_found" };
    const listing = this.store.listings.get(offer.listingId);
    const property = listing ? this.store.properties.get(listing.propertyId) : undefined;
    if (property?.ownerId !== user.id && offer.buyerId !== user.id) return { error: "forbidden" };
    if (body.action === "COUNTER") {
      offer.status = transitionOffer(offer.status as any, "COUNTERED");
      if (body.amountMinor) offer.amountMinor = body.amountMinor;
    } else {
      offer.status = transitionOffer(offer.status as any, body.action === "ACCEPT" ? "ACCEPTED" : "REJECTED");
    }
    return offer;
  }

  @Get()
  list(@CurrentUser() user: UserRecord) {
    return this.store.offers.filter((o) => o.buyerId === user.id);
  }
}
