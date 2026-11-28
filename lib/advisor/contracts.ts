import { z } from "zod";
import { currencySchema } from "@/types/domain";
import type { FieldStatus } from "@/lib/admissions";

export const languages = ["en", "ru", "kk"] as const;
export type Language = (typeof languages)[number];
export const intents = [
  "shortlist",
  "funding",
  "compare",
  "eligibility",
  "timeline",
  "documents",
  "cost",
  "roadmap",
  "search",
  "acceptance",
] as const;
export type Intent = (typeof intents)[number];
export const focusAreas = [
  "general",
  "ielts",
  "toefl",
  "duolingo",
  "english",
  "act",
  "sat",
  "reports",
  "eligibility",
  "tuition",
  "aid",
  "deadlines",
  "documents",
  "programme",
  "acceptance",
  "readiness",
] as const;
export type FocusArea = (typeof focusAreas)[number];
export const actions = [
  "program",
  "qualification",
  "tests",
  "documents",
  "cost",
  "funding",
  "timeline",
  "apply",
] as const;
export type Action = (typeof actions)[number];
const id = z.string().regex(/^[a-z0-9-]{1,90}$/);
const filter = z.string().trim().min(1).max(80);
export const fundingChoices = [
  "any",
  "fullCost",
  "fullTuition",
  "fullNeed",
  "merit",
] as const;
export const activityChoices = [
  "olympiads",
  "research",
  "projects",
  "community",
  "arts",
  "sports",
] as const;
export const profileSchema = z
  .strictObject({
    major: filter.optional(),
    countries: z.array(filter).max(6).optional(),
    nationality: z
      .string()
      .regex(/^[A-Z]{2}$/)
      .optional(),
    budget: z.number().nonnegative().max(1_000_000).optional(),
    currency: currencySchema.optional(),
    sat: z.number().int().min(400).max(1600).optional(),
    satMath: z.number().int().min(200).max(800).optional(),
    ielts: z.number().min(0).max(9).multipleOf(0.5).optional(),
    gpa: z.number().nonnegative().max(100).optional(),
    gpaScale: z
      .union([z.literal(4), z.literal(5), z.literal(10), z.literal(100)])
      .optional(),
    activities: z.array(z.enum(activityChoices)).max(6).optional(),
    funding: z.enum(fundingChoices).optional(),
  })
  .refine((p) => (p.budget === undefined) === (p.currency === undefined))
  .refine(
    (p) =>
      p.satMath === undefined ||
      p.sat === undefined ||
      (p.sat - p.satMath >= 200 && p.sat - p.satMath <= 800),
  )
  .refine(
    (p) =>
      (p.gpa === undefined) === (p.gpaScale === undefined) &&
      (p.gpa ?? 0) <= (p.gpaScale ?? 100),
  );
export type AdvisorProfile = z.infer<typeof profileSchema>;

export const advisorInput = z.strictObject({
  question: z.string().trim().min(1).max(700),
  language: z.enum(languages),
  profile: profileSchema.optional(),
  universityIds: z.array(id).max(4).optional(),
  previous: z
    .strictObject({
      intent: z.enum(intents),
      ids: z.array(id).max(4),
      focus: z.enum(focusAreas).optional(),
    })
    .optional(),
  demoConsent: z.boolean().optional(),
  conversation: z.literal(true).optional(),
});
export type AdvisorInput = z.infer<typeof advisorInput>;

export type Evidence = {
  id: string;
  title: string;
  url: string;
  checkedAt: string;
  cycle: string | null;
};
export type AdvisorFact = {
  field: string;
  value: string | null;
  status: FieldStatus | "incomplete";
  cycle: string | null;
  scope?: string;
  note?: string;
  refs: string[];
};
export type Check =
  | "programMatch"
  | "withinBudget"
  | "overBudget"
  | "tuitionOver"
  | "tuitionOnly"
  | "historicalBudget"
  | "budgetUnknown"
  | "satAbove"
  | "satBelow"
  | "satConditional"
  | "screeningMet"
  | "screeningReview"
  | "ieltsCondition"
  | "gpaUnassessed"
  | "qualificationPending"
  | "citizenshipPending"
  | "activitiesContext";
export type Funding = {
  name: string;
  kind: string;
  coverage: string;
  amount: number | null;
  currency: string;
  deadline: AdvisorFact;
  renewal: string | null;
  application: string | null;
  eligibility: "check" | "listed" | "excluded";
  eligibilityTerms?: string;
  ref: string;
};
export type AdvisorCard = {
  id: string;
  name: string;
  location: string;
  country: string;
  checks: Check[];
  band: "reach" | "target" | "safetyCandidate" | "unclassified";
  facts: AdvisorFact[];
  funding: Funding[];
};
export type PlanStep = { action: Action; refs: string[] };
export type AdvisorResult = {
  intent: Intent;
  cards: AdvisorCard[];
  evidence: Evidence[];
  plan: PlanStep[];
  major?: string;
  funding?: (typeof fundingChoices)[number];
  totalMatches: number;
};
export type Dialogue = {
  kind:
    | "answer"
    | "welcome"
    | "thanks"
    | "writing"
    | "activities"
    | "profile"
    | "clarify";
  focus: FocusArea;
  message: string;
  suggestions: string[];
  emphasizedFields: string[];
  library?: "essays" | "profiles";
};
export type AdvisorFrame =
  | { type: "catalogue"; result: AdvisorResult; dialogue?: Dialogue }
  | {
      type: "done";
      mode: "catalogue" | "groq";
      plan?: PlanStep[];
      coaching?: string;
    }
  | { type: "error"; code: string };
