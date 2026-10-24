import { z } from "zod";
import { englishRequirement } from "./test-scores";

const evidence = z.array(z.string().min(1)).min(1);
const textFact = z.object({ text: z.string().min(1), sourceIds: evidence });
export const researchStatus = z.enum([
  "target-cycle",
  "general-policy",
  "historical",
  "not-researched",
  "unpublished",
  "conflicting",
  "not-applicable",
]);
export const researchSourceSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  url: z.url().refine((v) => v.startsWith("https://")),
  checkedAt: z.iso.date(),
  cycle: z.string().nullable(),
  status: researchStatus,
  applicability: z.string().min(1),
  note: z.string().optional(),
});
export const requirementSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  label: z.string().min(1),
  level: z.enum(["Required", "Recommended", "Optional", "Conditional"]),
  condition: z.string(),
  owner: z.enum([
    "Student",
    "School",
    "Counselor",
    "Teacher",
    "Parent",
    "Other",
  ]),
  stage: z.enum(["admission", "aid", "enrollment"]),
  rounds: z.array(z.string()),
  submission: z.string(),
  due: z.string(),
  sourceIds: evidence,
  reusableKey: z.string().optional(),
});
export const researchDeadlineSchema = z.object({
  id: z.string().min(1),
  label: z.string(),
  category: z.enum([
    "admission",
    "aid",
    "testing",
    "documents",
    "supplement",
    "enrollment",
  ]),
  rounds: z.array(z.string()),
  date: z.iso.date().nullable(),
  monthDay: z
    .string()
    .regex(/^\d{2}-\d{2}$/)
    .nullable(),
  cycle: z.string().nullable(),
  timezone: z.string().nullable(),
  time: z.string().nullable(),
  relative: z.object({ event: z.string(), days: z.number().int() }).nullable(),
  sourceIds: evidence,
  note: z.string(),
});
const range = z
  .tuple([z.number(), z.number()])
  .refine(([a, b]) => a <= b)
  .nullable();
export const dossierSchema = z
  .object({
    universityId: z.string(),
    sources: z.array(researchSourceSchema).min(1),
    route: textFact,
    rounds: z.array(
      z.object({ name: z.string(), policy: z.string(), sourceIds: evidence }),
    ),
    fee: z.object({
      amount: z.number().nonnegative().nullable(),
      currency: z.literal("USD"),
      waiver: z.string(),
      sourceIds: evidence,
    }),
    programs: z.array(
      z.object({
        name: z.string(),
        category: z.string(),
        credential: z.enum([
          "major",
          "concentration",
          "minor",
          "certificate",
          "related field",
        ]),
        sourceIds: evidence,
      }),
    ),
    requirements: z.array(requirementSchema).min(1),
    testing: textFact,
    scores: z.object({
      cohort: z.string().nullable(),
      population: z.string(),
      satComposite: range,
      satReading: range,
      satMath: range,
      actComposite: range,
      satMedian: z.number().nullable(),
      satSubmissionPercent: z.number().min(0).max(100).nullable(),
      actSubmissionPercent: z.number().min(0).max(100).nullable(),
      sourceIds: evidence,
      note: z.string(),
    }),
    english: z.object({
      requirement: englishRequirement.optional(),
      text: z.string(),
      tests: z.array(
        z.object({
          name: z.string(),
          kind: z.enum(["minimum", "recommended", "typical", "accepted"]),
          score: z.number().nullable(),
          comparison: z.enum(["at-least", "above"]).optional(),
          scale: z.string(),
          condition: z.string(),
        }),
      ),
      waiver: z
        .object({
          englishMediumYears: z.number().nullable(),
          nativeEnglish: z.boolean(),
          rule: z.string(),
        })
        .nullable(),
      sourceIds: evidence,
    }),
    selection: z.object({
      text: z.string(),
      sourceIds: evidence,
      cdsYear: z.string().nullable(),
      factors: z.array(
        z.object({
          name: z.string(),
          importance: z.enum([
            "Very important",
            "Important",
            "Considered",
            "Not considered",
          ]),
          sourceIds: evidence,
        }),
      ),
    }),
    funding: z.object({
      text: z.string(),
      forms: z.string(),
      renewal: z.string(),
      exceptions: z.string(),
      sourceIds: evidence,
    }),
    costs: z.object({
      year: z.string().nullable(),
      currency: z.literal("USD"),
      total: z.number().nonnegative().nullable(),
      components: z.array(
        z.object({
          label: z.string(),
          amount: z.number().nonnegative().nullable(),
          kind: z.enum(["billed", "estimated", "waivable"]),
          sourceIds: evidence,
        }),
      ),
      exclusions: z.string(),
      sourceIds: evidence,
    }),
    deadlines: z.array(researchDeadlineSchema),
    gaps: z.array(z.string()),
  })
  .superRefine((d, ctx) => {
    const ids = new Set(d.sources.map((s) => s.id));
    if (ids.size !== d.sources.length)
      ctx.addIssue({ code: "custom", message: "Duplicate source IDs" });
    if (new Set(d.requirements.map((r) => r.id)).size !== d.requirements.length)
      ctx.addIssue({ code: "custom", message: "Duplicate requirement IDs" });
    if (new Set(d.deadlines.map((r) => r.id)).size !== d.deadlines.length)
      ctx.addIssue({ code: "custom", message: "Duplicate deadline IDs" });
    function walk(value: unknown) {
      if (!value || typeof value !== "object") return;
      if (Array.isArray(value)) {
        value.forEach(walk);
        return;
      }
      for (const [key, item] of Object.entries(value)) {
        if (key === "sourceIds" && Array.isArray(item))
          for (const id of item) {
            if (!ids.has(id))
              ctx.addIssue({
                code: "custom",
                message: `Missing source ${String(id)}`,
              });
          }
        else walk(item);
      }
    }
    walk(d);
    for (const r of d.requirements) {
      if (r.level === "Conditional" && !r.condition.trim())
        ctx.addIssue({ code: "custom", message: `Condition missing: ${r.id}` });
      for (const round of r.rounds)
        if (!d.rounds.some((x) => x.name === round))
          ctx.addIssue({ code: "custom", message: `Unknown round ${round}` });
    }
    for (const deadline of d.deadlines) {
      if (deadline.date && !deadline.cycle)
        ctx.addIssue({
          code: "custom",
          message: `Dated deadline needs cycle: ${deadline.id}`,
        });
      if (deadline.relative && deadline.date)
        ctx.addIssue({
          code: "custom",
          message: `Relative deadline cannot have a fixed date: ${deadline.id}`,
        });
    }
  });
export type AdmissionsDossier = z.infer<typeof dossierSchema>;
export type Requirement = z.infer<typeof requirementSchema>;
export type ResearchDeadline = z.infer<typeof researchDeadlineSchema>;
export const researchLabels: Record<z.infer<typeof researchStatus>, string> = {
  "target-cycle": "Target cycle verified",
  "general-policy": "Current general policy",
  historical: "Historical reference",
  "not-researched": "Research incomplete",
  unpublished: "Not published by the university",
  conflicting: "Official sources differ",
  "not-applicable": "Not applicable",
};
