import type { Money, PaymentStatus } from "@imizi/types";

export interface PaymentChargeRequest {
  amount: Money;
  msisdn?: string;
  customerEmail?: string;
  idempotencyKey: string;
  internalReference: string;
  description: string;
  metadata: Record<string, string>;
}

export interface ProviderChargeResult {
  provider: string;
  providerReference: string;
  status: PaymentStatus;
  raw?: Record<string, unknown>;
}

export interface PaymentProvider {
  readonly name: string;
  charge(request: PaymentChargeRequest): Promise<ProviderChargeResult>;
  verifyWebhook(headers: Record<string, string | string[] | undefined>, rawBody: string): boolean;
  parseWebhook(rawBody: string): { providerReference: string; status: PaymentStatus };
}

export class MtnMoMoProvider implements PaymentProvider {
  readonly name = "MTN_MOMO";
  constructor(private readonly config: { subscriptionKey?: string; apiUser?: string; apiKey?: string }) {}

  async charge(request: PaymentChargeRequest): Promise<ProviderChargeResult> {
    if (!request.msisdn) throw new Error("MTN MoMo requires MSISDN");
    return {
      provider: this.name,
      providerReference: `momo_${request.internalReference}`,
      status: this.config.subscriptionKey ? "PENDING_PROVIDER" : "SUCCEEDED",
    };
  }

  verifyWebhook(headers: Record<string, string | string[] | undefined>, rawBody: string): boolean {
    void rawBody;
    return Boolean(headers["x-callback-signature"] || !this.config.subscriptionKey);
  }

  parseWebhook(rawBody: string): { providerReference: string; status: PaymentStatus } {
    const body = JSON.parse(rawBody) as { reference?: string; status?: string };
    const ok = (body.status ?? "SUCCESSFUL").toUpperCase() === "SUCCESSFUL";
    return {
      providerReference: body.reference ?? "",
      status: ok ? "SUCCEEDED" : "FAILED",
    };
  }
}

export class FlutterwaveProvider implements PaymentProvider {
  readonly name = "FLUTTERWAVE";
  constructor(private readonly secret?: string) {}
  async charge(request: PaymentChargeRequest): Promise<ProviderChargeResult> {
    return {
      provider: this.name,
      providerReference: `flw_${request.internalReference}`,
      status: this.secret ? "PENDING_PROVIDER" : "SUCCEEDED",
    };
  }
  verifyWebhook(headers: Record<string, string | string[] | undefined>, rawBody: string): boolean {
    void rawBody;
    if (!this.secret) return true;
    const hash = headers["verif-hash"];
    return hash === this.secret;
  }
  parseWebhook(rawBody: string): { providerReference: string; status: PaymentStatus } {
    const body = JSON.parse(rawBody) as { data?: { tx_ref?: string; status?: string } };
    const ok = body.data?.status === "successful";
    return { providerReference: body.data?.tx_ref ?? "", status: ok ? "SUCCEEDED" : "FAILED" };
  }
}

export class CardProvider implements PaymentProvider {
  readonly name = "CARD";
  async charge(request: PaymentChargeRequest): Promise<ProviderChargeResult> {
    return {
      provider: this.name,
      providerReference: `card_${request.internalReference}`,
      status: "SUCCEEDED",
    };
  }
  verifyWebhook(): boolean {
    return true;
  }
  parseWebhook(rawBody: string) {
    const body = JSON.parse(rawBody) as { reference: string; status: PaymentStatus };
    return { providerReference: body.reference, status: body.status };
  }
}

export class PaymentGateway {
  constructor(private readonly providers: Map<string, PaymentProvider>) {}

  resolve(name: string): PaymentProvider {
    const provider = this.providers.get(name);
    if (!provider) throw new Error(`Unknown payment provider ${name}`);
    return provider;
  }
}

export function createPaymentGateway(env: Record<string, string | undefined>): PaymentGateway {
  const providers = new Map<string, PaymentProvider>([
    ["MTN_MOMO", new MtnMoMoProvider({
      subscriptionKey: env.MTN_MOMO_SUBSCRIPTION_KEY,
      apiUser: env.MTN_MOMO_API_USER,
      apiKey: env.MTN_MOMO_API_KEY,
    })],
    ["FLUTTERWAVE", new FlutterwaveProvider(env.FLUTTERWAVE_SECRET_KEY)],
    ["CARD", new CardProvider()],
  ]);
  return new PaymentGateway(providers);
}
