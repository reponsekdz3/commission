import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../common/current-user.decorator";
import { PlatformStore, UserRecord } from "../../store/platform.store";

@ApiTags("viewings")
@ApiBearerAuth()
@Controller("viewings")
export class ViewingsController {
  constructor(private readonly store: PlatformStore) {}

  @Get("slots/:listingId")
  slots(@Param("listingId") listingId: string) {
    const hours = [9, 10, 11, 14, 16];
    const taken = new Set(
      this.store.viewings.filter((v) => v.listingId === listingId && v.status !== "DECLINED").map((v) => v.slotStart),
    );
    const day = new Date();
    day.setDate(day.getDate() + ((6 - day.getDay() + 7) % 7 || 7));
    return hours.map((h) => {
      const slot = new Date(day);
      slot.setHours(h, 0, 0, 0);
      return { slotStart: slot.toISOString(), available: !taken.has(slot.toISOString()) };
    });
  }

  @Post()
  request(@CurrentUser() user: UserRecord, @Body() body: { listingId: string; slotStart: string }) {
    const viewing = { id: this.store.id(), requesterId: user.id, status: "REQUESTED", ...body };
    this.store.viewings.push(viewing);
    this.store.analytics.push({ name: "viewing_requested", userId: user.id, payload: viewing, at: this.store.now() });
    return viewing;
  }

  @Post(":id/decide")
  decide(@CurrentUser() user: UserRecord, @Param("id") id: string, @Body() body: { accept: boolean }) {
    const viewing = this.store.viewings.find((v) => v.id === id);
    if (!viewing) return { error: "not_found" };
    viewing.status = body.accept ? "CONFIRMED" : "DECLINED";
    this.store.notify(viewing.requesterId, "VIEWING_REMINDER", "Viewing update", viewing.status);
    void user;
    return viewing;
  }
}
