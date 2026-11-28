import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

const deviceSchema = z.strictObject({
  id: z.uuid(),
  checkoutSessionId: z
    .string()
    .regex(/^cs_(?:test|live)_[A-Za-z0-9]+$/)
    .optional(),
});

export type BillingDevice = z.infer<typeof deviceSchema>;

function signature(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest();
}

export function encodeBillingDevice(device: BillingDevice, secret: string) {
  const payload = Buffer.from(JSON.stringify(device)).toString("base64url");
  return `${payload}.${signature(payload, secret).toString("base64url")}`;
}

export function decodeBillingDevice(value: string | undefined, secret: string) {
  if (!value || !/^[\w-]{1,1024}\.[\w-]{43}$/.test(value)) return null;
  const [payload, signed] = value.split(".");
  const expected = signature(payload, secret);
  const supplied = Buffer.from(signed, "base64url");
  if (
    expected.length !== supplied.length ||
    !timingSafeEqual(expected, supplied)
  ) {
    return null;
  }
  try {
    const data = deviceSchema.safeParse(
      JSON.parse(Buffer.from(payload, "base64url").toString("utf8")),
    );
    return data.success ? data.data : null;
  } catch {
    return null;
  }
}
