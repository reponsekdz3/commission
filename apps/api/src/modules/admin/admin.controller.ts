import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../common/current-user.decorator";
import { PlatformStore, UserRecord } from "../../store/platform.store";
import { hasPermission } from "@imizi/domain";

@ApiTags("admin")
@ApiBearerAuth()
@Controller("admin")
export class AdminController {
  constructor(private readonly store: PlatformStore) {}

  private gate(user: UserRecord) {
    return hasPermission(user.roles, "admin:access");
  }

  @Get("overview")
  overview(@CurrentUser() user: UserRecord) {
    if (!this.gate(user)) return { error: "forbidden" };
    const listings = [...this.store.listings.values()];
    const gmv = [...this.store.bookings.values()].reduce((s, b) => s + b.amountMinor, 0);
    const paid = [...this.store.payments.values()].filter((p) => p.status === "SUCCEEDED");
    return {
      users: this.store.users.size,
      properties: this.store.properties.size,
      listings: listings.length,
      agencies: this.store.organizations.size,
      bookings: this.store.bookings.size,
      payments: this.store.payments.size,
      refunds: [...this.store.payments.values()].filter((p) => p.status === "REFUNDED").length,
      reports: this.store.reports.length,
      verificationQueue: this.store.verifications.filter((v) => v.status === "UNDER_REVIEW").length,
      fraud: this.store.fraudCases.length,
      reviews: this.store.reviews.length,
      messages: this.store.messages.length,
      gmv,
      paidVolume: paid.reduce((s, p) => s + p.amountMinor, 0),
      dau: new Set(this.store.analytics.map((e) => e.userId).filter(Boolean)).size,
      mau: this.store.users.size,
      conversion: this.store.bookings.size / Math.max(1, this.store.views.length),
    };
  }

  @Get("users")
  users(@CurrentUser() user: UserRecord) {
    if (!this.gate(user)) return { error: "forbidden" };
    return [...this.store.users.values()].map((u) => ({
      id: u.id,
      email: u.email,
      fullName: u.fullName,
      roles: u.roles,
      status: u.status,
    }));
  }

  @Get("properties")
  properties(@CurrentUser() user: UserRecord) {
    if (!this.gate(user)) return { error: "forbidden" };
    return [...this.store.properties.values()];
  }

  @Get("audit")
  audit(@CurrentUser() user: UserRecord) {
    if (!this.gate(user)) return { error: "forbidden" };
    return this.store.audit;
  }

  @Post("reports")
  report(@CurrentUser() user: UserRecord, @Body() body: { subjectType: string; subjectId: string; reason: string }) {
    const report = { id: this.store.id(), reporterId: user.id, ...body };
    this.store.reports.push(report);
    return report;
  }

  @Get("moderation")
  moderation(@CurrentUser() user: UserRecord) {
    if (!this.gate(user)) return { error: "forbidden" };
    return {
      fraud: this.store.fraudCases,
      reports: this.store.reports,
      verifications: this.store.verifications,
    };
  }

  @Post("properties/:id/risk")
  setRisk(@CurrentUser() user: UserRecord, @Param("id") id: string, @Body() body: { level: string }) {
    if (!this.gate(user)) return { error: "forbidden" };
    const property = this.store.properties.get(id);
    if (!property) return { error: "not_found" };
    const before = property.riskLevel;
    property.riskLevel = body.level as any;
    this.store.auditLog({
      actorId: user.id,
      action: "RISK_UPDATED",
      subjectType: "property",
      subjectId: id,
      before: { riskLevel: before },
      after: { riskLevel: body.level },
    });
    return property;
  }
}
