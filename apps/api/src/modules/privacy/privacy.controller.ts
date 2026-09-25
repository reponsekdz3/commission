import { Controller, Get, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../common/current-user.decorator";
import { PlatformStore, UserRecord } from "../../store/platform.store";
import { AuthService } from "../auth/auth.service";

@ApiTags("privacy")
@ApiBearerAuth()
@Controller("privacy")
export class PrivacyController {
  constructor(
    private readonly store: PlatformStore,
    private readonly auth: AuthService,
  ) {}

  @Get("export")
  export(@CurrentUser() user: UserRecord) {
    return {
      user: this.auth.publicUser(user),
      bookings: [...this.store.bookings.values()].filter((b) => b.tenantId === user.id),
      favorites: [...(this.store.favorites.get(user.id) ?? [])],
      consents: this.store.consents.filter((c) => c.userId === user.id),
      messages: this.store.messages.filter((m) => m.senderId === user.id),
    };
  }

  @Post("delete")
  delete(@CurrentUser() user: UserRecord) {
    user.status = "PENDING_DELETION";
    user.email = `deleted-${user.id}@imizi.invalid`;
    user.phone = `deleted-${user.id}`;
    this.store.auditLog({ actorId: user.id, action: "ACCOUNT_DELETE_REQUESTED", subjectType: "user", subjectId: user.id });
    return { status: "scheduled" };
  }
}
