import { Controller, Delete, Get, Param, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../common/current-user.decorator";
import { PlatformStore, UserRecord } from "../../store/platform.store";

@ApiTags("favorites")
@ApiBearerAuth()
@Controller("favorites")
export class FavoritesController {
  constructor(private readonly store: PlatformStore) {}

  @Get()
  list(@CurrentUser() user: UserRecord) {
    const ids = [...(this.store.favorites.get(user.id) ?? [])];
    return ids.map((id) => this.store.properties.get(id)).filter(Boolean);
  }

  @Post(":propertyId")
  add(@CurrentUser() user: UserRecord, @Param("propertyId") propertyId: string) {
    const set = this.store.favorites.get(user.id) ?? new Set<string>();
    set.add(propertyId);
    this.store.favorites.set(user.id, set);
    this.store.analytics.push({ name: "property_saved", userId: user.id, propertyId, payload: {}, at: this.store.now() });
    return { saved: true };
  }

  @Delete(":propertyId")
  remove(@CurrentUser() user: UserRecord, @Param("propertyId") propertyId: string) {
    this.store.favorites.get(user.id)?.delete(propertyId);
    return { saved: false };
  }

  @Post("searches")
  saveSearch(@CurrentUser() user: UserRecord) {
    return { hint: "use POST /saved-searches" };
  }
}
