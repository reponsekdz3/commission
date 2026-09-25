import { Body, Controller, Get, Patch, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../common/current-user.decorator";
import { PlatformStore, UserRecord } from "../../store/platform.store";

@ApiTags("notifications")
@ApiBearerAuth()
@Controller("notifications")
export class NotificationsController {
  constructor(private readonly store: PlatformStore) {}

  @Get()
  list(@CurrentUser() user: UserRecord) {
    return this.store.notifications.filter((n) => n.userId === user.id);
  }

  @Patch("read-all")
  readAll(@CurrentUser() user: UserRecord) {
    for (const n of this.store.notifications.filter((x) => x.userId === user.id)) n.readAt = this.store.now();
    return { ok: true };
  }

  @Post("saved-searches")
  saveSearch(@CurrentUser() user: UserRecord, @Body() body: { name: string; criteria: Record<string, unknown> }) {
    const saved = { id: this.store.id(), userId: user.id, name: body.name, criteria: body.criteria };
    this.store.savedSearches.push(saved);
    return saved;
  }

  @Get("saved-searches")
  searches(@CurrentUser() user: UserRecord) {
    return this.store.savedSearches.filter((s) => s.userId === user.id);
  }
}
