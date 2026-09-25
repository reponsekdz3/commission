import type { VerificationStatus } from "@imizi/types";

const TRANSITIONS: Record<VerificationStatus, VerificationStatus[]> = {
  UNVERIFIED: ["SUBMITTED"],
  SUBMITTED: ["UNDER_REVIEW"],
  UNDER_REVIEW: ["VERIFIED", "REJECTED"],
  VERIFIED: ["UNVERIFIED"],
  REJECTED: ["SUBMITTED"],
};

export function transitionVerification(
  from: VerificationStatus,
  to: VerificationStatus,
): VerificationStatus {
  if (!TRANSITIONS[from].includes(to)) {
    throw new Error(`Illegal verification transition ${from} → ${to}`);
  }
  return to;
}
