import { Controller, Get, Param } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../common/current-user.decorator";
import { PlatformStore, UserRecord } from "../../store/platform.store";

@ApiTags("leases")
@ApiBearerAuth()
@Controller("leases")
export class LeasesController {
  constructor(private readonly store: PlatformStore) {}

  @Get()
  mine(@CurrentUser() user: UserRecord) {
    const bookings = [...this.store.bookings.values()].filter((b) => b.tenantId === user.id);
    return this.store.leases.filter((l) => bookings.some((b) => b.id === l.bookingId));
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.store.leases.find((l) => l.id === id) ?? { error: "not_found" };
  }
}
