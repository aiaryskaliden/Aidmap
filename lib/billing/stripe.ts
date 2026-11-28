import type { BillingDevice } from "./device";
import { pricingPath, proPrices, type BillingInterval } from "./plans";

export type StripeConfig = {
  secretKey: string;
  signingSecret: string;
  origin: string;
  prices: Record<BillingInterval, string>;
};

type Price = {
  active: boolean;
  currency: string;
  unit_amount: number;
  recurring: { interval: string; interval_count: number } | null;
};

type Subscription = {
  customer: string;
  status: string;
  metadata: { aidmap_device_id?: string };
  items: { data: { price: { id: string }; current_period_end: number }[] };
};

type CheckoutSession = {
  id: string;
  url: string | null;
  mode: string;
  status: "open" | "complete" | "expired";
  payment_status: string;
  client_reference_id: string | null;
  metadata: {
    aidmap_interval?: BillingInterval;
    aidmap_return?: string;
  } | null;
  customer: string | null;
  subscription: Subscription | null;
};

export function getStripeConfig(): StripeConfig | null {
  const secretKey = process.env.BILLING_STRIPE_SECRET_KEY;
  const signingSecret = process.env.BILLING_COOKIE_SECRET;
  const monthly = process.env.BILLING_STRIPE_MONTHLY_PRICE_ID;
  const yearly = process.env.BILLING_STRIPE_YEARLY_PRICE_ID;
  const originValue = process.env.BILLING_APP_ORIGIN;
  if (
    !secretKey ||
    !/^(?:sk|rk)_(?:live|test)_[A-Za-z0-9]+$/.test(secretKey) ||
    !signingSecret ||
    signingSecret.length < 32 ||
    !monthly ||
    !yearly ||
    monthly === yearly ||
    ![monthly, yearly].every((id) => /^price_[A-Za-z0-9]+$/.test(id)) ||
    !originValue
  ) {
    return null;
  }
  try {
    const url = new URL(originValue);
    const localTest =
      process.env.NODE_ENV !== "production" &&
      secretKey.includes("_test_") &&
      url.protocol === "http:" &&
      ["localhost", "127.0.0.1"].includes(url.hostname);
    if (
      url.origin !== originValue ||
      (url.protocol !== "https:" && !localTest)
    ) {
      return null;
    }
    return {
      secretKey,
      signingSecret,
      origin: url.origin,
      prices: { monthly, yearly },
    };
  } catch {
    return null;
  }
}

async function stripeRequest<T>(
  config: StripeConfig,
  path: string,
  body?: Record<string, string>,
  idempotencyKey?: string,
): Promise<T> {
  const headers = new Headers({
    Authorization: `Bearer ${config.secretKey}`,
    "Stripe-Version": "2026-11-18.endive",
  });
  if (idempotencyKey) headers.set("Idempotency-Key", idempotencyKey);
  const response = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: body ? "POST" : "GET",
    headers,
    body: body ? new URLSearchParams(body) : undefined,
    signal: AbortSignal.timeout(8_000),
    cache: "no-store",
    redirect: "error",
  });
  if (!response.ok)
    throw new Error(`Billing provider returned HTTP ${response.status}`);
  return response.json() as Promise<T>;
}

export async function readCheckout(
  config: StripeConfig,
  device: BillingDevice,
) {
  if (!device.checkoutSessionId) return null;
  const session = await stripeRequest<CheckoutSession>(
    config,
    `checkout/sessions/${encodeURIComponent(device.checkoutSessionId)}?expand%5B%5D=subscription`,
  );
  if (
    session.mode !== "subscription" ||
    session.client_reference_id !== device.id
  ) {
    throw new Error("Checkout is not associated with this device");
  }
  return session;
}

export function verifiedSubscription(
  session: CheckoutSession | null,
  device: BillingDevice,
) {
  const subscription = session?.subscription;
  return session?.status === "complete" &&
    session.customer &&
    subscription?.customer === session.customer &&
    subscription.metadata.aidmap_device_id === device.id
    ? subscription
    : null;
}

export function canResumeSubscription(subscription: Subscription | null) {
  return Boolean(
    subscription &&
    !["canceled", "incomplete_expired"].includes(subscription.status),
  );
}

export function subscriptionGrantsPro(
  config: StripeConfig,
  session: CheckoutSession | null,
  device: BillingDevice,
) {
  const subscription = verifiedSubscription(session, device);
  return Boolean(
    session?.payment_status === "paid" &&
    subscription?.status === "active" &&
    subscription.items.data.some(
      (item) =>
        Object.values(config.prices).includes(item.price.id) &&
        item.current_period_end > Date.now() / 1_000,
    ),
  );
}

export async function createCheckout(
  config: StripeConfig,
  device: BillingDevice,
  interval: BillingInterval,
  returnPath: string,
  customer?: string,
) {
  const priceId = config.prices[interval];
  const price = await stripeRequest<Price>(
    config,
    `prices/${encodeURIComponent(priceId)}`,
  );
  const advertisedPrice = proPrices[interval];
  if (
    !price.active ||
    price.currency !== "usd" ||
    price.unit_amount !== advertisedPrice.usd * 100 ||
    price.recurring?.interval !== advertisedPrice.interval ||
    price.recurring.interval_count !== 1
  ) {
    throw new Error("Stripe price differs from the advertised AidMap plan");
  }
  const body: Record<string, string> = {
    mode: "subscription",
    "line_items[0][price]": priceId,
    "line_items[0][quantity]": "1",
    "payment_method_types[0]": "card",
    "metadata[aidmap_interval]": interval,
    "metadata[aidmap_return]": returnPath,
    "subscription_data[metadata][aidmap_device_id]": device.id,
    client_reference_id: device.id,
    success_url: `${config.origin}${returnPath}?billing=checkout-complete`,
    cancel_url: `${config.origin}${pricingPath(returnPath, "checkout-cancelled")}`,
  };
  if (customer) body.customer = customer;
  return stripeRequest<CheckoutSession>(
    config,
    "checkout/sessions",
    body,
    `aidmap-checkout-${device.id}-${device.checkoutSessionId ?? "first"}`,
  );
}

export async function expireCheckout(config: StripeConfig, sessionId: string) {
  await stripeRequest(
    config,
    `checkout/sessions/${encodeURIComponent(sessionId)}/expire`,
    {},
  );
}

export async function createPortal(
  config: StripeConfig,
  customer: string,
  returnPath: string,
) {
  return stripeRequest<{ url: string }>(config, "billing_portal/sessions", {
    customer,
    return_url: `${config.origin}${returnPath}`,
  });
}
