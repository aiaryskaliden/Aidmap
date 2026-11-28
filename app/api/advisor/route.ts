import { advisorInput, type AdvisorFrame } from "@/lib/advisor/contracts";
import { questionProfile, retrieve } from "@/lib/advisor/catalogue";
import { conversation } from "@/lib/advisor/dialogue";
import {
  generateCoaching,
  generatePlan,
  groqProvider,
} from "@/lib/advisor/provider";
import {
  allowedOrigin,
  authorized,
  catalogueLimit,
  coolDownGroq,
  demoMode,
  reserveGroq,
} from "@/lib/advisor/quota";

export const runtime = "nodejs";
export const maxDuration = 30;
const noStore = {
  "cache-control": "no-store",
  "x-content-type-options": "nosniff",
};
const limit = 6_144;

export function GET(request: Request) {
  return Response.json({ mode: demoMode(request) }, { headers: noStore });
}

async function readRequest(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) return null;
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let size = 0;
  let text = "";
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) return JSON.parse(text + decoder.decode());
      size += value.byteLength;
      if (size > limit) {
        void reader.cancel();
        throw new RangeError();
      }
      text += decoder.decode(value, { stream: true });
    }
  } finally {
    reader.releaseLock();
  }
}

export async function POST(request: Request) {
  const error = (code: string, status: number, headers = {}) =>
    Response.json({ code }, { status, headers: { ...noStore, ...headers } });
  if (!allowedOrigin(request)) return error("origin", 403);
  if (
    request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !==
    "application/json"
  )
    return error("media", 415);
  if (Number(request.headers.get("content-length")) > limit)
    return error("size", 413);
  if (!catalogueLimit(request))
    return error("limit", 429, { "retry-after": "60" });
  let body: unknown;
  try {
    body = await readRequest(request);
  } catch (err) {
    return err instanceof RangeError
      ? error("size", 413)
      : error("invalid", 400);
  }
  const parsed = advisorInput.safeParse(body);
  if (!parsed.success) return error("invalid", 400);
  const input = questionProfile(parsed.data);
  const turn = input.conversation ? conversation(input) : undefined;
  const result = turn?.result ?? retrieve(input);
  const enableModel =
    authorized(request, input.demoConsent) &&
    (turn
      ? (turn.dialogue.kind === "answer" && result.cards.length > 0) ||
        ["writing", "activities"].includes(turn.dialogue.kind)
      : ["shortlist", "eligibility", "roadmap", "compare"].includes(
          result.intent,
        ) && result.plan.length > 0);
  const encoder = new TextEncoder();
  const abort = new AbortController();
  const signal = AbortSignal.any([abort.signal, request.signal]);
  return new Response(
    new ReadableStream<Uint8Array>({
      async start(controller) {
        const send = (frame: AdvisorFrame) =>
          controller.enqueue(encoder.encode(JSON.stringify(frame) + "\n"));
        if (signal.aborted) {
          controller.close();
          return;
        }
        send({
          type: "catalogue",
          result,
          ...(turn && { dialogue: turn.dialogue }),
        });
        let plan = null;
        let coaching = null;
        if (enableModel && process.env.GROQ_API_KEY) {
          try {
            const options = {
              provider: groqProvider(process.env.GROQ_API_KEY),
              result,
              language: input.language,
              signal,
              reserve: (tokens: number) => reserveGroq(request, tokens),
              cooldown: coolDownGroq,
            };
            if (turn)
              coaching = await generateCoaching({
                ...options,
                question: input.question,
                dialogue: turn.dialogue,
              });
            else
              plan = await generatePlan({
                ...options,
                cacheable: !input.profile,
              });
          } catch {
            /* A provider failure leaves the catalogue answer available. */
          }
        }
        if (!abort.signal.aborted) {
          if (!signal.aborted)
            send(
              coaching
                ? { type: "done", mode: "groq", coaching }
                : plan
                  ? { type: "done", mode: "groq", plan }
                  : { type: "done", mode: "catalogue" },
            );
          controller.close();
        }
      },
      cancel() {
        abort.abort();
      },
    }),
    {
      headers: {
        ...noStore,
        "content-type": "application/x-ndjson; charset=utf-8",
      },
    },
  );
}
