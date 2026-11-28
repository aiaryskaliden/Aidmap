import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { POST as checkout } from "@/app/api/billing/checkout/route";
import { POST as portal } from "@/app/api/billing/portal/route";
import { POST as preview } from "@/app/api/billing/preview/route";
import { decodeBillingDevice, encodeBillingDevice } from "@/lib/billing/device";
import { getMembership, previewCookie } from "@/lib/billing/membership";
import { billingReturnPath } from "@/lib/billing/plans";
import {
  canResumeSubscription,
  getStripeConfig,
  subscriptionGrantsPro,
} from "@/lib/billing/stripe";

const requestCookies = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: async () => requestCookies }));

const origin = "https://aidmap.example";
const secret = "mock-cookie-secret-for-unit-tests-only";
const device = {
  id: "b06de836-5190-481a-af95-7d34b08d1d9d",
  checkoutSessionId: "cs_test_mockCheckout",
};

function stripeConfiguration() {
  vi.stubEnv("BILLING_APP_ORIGIN", origin);
  vi.stubEnv("BILLING_COOKIE_SECRET", secret);
  vi.stubEnv("BILLING_STRIPE_SECRET_KEY", "sk_test_mockOnly");
  vi.stubEnv("BILLING_STRIPE_MONTHLY_PRICE_ID", "price_monthly");
  vi.stubEnv("BILLING_STRIPE_YEARLY_PRICE_ID", "price_yearly");
  return getStripeConfig()!;
}

function billingRequest(
  endpoint: string,
  fields: Record<string, string>,
  headers: Record<string, string> = {},
) {
  return new NextRequest(`${origin}/api/billing/${endpoint}`, {
    method: "POST",
    headers: { origin, ...headers },
    body: new URLSearchParams(fields),
  });
}

function completedSession() {
  return {
    id: device.checkoutSessionId,
    url: null,
    mode: "subscription",
    status: "complete" as const,
    payment_status: "paid",
    client_reference_id: device.id,
    customer: "cus_mock",
    metadata: null,
    subscription: {
      status: "active",
      customer: "cus_mock",
      metadata: { aidmap_device_id: device.id },
      items: {
        data: [
          {
            price: { id: "price_monthly" },
            current_period_end: Date.now() / 1_000 + 3600,
          },
        ],
      },
    },
  };
}

afterEach(() => {
  vi.resetAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("AidMap billing", () => {
  it("round-trips only signed browser bindings and limits returns to workspaces and library pages", () => {
    const cookie = encodeBillingDevice(device, secret);
    expect(decodeBillingDevice(cookie, secret)).toEqual(device);
    expect(decodeBillingDevice(cookie, "other-secret")).toBeNull();
    expect(decodeBillingDevice(cookie.replace(/^./, "!"), secret)).toBeNull();
    expect(billingReturnPath("/universities/mit/apply")).toBe(
      "/universities/mit/apply",
    );
    for (const path of [
      "/essays",
      "/profiles",
      "/essays/my-story",
      "/profiles/an-applicant",
    ]) {
      expect(billingReturnPath(path)).toBe(path);
    }
    expect(billingReturnPath("//example.org/universities/mit/apply")).toBe(
      "/pricing",
    );
    expect(
      billingReturnPath("/universities/mit/apply?redirect=//example.org"),
    ).toBe("/pricing");
  });

  it("issues a local preview cookie for same-origin form posts and ignores it in production", async () => {
    vi.stubEnv("BILLING_STRIPE_SECRET_KEY", "");
    vi.stubEnv("NODE_ENV", "development");
    const response = await preview(
      billingRequest("preview", {
        plan: "pro",
        return: "/universities/mit/apply",
      }),
    );
    expect(response.headers.get("location")).toBe(
      `${origin}/universities/mit/apply?billing=preview`,
    );
    expect(response.headers.get("set-cookie")).toContain(
      `${previewCookie}=pro`,
    );
    const localPreview = await preview(
      new NextRequest("http://localhost:3000/api/billing/preview", {
        method: "POST",
        headers: {
          host: "127.0.0.1:3000",
          origin: "http://127.0.0.1:3000",
        },
        body: new URLSearchParams({ plan: "pro" }),
      }),
    );
    expect(localPreview.headers.get("location")).toBe(
      "http://127.0.0.1:3000/pricing?billing=preview",
    );

    vi.stubEnv("NODE_ENV", "production");
    requestCookies.get.mockReturnValue({ value: "pro" });
    expect(await getMembership()).toEqual({
      plan: "free",
      mode: "unconfigured",
      canManage: false,
    });
    expect(
      (await preview(billingRequest("preview", { plan: "pro" }))).status,
    ).toBe(404);
  });

  it("disables preview grants when a payment configuration is incomplete", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("BILLING_STRIPE_MONTHLY_PRICE_ID", "price_monthly");
    requestCookies.get.mockReturnValue({ value: "pro" });
    expect(await getMembership()).toEqual({
      plan: "free",
      mode: "unconfigured",
      canManage: false,
    });
    expect(
      (await preview(billingRequest("preview", { plan: "pro" }))).status,
    ).toBe(404);
  });

  it("does not contact Stripe for a cross-origin form or a browser without a device cookie", async () => {
    stripeConfiguration();
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    expect(
      (
        await checkout(
          billingRequest(
            "checkout",
            { interval: "monthly" },
            { origin: "https://unrelated.example" },
          ),
        )
      ).status,
    ).toBe(403);
    const response = await checkout(
      billingRequest("checkout", { interval: "monthly" }),
    );
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      `${origin}/api/billing/checkout?initialized=1`,
    );
    expect(response.headers.get("set-cookie")).toContain(
      "__Host-aidmap-billing=",
    );
    expect(response.headers.get("set-cookie")).toContain("Secure");
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("won't charge a provider price that differs from the advertised plan", async () => {
    stripeConfiguration();
    const fetch = vi.fn().mockResolvedValue(
      Response.json({
        active: true,
        currency: "usd",
        unit_amount: 9999,
        recurring: { interval: "month", interval_count: 1 },
      }),
    );
    vi.stubGlobal("fetch", fetch);
    const deviceCookie = encodeBillingDevice({ id: device.id }, secret);
    const response = await checkout(
      billingRequest(
        "checkout",
        { interval: "monthly" },
        { cookie: `__Host-aidmap-billing=${deviceCookie}` },
      ),
    );
    expect(response.headers.get("location")).toBe(
      `${origin}/pricing?billing=error`,
    );
    expect(fetch).toHaveBeenCalledExactlyOnceWith(
      "https://api.stripe.com/v1/prices/price_monthly",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("never starts another Checkout session for a browser with an active subscription", async () => {
    stripeConfiguration();
    const fetch = vi.fn().mockResolvedValue(Response.json(completedSession()));
    vi.stubGlobal("fetch", fetch);
    const response = await checkout(
      billingRequest(
        "checkout",
        { interval: "yearly" },
        {
          cookie: `__Host-aidmap-billing=${encodeBillingDevice(device, secret)}`,
        },
      ),
    );
    expect(response.headers.get("location")).toBe(
      `${origin}/pricing?billing=already-subscribed`,
    );
    expect(fetch).toHaveBeenCalledExactlyOnceWith(
      expect.stringContaining(device.checkoutSessionId),
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("sends the configured recurring price and binds the provider's checkout to the browser", async () => {
    stripeConfiguration();
    const providerUrl =
      "https://checkout.stripe.com/c/pay/cs_test_mockCheckout";
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({
          active: true,
          currency: "usd",
          unit_amount: 8400,
          recurring: { interval: "year", interval_count: 1 },
        }),
      )
      .mockResolvedValueOnce(
        Response.json({ id: device.checkoutSessionId, url: providerUrl }),
      );
    vi.stubGlobal("fetch", fetch);
    const requestCookie = encodeBillingDevice({ id: device.id }, secret);
    const response = await checkout(
      billingRequest(
        "checkout",
        {
          interval: "yearly",
          return: "/universities/mit/apply",
          price: "price_untrusted",
        },
        { cookie: `__Host-aidmap-billing=${requestCookie}` },
      ),
    );
    const [url, options] = fetch.mock.calls[1];
    expect(url).toBe("https://api.stripe.com/v1/checkout/sessions");
    expect(options.body.get("line_items[0][price]")).toBe("price_yearly");
    expect(options.body.get("success_url")).toBe(
      `${origin}/universities/mit/apply?billing=checkout-complete`,
    );
    expect(options.body.get("client_reference_id")).toBe(device.id);
    expect(response.headers.get("location")).toBe(providerUrl);
    expect(response.headers.get("set-cookie")).toContain(
      `__Host-aidmap-billing=${encodeBillingDevice(device, secret)}`,
    );
  });

  it("never redirects to a customer portal page outside Stripe", async () => {
    stripeConfiguration();
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(Response.json(completedSession()))
      .mockResolvedValueOnce(
        Response.json({ url: "https://billing.stripe.com.unrelated.example/" }),
      );
    vi.stubGlobal("fetch", fetch);
    const response = await portal(
      billingRequest(
        "portal",
        {},
        {
          cookie: `__Host-aidmap-billing=${encodeBillingDevice(device, secret)}`,
        },
      ),
    );
    expect(response.headers.get("location")).toBe(
      `${origin}/pricing?billing=error`,
    );
  });

  it("grants paid access only for the correct current subscription and browser", () => {
    const config = stripeConfiguration();
    const session = completedSession();
    expect(subscriptionGrantsPro(config, session, device)).toBe(true);
    expect(canResumeSubscription(session.subscription)).toBe(true);
    expect(
      subscriptionGrantsPro(
        config,
        { ...session, payment_status: "unpaid" },
        device,
      ),
    ).toBe(false);
    expect(
      subscriptionGrantsPro(config, session, { ...device, id: "wrong-device" }),
    ).toBe(false);
    session.subscription.items.data[0].current_period_end = 0;
    expect(subscriptionGrantsPro(config, session, device)).toBe(false);
    session.subscription.items.data[0].current_period_end =
      Date.now() / 1_000 + 3600;
    session.subscription.status = "canceled";
    expect(subscriptionGrantsPro(config, session, device)).toBe(false);
    expect(canResumeSubscription(session.subscription)).toBe(false);
  });
});
