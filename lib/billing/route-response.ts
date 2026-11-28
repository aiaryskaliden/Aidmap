import { NextResponse, type NextRequest } from "next/server";
import { encodeBillingDevice, type BillingDevice } from "./device";
import { billingDeviceCookie } from "./membership";
import { billingReturnPath, pricingPath } from "./plans";
import type { StripeConfig } from "./stripe";

export function checkBillingOrigin(request: NextRequest, origin: string) {
  return request.headers.get("origin") === origin;
}

export function requestBillingOrigin(request: NextRequest) {
  const host = request.headers.get("host");
  const local = host?.match(
    /^(?:localhost|127\.0\.0\.1|\[::1\])(?::(\d{1,5}))?$/i,
  );
  if (local && (!local[1] || Number(local[1]) <= 65535)) {
    return new URL(`${request.nextUrl.protocol}//${host}`).origin;
  }
  return request.nextUrl.origin;
}

export function returnPathFrom(form: FormData) {
  return billingReturnPath(form.get("return") ?? form.get("returnTo"));
}

export function seeOther(url: string | URL) {
  return NextResponse.redirect(url, {
    status: 303,
    headers: { "Cache-Control": "no-store" },
  });
}

export function billingNotice(
  origin: string,
  returnPath: string,
  notice: string,
) {
  const url = new URL(
    notice === "preview"
      ? `${returnPath}?billing=preview`
      : pricingPath(returnPath, notice),
    origin,
  );
  return seeOther(url);
}

export function setBillingDevice(
  response: NextResponse,
  config: StripeConfig,
  device: BillingDevice,
) {
  response.cookies.set(
    billingDeviceCookie(config),
    encodeBillingDevice(device, config.signingSecret),
    {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: config.origin.startsWith("https:"),
      maxAge: 60 * 60 * 24 * 390,
    },
  );
  return response;
}

export function stripeHostedUrl(value: string | null, hostname: string) {
  if (!value) throw new Error("The billing provider did not send a URL");
  const url = new URL(value);
  if (url.origin !== `https://${hostname}` || url.username || url.password) {
    throw new Error("Unexpected billing provider URL");
  }
  return url;
}
