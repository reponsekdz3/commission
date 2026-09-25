import { Body, Controller, Get, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Public } from "../../common/public.decorator";
import { CurrentUser } from "../../common/current-user.decorator";
import { CurrentUser } from "../../common/current-user.decorator";
import { PlatformStore, UserRecord } from "../../store/platform.store";

@ApiTags("agencies")
@Controller("agencies")
export class AgenciesController {
  constructor(private readonly store: PlatformStore) {}

  @Public()
  @Get()
  list() {
    return [...this.store.organizations.values()];
  }

  @ApiBearerAuth()
  @Get("dashboard")
  dashboard(@CurrentUser() user: UserRecord) {
    const org = [...this.store.organizations.values()].find((o) => o.members.includes(user.id));
    if (!org) return { error: "not_an_agent" };
    const properties = [...this.store.properties.values()].filter((p) => p.organizationId === org.id);
    return {
      agency: org,
      properties: properties.length,
      agents: org.members.length,
      leads: this.store.messages.length,
      bookings: this.store.bookings.size,
      revenue: [...this.store.bookings.values()].reduce((s, b) => s + b.amountMinor, 0),
    };
  }

  @ApiBearerAuth()
  @Post()
  create(@CurrentUser() user: UserRecord, @Body() body: { name: string; slug: string }) {
    const org = { id: this.store.id(), name: body.name, slug: body.slug, kind: "AGENCY", members: [user.id] };
    this.store.organizations.set(org.id, org);
    user.organizationId = org.id;
    if (!user.roles.includes("AGENCY_ADMIN")) user.roles.push("AGENCY_ADMIN");
    return org;
  }
}
