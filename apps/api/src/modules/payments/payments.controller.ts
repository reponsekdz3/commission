import { Body, Controller, Headers, Param, Post, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { initiatePaymentSchema } from "@imizi/validation";
import { CurrentUser } from "../../common/current-user.decorator";
import { Public } from "../../common/public.decorator";
import { PaymentsService } from "./payments.service";
import { PlatformStore, UserRecord } from "../../store/platform.store";
import { requiresReauth } from "@imizi/domain";

@ApiTags("payments")
@Controller("payments")
export class PaymentsController {
  constructor(
    private readonly payments: PaymentsService,
    private readonly store: PlatformStore,
  ) {}

  @ApiBearerAuth()
  @Throttle({ payments: { limit: 10, ttl: 60_000 } })
  @Post("intents")
  initiate(@CurrentUser() user: UserRecord, @Body() body: unknown) {
    return this.payments.initiate(user, initiatePaymentSchema.parse(body));
  }

  @Public()
  @Post("webhooks/:provider")
  webhook(
    @Param("provider") provider: string,
    @Headers() headers: Record<string, string>,
    @Req() req: { body: unknown },
  ) {
    const name = provider.toUpperCase() === "MTN" ? "MTN_MOMO" : provider.toUpperCase();
    return this.payments.handleWebhook(name, headers, JSON.stringify(req.body ?? {}));
  }

  @ApiBearerAuth()
  @Post("refunds")
  refund(@CurrentUser() user: UserRecord, @Body() body: { intentId: string; reauthToken?: string }) {
    if (!user.roles.includes("FINANCE_ADMIN") && !user.roles.includes("SUPER_ADMIN")) {
      return { error: "forbidden" };
    }
    if (requiresReauth("payment:refund") && !body.reauthToken) return { requiresReauth: true };
    const intent = this.store.payments.get(body.intentId);
    if (!intent) return { error: "not_found" };
    intent.status = "REFUNDED";
    this.store.auditLog({ actorId: user.id, action: "REFUND", subjectType: "payment", subjectId: intent.id });
    return intent;
  }
}
