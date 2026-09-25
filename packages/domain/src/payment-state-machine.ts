import type { PaymentStatus } from "@imizi/types";

const TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  CREATED: ["INITIATED", "EXPIRED"],
  INITIATED: ["PENDING_PROVIDER", "FAILED", "EXPIRED"],
  PENDING_PROVIDER: ["SUCCEEDED", "FAILED", "EXPIRED"],
  SUCCEEDED: ["REFUNDED", "PARTIALLY_REFUNDED"],
  FAILED: [],
  EXPIRED: [],
  REFUNDED: [],
  PARTIALLY_REFUNDED: ["REFUNDED"],
};

export function transitionPayment(from: PaymentStatus, to: PaymentStatus): PaymentStatus {
  if (!TRANSITIONS[from].includes(to)) {
    throw new Error(`Illegal payment transition ${from} → ${to}`);
  }
  return to;
}

export function paymentIsAuthoritative(clientClaimSuccess: boolean, serverStatus: PaymentStatus): boolean {
  void clientClaimSuccess;
  return serverStatus === "SUCCEEDED";
}
