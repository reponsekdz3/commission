import { Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { createPaymentGateway } from "@imizi/payments";
import { paymentIsAuthoritative, transitionPayment } from "@imizi/domain";
import { PlatformStore, UserRecord } from "../../store/platform.store";
import { BookingsService } from "../bookings/bookings.service";

@Injectable()
export class PaymentsService {
  private readonly gateway = createPaymentGateway(process.env as Record<string, string | undefined>);

  constructor(
    private readonly store: PlatformStore,
    private readonly bookings: BookingsService,
  ) {}

  async initiate(user: UserRecord, input: { bookingId?: string; provider: string; msisdn?: string; idempotencyKey: string }) {
    const existing = [...this.store.payments.values()].find((p) => p.idempotencyKey === input.idempotencyKey);
    if (existing) return existing;
    const booking = input.bookingId ? this.store.bookings.get(input.bookingId) : undefined;
    if (!booking) throw new NotFoundException("Booking required");
    const provider = this.gateway.resolve(input.provider);
    const intent = {
      id: this.store.id(),
      bookingId: booking.id,
      payerId: user.id,
      provider: provider.name,
      amountMinor: booking.amountMinor,
      currency: booking.currency,
      status: "CREATED",
      internalReference: `IMZ_${booking.id.slice(0, 8)}`,
      idempotencyKey: input.idempotencyKey,
      createdAt: this.store.now(),
    };
    intent.status = transitionPayment("CREATED", "INITIATED");
    const charged = await provider.charge({
      amount: { amountMinor: booking.amountMinor, currency: booking.currency as "RWF" },
      msisdn: input.msisdn,
      idempotencyKey: input.idempotencyKey,
      internalReference: intent.internalReference,
      description: `Imizi booking ${booking.id}`,
      metadata: { bookingId: booking.id },
    });
    intent.providerReference = charged.providerReference;
    intent.status = charged.status;
    this.store.payments.set(intent.id, intent);
    this.store.analytics.push({ name: "payment_started", userId: user.id, payload: { intentId: intent.id }, at: this.store.now() });
    if (paymentIsAuthoritative(true, charged.status as any)) {
      this.settle(intent.id);
    }
    return intent;
  }

  handleWebhook(providerName: string, headers: Record<string, string | string[] | undefined>, rawBody: string) {
    const provider = this.gateway.resolve(providerName);
    if (!provider.verifyWebhook(headers, rawBody)) {
      throw new UnauthorizedException("Invalid webhook signature");
    }
    const parsed = provider.parseWebhook(rawBody);
    const intent = [...this.store.payments.values()].find((p) => p.providerReference === parsed.providerReference);
    if (!intent) throw new NotFoundException();
    if (parsed.status === "SUCCEEDED") this.settle(intent.id);
    else intent.status = parsed.status;
    return { ok: true };
  }

  settle(intentId: string) {
    const intent = this.store.payments.get(intentId);
    if (!intent) return;
    if (intent.status !== "SUCCEEDED") {
      intent.status = "SUCCEEDED";
      intent.completedAt = this.store.now();
    }
    if (intent.bookingId) this.bookings.confirmFromPayment(intent.bookingId);
    this.store.analytics.push({ name: "payment_success", payload: { intentId }, at: this.store.now() });
  }
}
