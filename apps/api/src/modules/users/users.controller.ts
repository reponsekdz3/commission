import { Body, Controller, Get, Param, Patch } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../common/current-user.decorator";
import { AuthService } from "../auth/auth.service";
import { PlatformStore, UserRecord } from "../../store/platform.store";
import { requiresReauth } from "@imizi/domain";

@ApiTags("users")
@ApiBearerAuth()
@Controller("users")
export class UsersController {
  constructor(
    private readonly store: PlatformStore,
    private readonly auth: AuthService,
  ) {}

  @Get("me")
  me(@CurrentUser() user: UserRecord) {
    return this.auth.publicUser(user);
  }

  @Patch("me")
  updateMe(
    @CurrentUser() user: UserRecord,
    @Body() body: { fullName?: string; locale?: string; reauthToken?: string; phone?: string; email?: string },
  ) {
    if ((body.phone || body.email) && !body.reauthToken) {
      if (requiresReauth("account:change-phone")) {
        return { requiresReauth: true };
      }
    }
    if (body.fullName) user.fullName = body.fullName;
    if (body.locale) user.locale = body.locale;
    this.store.users.set(user.id, user);
    return this.auth.publicUser(user);
  }

  @Get(":id")
  get(@Param("id") id: string) {
    const user = this.store.users.get(id);
    if (!user) return { error: "not_found" };
    return { id: user.id, fullName: user.fullName, roles: user.roles };
  }
}
