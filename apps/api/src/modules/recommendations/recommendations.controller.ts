import { Controller, Get } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { buildProfileFromEvents, recommend } from "@imizi/domain";
import { CurrentUser } from "../../common/current-user.decorator";
import { PlatformStore, UserRecord } from "../../store/platform.store";
import { Public } from "../../common/public.decorator";

@ApiTags("recommendations")
@Controller("recommendations")
export class RecommendationsController {
  constructor(private readonly store: PlatformStore) {}

  @Public()
  @Get()
  list(@CurrentUser() user?: UserRecord) {
    const events = this.store.views
      .filter((v) => !user || v.userId === user.id)
      .map((v) => {
        const p = this.store.properties.get(v.propertyId);
        return {
          kind: "view" as const,
          district: p?.district,
          propertyType: p?.propertyType,
          bedrooms: p?.bedrooms,
          priceMinor: this.store.listingsForProperty(v.propertyId)[0]?.priceMinor,
          amenities: p?.amenities,
        };
      });
    const profile = buildProfileFromEvents(events);
    const listings = [...this.store.listings.values()]
      .filter((l) => this.store.properties.get(l.propertyId)?.status === "PUBLISHED")
      .map((l) => {
        const p = this.store.properties.get(l.propertyId)!;
        return {
          id: l.id,
          district: p.district,
          propertyType: p.propertyType,
          bedrooms: p.bedrooms,
          priceMinor: l.priceMinor,
          amenities: p.amenities,
          property: p,
          listing: l,
        };
      });
    return recommend(profile, listings, 8);
  }
}
