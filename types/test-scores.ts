import { z } from "zod";

export const englishRequirement = z.enum([
  "Required unless exempt",
  "Recommended",
  "Optional",
  "One of several options",
  "Program-specific",
]);

export const ieltsGuidanceSchema = z.object({
  requirement: englishRequirement,
  scores: z.array(
    z
      .object({
        score: z.number().min(0).max(9).multipleOf(0.5),
        high: z.number().min(0).max(9).multipleOf(0.5).optional(),
        comparison: z.enum(["at-least", "above"]).default("at-least"),
        kind: z.enum(["minimum", "recommended", "typical", "expected"]),
        condition: z.string().min(1),
      })
      .refine(
        (s) => s.high === undefined || s.high >= s.score,
        "Invalid IELTS range",
      ),
  ),
  noScoreLabel: z.string().min(1),
  detail: z.string().min(1),
});
export type IeltsGuidance = z.infer<typeof ieltsGuidanceSchema>;
