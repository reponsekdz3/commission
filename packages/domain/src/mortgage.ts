import type { Money } from "./money";

export function estimateMonthlyPayment(input: {
  priceMinor: number;
  downPaymentMinor: number;
  annualRateBps: number;
  termMonths: number;
  currency?: Money["currency"];
}): { principal: Money; monthly: Money; totalInterest: Money } {
  const principalMinor = Math.max(0, input.priceMinor - input.downPaymentMinor);
  const monthlyRate = input.annualRateBps / 10000 / 12;
  const n = Math.max(1, input.termMonths);
  let monthlyMinor: number;
  if (monthlyRate === 0) {
    monthlyMinor = Math.round(principalMinor / n);
  } else {
    const factor = (monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);
    monthlyMinor = Math.round(principalMinor * factor);
  }
  const currency = input.currency ?? "RWF";
  const totalPaid = monthlyMinor * n;
  return {
    principal: { amountMinor: principalMinor, currency },
    monthly: { amountMinor: monthlyMinor, currency },
    totalInterest: { amountMinor: Math.max(0, totalPaid - principalMinor), currency },
  };
}
