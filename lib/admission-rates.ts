import { z } from "zod";
import records from "@/data/admission-rates.json";
import usBackfill from "@/data/admission-rates-us-backfill.json";
import internationalRecords from "@/data/admission-rates-global.json";

const identity = z.object({
  year: z.number().int().min(2024).max(2099),
  term: z.enum(["fall", "spring", "academic-year", "cycle"]).optional(),
  scope: z.enum([
    "first-year undergraduate · all applicants",
    "first-year undergraduate · application records",
    "undergraduate · all entry years",
  ]),
  scopeNote: z.string().min(1).optional(),
  metric: z.literal("offer").optional(),
  stage: z.enum(["cohort-summary", "decision-release"]),
  checkedAt: z.iso.date(),
  sourceUrl: z.url({ protocol: /^https$/ }),
  sourceTitle: z.string().min(1),
});
const positiveCount = z.number().int().positive();
const admissionRate = z
  .discriminatedUnion("kind", [
    identity.extend({
      kind: z.literal("counts"),
      applicants: positiveCount,
      admitted: z.number().int().nonnegative(),
    }),
    identity.extend({
      kind: z.literal("reported-rate"),
      percent: z.number().min(0).max(100),
      comparison: z.literal("below").optional(),
      applicants: positiveCount.optional(),
    }),
  ])
  .superRefine((value, context) => {
    if (value.kind === "counts" && value.admitted > value.applicants) {
      context.addIssue({
        code: "custom",
        path: ["admitted"],
        message: "Admitted exceeds applicants",
      });
    }
    if (value.year > Number(value.checkedAt.slice(0, 4))) {
      context.addIssue({
        code: "custom",
        path: ["year"],
        message: "Intake is later than source verification",
      });
    }
  });

export const admissionRates = z
  .record(z.string().min(1), admissionRate)
  .parse({ ...records, ...usBackfill, ...internationalRecords });
export type AdmissionRate = z.infer<typeof admissionRate>;
export const getAdmissionRate = (id: string): AdmissionRate | undefined =>
  Object.hasOwn(admissionRates, id) ? admissionRates[id] : undefined;

export function ratePercentage(rate: AdmissionRate) {
  return rate.kind === "counts"
    ? (rate.admitted / rate.applicants) * 100
    : rate.percent;
}

export function formatAdmissionRate(rate: AdmissionRate, locale = "en") {
  const formatted = new Intl.NumberFormat(locale, {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(ratePercentage(rate) / 100);
  return rate.kind === "reported-rate" && rate.comparison === "below"
    ? "<" + formatted
    : formatted;
}

export function formatAdmissionCycle(rate: AdmissionRate, locale = "en") {
  const year = rate.year;
  if (rate.term === "academic-year")
    return `${year}–${String(year + 1).slice(-2)}`;
  const labels =
    locale === "ru"
      ? ["Осень", "Весна", "Цикл"]
      : locale === "kk"
        ? ["Күз", "Көктем", "Кезең"]
        : ["Fall", "Spring", "Cycle"];
  return `${labels[rate.term === "cycle" ? 2 : rate.term === "spring" ? 1 : 0]} ${year}`;
}
