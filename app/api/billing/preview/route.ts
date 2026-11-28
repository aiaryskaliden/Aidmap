import type { NextRequest } from "next/server";
import { previewCookie, previewEnabled } from "@/lib/billing/membership";
import {
  billingNotice,
  checkBillingOrigin,
  requestBillingOrigin,
  returnPathFrom,
} from "@/lib/billing/route-response";

export async function POST(request: NextRequest) {
  if (!previewEnabled()) {
    return new Response(null, { status: 404 });
  }
  const origin = requestBillingOrigin(request);
  if (!checkBillingOrigin(request, origin))
    return new Response(null, { status: 403 });
  const form = await request.formData().catch(() => null);
  const plan = form?.get("plan");
  if (!form || (plan !== "pro" && plan !== "free")) {
    return new Response(null, { status: 400 });
  }
  const response = billingNotice(origin, returnPathFrom(form), "preview");
  response.cookies.set(previewCookie, plan, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: request.nextUrl.protocol === "https:",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
