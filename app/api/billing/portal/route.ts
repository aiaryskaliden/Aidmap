import type { NextRequest } from "next/server";
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
  createPortal,
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
  const returnPath = form ? returnPathFrom(form) : "/pricing";
  if (!config) return billingNotice(origin, returnPath, "unavailable");
  const device = decodeBillingDevice(
    request.cookies.get(billingDeviceCookie(config))?.value,
    config.signingSecret,
  );
  if (!device) return billingNotice(origin, returnPath, "unavailable");

  try {
    const session = await readCheckout(config, device);
    const subscription = verifiedSubscription(session, device);
    if (!subscription) return billingNotice(origin, returnPath, "unavailable");
    const portal = await createPortal(
      config,
      subscription.customer,
      returnPath,
    );
    return setBillingDevice(
      seeOther(stripeHostedUrl(portal.url, "billing.stripe.com")),
      config,
      device,
    );
  } catch {
    return billingNotice(origin, returnPath, "error");
  }
}
