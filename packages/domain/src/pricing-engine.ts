import type { Money } from "@imizi/types";
import { addMoney, applyBps, money, subtractMoney } from "./money";

export interface PricingInput {
  base: Money;
  deposit?: Money;
  serviceFeeBps?: number;
  taxBps?: number;
  discount?: Money;
  extraCharges?: Money;
  nights?: number;
}

export interface PricingBreakdown {
  base: Money;
  deposit: Money;
  serviceFee: Money;
  tax: Money;
  discount: Money;
  extraCharges: Money;
  subtotal: Money;
  total: Money;
}

export function calculatePrice(input: PricingInput): PricingBreakdown {
  const nights = input.nights ?? 1;
  if (!Number.isInteger(nights) || nights < 1) {
    throw new Error("nights must be a positive integer");
  }
  const currency = input.base.currency;
  const base = money(input.base.amountMinor * nights, currency);
  const deposit = input.deposit ?? money(0, currency);
  const extraCharges = input.extraCharges ?? money(0, currency);
  const discount = input.discount ?? money(0, currency);
  const serviceFee = applyBps(base, input.serviceFeeBps ?? 0);
  const taxable = addMoney(base, serviceFee);
  const tax = applyBps(taxable, input.taxBps ?? 0);
  const subtotal = addMoney(addMoney(base, extraCharges), addMoney(serviceFee, tax));
  const total = addMoney(subtractMoney(subtotal, discount), deposit);
  return { base, deposit, serviceFee, tax, discount, extraCharges, subtotal, total };
}

export function calculateCommission(gross: Money, commissionBps: number): {
  platform: Money;
  landlord: Money;
} {
  const platform = applyBps(gross, commissionBps);
  return { platform, landlord: subtractMoney(gross, platform) };
}
