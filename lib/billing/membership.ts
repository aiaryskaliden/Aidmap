import { cookies } from "next/headers";
import { cache } from "react";
import { decodeBillingDevice } from "./device";
import {
  canResumeSubscription,
  getStripeConfig,
  readCheckout,
  subscriptionGrantsPro,
  verifiedSubscription,
  type StripeConfig,
} from "./stripe";

export type Membership = {
  plan: "free" | "pro";
  mode: "preview" | "stripe" | "unconfigured";
  canManage: boolean;
};

export const previewCookie = "aidmap-preview-membership";

// Preview belongs to an unconfigured development workspace. An incomplete payment
// configuration should not silently enable the preview entitlement.
export function previewEnabled() {
  return (
    process.env.NODE_ENV === "development" &&
    ![
      process.env.BILLING_APP_ORIGIN,
      process.env.BILLING_COOKIE_SECRET,
      process.env.BILLING_STRIPE_SECRET_KEY,
      process.env.BILLING_STRIPE_MONTHLY_PRICE_ID,
      process.env.BILLING_STRIPE_YEARLY_PRICE_ID,
    ].some(Boolean)
  );
}

export function billingDeviceCookie(config: StripeConfig) {
  return config.origin.startsWith("https:")
    ? "__Host-aidmap-billing"
    : "aidmap-billing";
}

export const getMembership = cache(
  async function getMembership(): Promise<Membership> {
    const store = await cookies();
    const config = getStripeConfig();
    if (!config) {
      if (!previewEnabled()) {
        return { plan: "free", mode: "unconfigured", canManage: false };
      }
      return {
        plan: store.get(previewCookie)?.value === "pro" ? "pro" : "free",
        mode: "preview",
        canManage: false,
      };
    }
    const device = decodeBillingDevice(
      store.get(billingDeviceCookie(config))?.value,
      config.signingSecret,
    );
    const free = { plan: "free", mode: "stripe", canManage: false } as const;
    if (!device) return free;
    try {
      const session = await readCheckout(config, device);
      return {
        plan: subscriptionGrantsPro(config, session, device) ? "pro" : "free",
        mode: "stripe",
        canManage: canResumeSubscription(verifiedSubscription(session, device)),
      };
    } catch {
      return free;
    }
  },
);
