import type { Metadata } from "next";
import { PricingPlans } from "@/components/billing/pricing-plans";
import { getMembership } from "@/lib/billing/membership";
import { billingReturnPath } from "@/lib/billing/plans";

export const metadata: Metadata = {
  title: "Plans and pricing",
  description:
    "Compare free essay and student profile guides with the full AidMap library and application workspaces.",
};

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{
    return?: string | string[];
    billing?: string | string[];
  }>;
}) {
  const [membership, query] = await Promise.all([
    getMembership(),
    searchParams,
  ]);
  return (
    <PricingPlans
      plan={membership.plan}
      mode={membership.mode}
      canManage={membership.canManage}
      returnTo={billingReturnPath(query.return)}
      notice={typeof query.billing === "string" ? query.billing : undefined}
    />
  );
}
