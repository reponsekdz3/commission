import type { CurrencyCode, Money } from "@imizi/types";

export function money(amountMinor: number, currency: CurrencyCode): Money {
  if (!Number.isInteger(amountMinor) || amountMinor < 0) {
    throw new Error("Money amounts must be non-negative integer minor units");
  }
  return { amountMinor, currency };
}

export function assertSameCurrency(a: Money, b: Money): void {
  if (a.currency !== b.currency) {
    throw new Error(`Currency mismatch: ${a.currency} vs ${b.currency}`);
  }
}

export function addMoney(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  return money(a.amountMinor + b.amountMinor, a.currency);
}

export function subtractMoney(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  if (a.amountMinor < b.amountMinor) {
    throw new Error("Insufficient funds for subtraction");
  }
  return money(a.amountMinor - b.amountMinor, a.currency);
}

export function applyBps(amount: Money, bps: number): Money {
  if (!Number.isInteger(bps) || bps < 0) {
    throw new Error("Basis points must be a non-negative integer");
  }
  return money(Math.floor((amount.amountMinor * bps) / 10_000), amount.currency);
}

export function formatMoney(amount: Money, locale = "en-RW"): string {
  const major = amount.amountMinor / 100;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: amount.currency,
    maximumFractionDigits: amount.currency === "RWF" ? 0 : 2,
  }).format(amount.currency === "RWF" ? amount.amountMinor : major);
}

/** RWF is stored in whole francs (no minor subunit in local UX); keep integer francs. */
export function rwf(francs: number): Money {
  if (!Number.isInteger(francs) || francs < 0) {
    throw new Error("RWF amounts must be whole francs");
  }
  return { amountMinor: francs, currency: "RWF" };
}
