import { createHmac, timingSafeEqual } from "node:crypto";

const minute = 60_000;
const day = 86_400_000;
const counters = new Map<string, { used: number; until: number }>();
let cooldown = 0;
export const isPreview = () =>
  process.env.VERCEL === "1" && process.env.VERCEL_ENV === "preview";

export function loopback(request: Request) {
  const hosts = ["127.0.0.1", "localhost", "[::1]"];
  if (!hosts.includes(new URL(request.url).hostname)) return false;
  const host = request.headers.get("host");
  return !host || hosts.some((h) => host === h || host.startsWith(h + ":"));
}

export function allowedOrigin(request: Request) {
  if (request.headers.get("sec-fetch-site") === "cross-site") return false;
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const url = new URL(request.url);
  const host = request.headers.get("host");
  const protocol = process.env.VERCEL === "1" ? "https:" : url.protocol;
  // Next may replace the loopback hostname in request.url with localhost.
  return origin === (host ? protocol + "//" + host : url.origin);
}

export function demoMode(request: Request) {
  if (process.env.ADVISOR_AI_MODE !== "demo" || !process.env.GROQ_API_KEY)
    return "catalogue";
  if (
    isPreview() &&
    (process.env.ADVISOR_DEMO_TOKEN?.length ?? 0) >= 32 &&
    redisConfig()
  )
    return "protected";
  if (
    process.env.VERCEL !== "1" &&
    process.env.NODE_ENV === "development" &&
    loopback(request)
  )
    return "local";
  return "catalogue";
}

export function authorized(request: Request, consent?: boolean) {
  if (!consent) return false;
  const mode = demoMode(request);
  if (mode === "local") return true;
  if (mode !== "protected") return false;
  const expected = Buffer.from("Bearer " + process.env.ADVISOR_DEMO_TOKEN);
  const supplied = Buffer.from(request.headers.get("authorization") ?? "");
  return (
    supplied.length === expected.length && timingSafeEqual(supplied, expected)
  );
}

function identity(request: Request) {
  const address =
    process.env.VERCEL === "1"
      ? (request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        "unknown")
      : "local";
  return createHmac(
    "sha256",
    process.env.ADVISOR_DEMO_TOKEN || "aidmap-catalogue",
  )
    .update(address)
    .digest("hex")
    .slice(0, 24);
}

function remaining(
  key: string,
  limit: number,
  debit: number,
  ttl: number,
  now: number,
) {
  const stored = counters.get(key);
  const current =
    stored && stored.until > now ? stored : { used: 0, until: now + ttl };
  if (current.used + debit > limit) return null;
  return { used: current.used + debit, until: current.until };
}

export function catalogueLimit(request: Request) {
  const now = Date.now();
  const key = "catalogue:" + identity(request);
  if (counters.size >= 2_000 && !counters.has(key)) {
    for (const [key, entry] of counters)
      if (entry.until <= now) counters.delete(key);
    if (counters.size >= 2_000) return false;
  }
  const quota = remaining(key, 30, 1, minute, now);
  if (!quota) return false;
  counters.set(key, quota);
  return true;
}

function configured(
  value: string | undefined,
  defaultValue: number,
  max: number,
) {
  const n = Number(value);
  return Number.isSafeInteger(n) && n > 0 && n <= max ? n : defaultValue;
}

function redisConfig() {
  const url = process.env.ADVISOR_REDIS_REST_URL;
  const token = process.env.ADVISOR_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  try {
    const endpoint = new URL(url);
    return endpoint.protocol === "https:" &&
      endpoint.hostname.endsWith(".upstash.io") &&
      !endpoint.username &&
      !endpoint.password &&
      !endpoint.port
      ? { url: endpoint.origin, token }
      : null;
  } catch {
    return null;
  }
}

async function redis(command: (string | number)[]) {
  const config = redisConfig();
  if (!config) return null;
  try {
    const response = await fetch(config.url, {
      method: "POST",
      cache: "no-store",
      redirect: "error",
      headers: {
        authorization: "Bearer " + config.token,
        "content-type": "application/json",
      },
      body: JSON.stringify(command),
      signal: AbortSignal.timeout(1_500),
    });
    if (!response.ok) return null;
    const body = await response.json();
    return body.result ?? null;
  } catch {
    return null;
  }
}

const reserveScript = [
  "if redis.call('EXISTS', KEYS[1]) == 1 then return 0 end",
  "for i=2,4 do",
  "local p=(i-2)*3",
  "if tonumber(redis.call('GET',KEYS[i]) or '0')+tonumber(ARGV[p+1])>tonumber(ARGV[p+2]) then return 0 end",
  "end",
  "for i=2,4 do",
  "local p=(i-2)*3",
  "local v=redis.call('INCRBY',KEYS[i],ARGV[p+1])",
  "if v==tonumber(ARGV[p+1]) then redis.call('EXPIRE',KEYS[i],ARGV[p+3]) end",
  "end",
  "return 1",
].join("\n");
const cooldownScript =
  "if redis.call('PTTL',KEYS[1]) < tonumber(ARGV[1]) then redis.call('PSETEX',KEYS[1],ARGV[1],'1') end return 1";
const prefix = "{aidmap-advisor}:";

export async function reserveGroq(request: Request, tokens: number) {
  const now = Date.now();
  if (cooldown > now) return false;
  const requests = configured(process.env.ADVISOR_DAILY_REQUESTS, 60, 10_000);
  const tokenBudget = configured(
    process.env.ADVISOR_DAILY_TOKENS,
    100_000,
    10_000_000,
  );
  const userBudget = configured(
    process.env.ADVISOR_USER_REQUESTS_PER_MINUTE,
    6,
    60,
  );
  const user = "user:" + identity(request);
  if (isPreview()) {
    return (
      (await redis([
        "EVAL",
        reserveScript,
        4,
        prefix + "cooldown",
        prefix + user,
        prefix + "requests",
        prefix + "tokens",
        1,
        userBudget,
        60,
        1,
        requests,
        86_400,
        tokens,
        tokenBudget,
        86_400,
      ])) === 1
    );
  }
  const perUser = remaining(user, userBudget, 1, minute, now);
  const perDay = remaining("groq:requests", requests, 1, day, now);
  const perToken = remaining("groq:tokens", tokenBudget, tokens, day, now);
  if (!perUser || !perDay || !perToken) return false;
  counters.set(user, perUser);
  counters.set("groq:requests", perDay);
  counters.set("groq:tokens", perToken);
  return true;
}

export async function coolDownGroq(milliseconds: number) {
  cooldown = Math.max(cooldown, Date.now() + milliseconds);
  if (isPreview())
    await redis(["EVAL", cooldownScript, 1, prefix + "cooldown", milliseconds]);
}
