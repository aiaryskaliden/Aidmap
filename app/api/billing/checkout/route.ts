import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { decodeBillingDevice } from "@/lib/billing/device";
import { billingDeviceCookie } from "@/lib/billing/membership";
import {
  billingNotice,
  checkBillingOrigin,
  returnPathFrom,
  seeOther,
  setBillingDevice,
  stripeHostedUrl,
} from "@/lib/billing/route-response";
import {
  canResumeSubscription,
  createCheckout,
  expireCheckout,
  getStripeConfig,
  readCheckout,
  verifiedSubscription,
} from "@/lib/billing/stripe";

export async function POST(request: NextRequest) {
  const config = getStripeConfig();
  const origin = config?.origin ?? request.nextUrl.origin;
  if (!checkBillingOrigin(request, origin))
    return new Response(null, { status: 403 });
  const form = await request.formData().catch(() => null);
  const interval = form?.get("interval");
  if (!form || (interval !== "monthly" && interval !== "yearly")) {
    return new Response(null, { status: 400 });
  }
  const returnPath = returnPathFrom(form);
  if (!config) return billingNotice(origin, returnPath, "unavailable");

  const device = decodeBillingDevice(
    request.cookies.get(billingDeviceCookie(config))?.value,
    config.signingSecret,
  );
  if (!device) {
    // Bind a browser before contacting Stripe. A request without a working cookie cannot buy.
    if (request.nextUrl.searchParams.has("initialized")) {
      return billingNotice(origin, returnPath, "error");
    }
    const setup = new URL("/api/billing/checkout?initialized=1", origin);
    return setBillingDevice(
      NextResponse.redirect(setup, {
        status: 307,
        headers: { "Cache-Control": "no-store" },
      }),
      config,
      { id: randomUUID() },
    );
  }

  try {
    const previous = await readCheckout(config, device);
    const subscription = verifiedSubscription(previous, device);
    if (previous?.status === "complete") {
      if (!subscription)
        return billingNotice(origin, returnPath, "checkout-pending");
      if (canResumeSubscription(subscription)) {
        return billingNotice(origin, returnPath, "already-subscribed");
      }
    }
    if (previous?.status === "open") {
      if (
        previous.metadata?.aidmap_interval === interval &&
        previous.metadata.aidmap_return === returnPath
      ) {
        return seeOther(stripeHostedUrl(previous.url, "checkout.stripe.com"));
      }
      await expireCheckout(config, previous.id);
    }
    const checkout = await createCheckout(
      config,
      device,
      interval,
      returnPath,
      subscription?.customer,
    );
    return setBillingDevice(
      seeOther(stripeHostedUrl(checkout.url, "checkout.stripe.com")),
      config,
      { id: device.id, checkoutSessionId: checkout.id },
    );
  } catch {
    return billingNotice(origin, returnPath, "error");
  }
}
