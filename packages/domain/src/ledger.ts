import type { Money } from "@imizi/types";
import { addMoney, money } from "./money";

export type LedgerAccountType =
  | "TENANT"
  | "PLATFORM_HOLDING"
  | "LANDLORD"
  | "AGENT"
  | "REFUND"
  | "PLATFORM_REVENUE";

export interface LedgerEntry {
  account: LedgerAccountType;
  direction: "DEBIT" | "CREDIT";
  amount: Money;
  reference: string;
}

export function balanced(entries: LedgerEntry[]): boolean {
  if (entries.length === 0) return false;
  const currency = entries[0].amount.currency;
  let debit = 0;
  let credit = 0;
  for (const entry of entries) {
    if (entry.amount.currency !== currency) return false;
    if (entry.direction === "DEBIT") debit += entry.amount.amountMinor;
    else credit += entry.amount.amountMinor;
  }
  return debit === credit && debit > 0;
}

export function rentCollectionEntries(params: {
  amount: Money;
  commission: Money;
  reference: string;
}): LedgerEntry[] {
  const landlord = money(
    params.amount.amountMinor - params.commission.amountMinor,
    params.amount.currency,
  );
  return [
    { account: "TENANT", direction: "DEBIT", amount: params.amount, reference: params.reference },
    {
      account: "PLATFORM_HOLDING",
      direction: "CREDIT",
      amount: params.amount,
      reference: params.reference,
    },
    {
      account: "PLATFORM_HOLDING",
      direction: "DEBIT",
      amount: params.amount,
      reference: params.reference,
    },
    { account: "LANDLORD", direction: "CREDIT", amount: landlord, reference: params.reference },
    {
      account: "PLATFORM_REVENUE",
      direction: "CREDIT",
      amount: params.commission,
      reference: params.reference,
    },
  ];
}

export function assertBalanced(entries: LedgerEntry[]): void {
  if (!balanced(entries)) {
    throw new Error("Ledger entries are not balanced");
  }
}

export { addMoney };
