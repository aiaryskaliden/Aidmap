export const proPrices = {
  monthly: { usd: 12, perMonthUsd: 12, interval: "month" },
  yearly: { usd: 84, perMonthUsd: 7, interval: "year" },
} as const;

export type BillingInterval = keyof typeof proPrices;

export function billingReturnPath(input: unknown): string {
  if (typeof input !== "string" || input.length > 200) return "/pricing";
  const isUniversity = /^\/universities\/[a-z0-9]+(?:-[a-z0-9]+)*\/apply$/.test(
    input,
  );
  const isLibrary =
    /^\/(?:essays|profiles)(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)?$/.test(input);
  return isUniversity || isLibrary ? input : "/pricing";
}

export function pricingPath(returnTo: string, billing?: string) {
  const query = new URLSearchParams();
  if (returnTo !== "/pricing") query.set("return", returnTo);
  if (billing) query.set("billing", billing);
  return query.size ? `/pricing?${query}` : "/pricing";
}
