import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../common/current-user.decorator";
import { PlatformStore, UserRecord } from "../../store/platform.store";

@ApiTags("maintenance")
@ApiBearerAuth()
@Controller("maintenance")
export class MaintenanceController {
  constructor(private readonly store: PlatformStore) {}

  @Post()
  create(
    @CurrentUser() user: UserRecord,
    @Body() body: { propertyId: string; title: string; description: string },
  ) {
    const item = { id: this.store.id(), tenantId: user.id, status: "OPEN", ...body };
    this.store.maintenance.push(item);
    const property = this.store.properties.get(body.propertyId);
    if (property) this.store.notify(property.ownerId, "MAINTENANCE_OPEN", "Maintenance request", body.title);
    return item;
  }

  @Get()
  list(@CurrentUser() user: UserRecord) {
    return this.store.maintenance.filter(
      (m) => m.tenantId === user.id || this.store.properties.get(m.propertyId)?.ownerId === user.id,
    );
  }

  @Patch(":id")
  update(@CurrentUser() user: UserRecord, @Param("id") id: string, @Body() body: { status: string }) {
    const item = this.store.maintenance.find((m) => m.id === id);
    if (!item) return { error: "not_found" };
    const property = this.store.properties.get(item.propertyId);
    if (property?.ownerId !== user.id && !user.roles.includes("PROPERTY_MANAGER")) return { error: "forbidden" };
    item.status = body.status;
    return item;
  }
}
