import { costKeys, type CostItems, type Currency } from "@/types/domain";

export type Award = {
  amount: number;
  currency: Currency;
  kind: "confirmed" | "hypothetical" | "eligibility";
};
function minorUnits(value: number) {
  if (!Number.isFinite(value) || value < 0 || value > 1_000_000_000_000)
    throw new Error(
      "Amounts must be between 0 and 1 trillion in the selected currency.",
    );
  // All supported currencies use two minor-unit digits. Keep arithmetic in
  // integer minor units so decimal expenses don't create phantom funding gaps.
  return Math.round((value + Number.EPSILON) * 100);
}
export function calculateFunding(
  costs: CostItems,
  currency: Currency,
  contribution: number | null,
  award: Award | null = null,
) {
  let contributionMinor: number | null = null;
  let contributionError: string | null = null;
  if (contribution !== null) {
    try {
      contributionMinor = minorUnits(contribution);
    } catch {
      contributionError =
        "Enter a contribution from 0 to 1 trillion, or leave it blank if unknown.";
    }
  }
  const missing = costKeys.filter((k) => costs[k] === null);
  const knownCostMinor = costKeys.reduce((sum, key) => {
    const v = costs[key];
    return sum + (v === null ? 0 : minorUnits(v));
  }, 0);
  if (award && award.currency !== currency)
    throw new Error(
      "Currency mismatch. Enter all amounts in the selected currency; no conversion is applied.",
    );
  const awardMinor = award ? minorUnits(award.amount) : 0;
  const confirmedMinor = award?.kind === "confirmed" ? awardMinor : 0;
  const confirmedAward = confirmedMinor / 100;
  const knownCost = knownCostMinor / 100;
  const total = missing.length ? null : knownCost;
  const remainingMinor = Math.max(0, knownCostMinor - confirmedMinor);
  const remaining = total === null ? null : remainingMinor / 100;
  return {
    total,
    knownCost,
    missing,
    confirmedAward,
    awardUnknown: award === null || award.kind !== "confirmed",
    remaining,
    contributionError,
    contributionUnknown: contributionMinor === null,
    aboveBudget:
      remaining === null || contributionMinor === null
        ? null
        : Math.max(0, remainingMinor - contributionMinor) / 100,
    excessAward:
      total === null
        ? null
        : Math.max(0, confirmedMinor - knownCostMinor) / 100,
  };
}
export function hypotheticalFunding(
  costs: CostItems,
  currency: Currency,
  contribution: number | null,
  amount: number,
) {
  // Reuse the same arithmetic for this explicitly separate what-if result.
  const base = calculateFunding(costs, currency, contribution, {
    amount,
    currency,
    kind: "confirmed",
  });
  return {
    total: base.total,
    remaining: base.remaining,
    aboveBudget: base.aboveBudget,
  };
}
