import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { createPropertySchema } from "@imizi/validation";
import { Public } from "../../common/public.decorator";
import { CurrentUser } from "../../common/current-user.decorator";
import { PropertiesService } from "./properties.service";
import { PlatformStore, UserRecord } from "../../store/platform.store";

@ApiTags("properties")
@Controller("properties")
export class PropertiesController {
  constructor(
    private readonly properties: PropertiesService,
    private readonly store: PlatformStore,
  ) {}

  @ApiBearerAuth()
  @Get("owned")
  owned(@CurrentUser() user: UserRecord) {
    return [...this.store.properties.values()]
      .filter((p) => p.ownerId === user.id || p.organizationId === user.organizationId)
      .map((p) => this.properties.hydrate(p));
  }

  @ApiBearerAuth()
  @Post()
  create(@CurrentUser() user: UserRecord, @Body() body: unknown) {
    return this.properties.create(user, createPropertySchema.parse(body));
  }

  @Public()
  @Get(":id")
  get(@Param("id") id: string, @CurrentUser() user?: UserRecord) {
    return this.properties.get(id, user);
  }

  @ApiBearerAuth()
  @Patch(":id")
  update(@Param("id") id: string, @CurrentUser() user: UserRecord, @Body() body: Record<string, unknown>) {
    return this.properties.update(id, user, body);
  }

  @ApiBearerAuth()
  @Post(":id/publish")
  publish(@Param("id") id: string, @CurrentUser() user: UserRecord) {
    return this.properties.publish(id, user);
  }

  @ApiBearerAuth()
  @Post(":id/units")
  addUnit(@Param("id") id: string, @CurrentUser() user: UserRecord, @Body() body: { label: string; bedrooms?: number }) {
    const property = this.properties.update(id, user, {});
    const unit = {
      id: this.store.id(),
      propertyId: id,
      label: body.label,
      bedrooms: body.bedrooms,
      bathrooms: 1,
      parking: 0,
      status: "AVAILABLE",
    };
    this.store.units.set(unit.id, unit);
    return { ...property, units: this.store.unitsForProperty(id) };
  }
}
