import type { BookingStatus } from "@imizi/types";

const TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  PENDING: ["PAYMENT_PENDING", "CANCELLED"],
  PAYMENT_PENDING: ["CONFIRMED", "EXPIRED", "CANCELLED"],
  CONFIRMED: ["ACTIVE", "CANCELLED"],
  ACTIVE: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
  EXPIRED: [],
};

export function canTransitionBooking(from: BookingStatus, to: BookingStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export function transitionBooking(from: BookingStatus, to: BookingStatus): BookingStatus {
  if (!canTransitionBooking(from, to)) {
    throw new Error(`Illegal booking transition ${from} → ${to}`);
  }
  return to;
}

export function isHoldStatus(status: BookingStatus): boolean {
  return status === "PAYMENT_PENDING" || status === "CONFIRMED" || status === "ACTIVE";
}

export function datesOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
): boolean {
  return aStart < bEnd && bStart < aEnd;
}
