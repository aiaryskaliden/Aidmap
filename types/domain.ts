import { z } from "zod";

export const currencySchema = z.enum(["USD", "EUR", "GBP", "KZT"]);
export type Currency = z.infer<typeof currencySchema>;
export const amountSchema = z.number().nonnegative().max(1_000_000_000_000);
export const sourceSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  url: z.url().refine((v) => v.startsWith("https://")),
  checkedAt: z.iso.date(),
  cycle: z.string().nullable(),
  type: z.literal("official"),
  status: z.enum(["verified", "needs-rechecking"]),
  fields: z.array(z.string()).min(1),
  note: z.string().optional(),
});
export type EvidenceSource = z.infer<typeof sourceSchema>;
const fact = <T extends z.ZodType>(value: T) =>
  z.object({
    value: value.nullable(),
    sourceIds: z.array(z.string()),
    cycle: z.string().nullable(),
    note: z.string().optional(),
    scope: z
      .object({
        program: z.string(),
        subjects: z.array(z.string()),
        purpose: z.enum(["admission", "scholarship"]),
      })
      .optional(),
  });
export type Fact<T> = {
  value: T | null;
  sourceIds: string[];
  cycle: string | null;
  note?: string;
  scope?: {
    program: string;
    subjects: string[];
    purpose: "admission" | "scholarship";
  };
};
export const costKeys = [
  "tuition",
  "fees",
  "housing",
  "food",
  "insurance",
  "books",
  "transportation",
] as const;
export type CostKey = (typeof costKeys)[number];
export const costLabels: Record<CostKey, string> = {
  tuition: "Tuition",
  fees: "Mandatory fees",
  housing: "Housing",
  food: "Food & meals",
  insurance: "Health insurance",
  books: "Books & personal expenses",
  transportation: "Transportation",
};
export const costsSchema = z.object({
  tuition: amountSchema.nullable(),
  fees: amountSchema.nullable(),
  housing: amountSchema.nullable(),
  food: amountSchema.nullable(),
  insurance: amountSchema.nullable(),
  books: amountSchema.nullable(),
  transportation: amountSchema.nullable(),
});
export type CostItems = z.infer<typeof costsSchema>;
export const testPolicySchema = z.enum([
  "required",
  "optional",
  "not-accepted",
  "flexible",
]);
export const deadlineSchema = z.object({
  label: z.string(),
  date: z.iso.date().nullable(),
  cycle: z.string().nullable(),
  kind: z.enum(["fixed", "priority", "recommended", "relative"]),
  note: z.string(),
  sourceIds: z.array(z.string()).optional(),
});
export type AdmissionDeadline = z.infer<typeof deadlineSchema>;
const unknownFact = { value: null, sourceIds: [], cycle: null };
export const emptyCosts: CostItems = {
  tuition: null,
  fees: null,
  housing: null,
  food: null,
  insurance: null,
  books: null,
  transportation: null,
};
export const universitySchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string(),
  shortName: z.string(),
  initials: z.string(),
  country: z.string(),
  region: z.enum(["United States", "Europe"]),
  city: z.string(),
  state: z.string(),
  type: z.string(),
  website: z.url(),
  color: z.string(),
  degree: z.literal("Undergraduate"),
  programs: fact(z.array(z.string())),
  internationalAid: fact(z.boolean()),
  needBlind: fact(z.boolean()),
  meetsFullNeed: fact(z.boolean()),
  meritAid: fact(z.boolean()),
  fullTuition: fact(z.boolean()),
  fullCost: fact(z.boolean()),
  aidForms: fact(z.string()),
  testPolicy: fact(z.string()),
  englishPolicy: fact(z.string()),
  satPolicy: fact(testPolicySchema).default(unknownFact),
  satMinimum: fact(z.number().min(400).max(1600)).default(unknownFact),
  satMedian: fact(z.number().min(400).max(1600)).default(unknownFact),
  satMiddle50: fact(
    z.object({
      low: z.number().min(400).max(1600),
      high: z.number().min(400).max(1600),
    }),
  ).default(unknownFact),
  actPolicy: fact(testPolicySchema).default(unknownFact),
  englishTests: fact(z.array(z.string())).default(unknownFact),
  englishWaiver: fact(z.boolean()).default(unknownFact),
  englishMinimums: fact(
    z.array(
      z.object({
        test: z.string(),
        score: z.number(),
        kind: z.enum(["minimum", "recommended"]),
        condition: z.string(),
      }),
    ),
  ).default(unknownFact),
  admissionEligibility: fact(z.string()).default(unknownFact),
  citizenshipEligibility: fact(z.array(z.string())).default(unknownFact),
  requirements: fact(
    z.array(
      z.object({
        label: z.string(),
        status: z.enum(["Required", "Optional", "Conditional"]),
        condition: z.string().nullable(),
      }),
    ),
  ).default(unknownFact),
  deadlines: fact(z.array(deadlineSchema)).default(unknownFact),
  annualCost: fact(amountSchema).default(unknownFact),
  admissionDeadline: fact(z.iso.date()),
  aidDeadline: fact(z.iso.date()),
  applicationPlatform: fact(z.string()),
  applicationPlans: fact(z.array(z.string())),
  feeWaiver: fact(z.boolean()),
  applicationFee: fact(z.number().nonnegative()),
  costs: costsSchema,
  costCurrency: currencySchema,
  costCycle: z.string().nullable(),
  costSourceIds: z.array(z.string()),
  sources: z.array(sourceSchema).min(1),
  unknowns: z.array(z.string()),
});
export type University = z.infer<typeof universitySchema>;
export type AcademicProgram = {
  name: string;
  degree: "Undergraduate";
  evidence: Fact<string>;
};
export type AdmissionPolicy = Pick<
  University,
  "testPolicy" | "englishPolicy" | "admissionDeadline" | "applicationPlatform"
>;
export type FinancialAidPolicy = Pick<
  University,
  "internationalAid" | "needBlind" | "meetsFullNeed" | "meritAid" | "aidForms"
>;
export type CostOfAttendance = {
  items: CostItems;
  currency: Currency;
  cycle: string | null;
  sourceIds: string[];
};

export const profileSchema = z
  .object({
    citizenship: z.string().max(100),
    targetCountries: z.array(z.string()),
    major: z.string().max(100),
    entryYear: z.number().int().min(2027).max(2035),
    sat: z.number().int().min(400).max(1600).nullable(),
    act: z.number().int().min(1).max(36).nullable(),
    englishTest: z.enum(["", "IELTS", "TOEFL", "Duolingo"]),
    englishScore: z.number().nonnegative().max(160).nullable(),
    toeflScale: z.enum(["120", "6"]).optional(),
    gradingScale: z.enum(["", "4.0", "5.0", "10", "100", "Other"]),
    grades: z.string().max(100),
    budget: z.number().nonnegative().max(10000000).nullable(),
    currency: currencySchema,
    aidPreference: z.enum(["Any", "Need-based", "Merit"]),
    priorities: z.array(z.string()),
    isDemo: z.boolean(),
  })
  .superRefine((p, ctx) => {
    if (p.englishScore !== null && !p.englishTest)
      ctx.addIssue({
        code: "custom",
        path: ["englishTest"],
        message: "Select the test for your score.",
      });
    if (
      p.englishTest === "IELTS" &&
      p.englishScore !== null &&
      (p.englishScore > 9 || p.englishScore % 0.5 !== 0)
    )
      ctx.addIssue({
        code: "custom",
        path: ["englishScore"],
        message: "IELTS scores range from 0 to 9, in 0.5 increments.",
      });
    if (
      p.englishTest === "TOEFL" &&
      p.englishScore !== null &&
      p.englishScore > (p.toeflScale === "6" ? 6 : 120)
    )
      ctx.addIssue({
        code: "custom",
        path: ["englishScore"],
        message:
          "Enter a TOEFL score within the selected scale. Scores are not converted.",
      });
    if (p.grades && !p.gradingScale)
      ctx.addIssue({
        code: "custom",
        path: ["gradingScale"],
        message: "Select your school's grading scale.",
      });
    if (
      p.grades &&
      p.gradingScale &&
      p.gradingScale !== "Other" &&
      (!Number.isFinite(Number(p.grades)) ||
        Number(p.grades) < 0 ||
        Number(p.grades) > Number(p.gradingScale))
    )
      ctx.addIssue({
        code: "custom",
        path: ["grades"],
        message: "Grade must be within the selected scale.",
      });
  });
export type ApplicantProfile = z.infer<typeof profileSchema>;
export const blankProfile: ApplicantProfile = {
  citizenship: "",
  targetCountries: [],
  major: "",
  entryYear: 2027,
  sat: null,
  act: null,
  englishTest: "",
  englishScore: null,
  gradingScale: "",
  grades: "",
  budget: null,
  currency: "USD",
  aidPreference: "Any",
  priorities: [],
  isDemo: false,
};
export const taskSchema = z.object({
  id: z.string(),
  text: z.string().min(1).max(500),
  done: z.boolean(),
  sourceUrl: z
    .url()
    .refine((v) => v.startsWith("https://"))
    .optional(),
  kind: z.enum(["research", "official", "user"]).optional(),
});
export type ApplicationTask = z.infer<typeof taskSchema>;
export const statuses = [
  "Interested",
  "Researching",
  "Preparing",
  "Ready to apply",
  "Submitted",
  "Decision received",
] as const;
export const savedUniversitySchema = z.object({
  universityId: z.string(),
  status: z.enum(statuses),
  deadline: z.iso.date().nullable(),
  deadlineSource: z
    .object({
      url: z.url().refine((v) => v.startsWith("https://")),
      cycle: z.string(),
      kind: z.enum(["fixed", "priority", "recommended", "relative"]),
      label: z.string(),
    })
    .optional(),
  notes: z.string().max(10000),
  applicationType: z.string().max(100),
  tasks: z.array(taskSchema).max(500),
});
export type SavedUniversity = z.infer<typeof savedUniversitySchema>;
export const scenarioSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  universityId: z.string(),
  currency: currencySchema,
  costs: costsSchema,
  contribution: amountSchema.nullable(),
  confirmedAward: amountSchema.nullable(),
  hypotheticalAward: amountSchema.nullable(),
  createdAt: z.iso.datetime(),
});
export type FundingScenario = z.infer<typeof scenarioSchema>;
export type Scholarship = {
  id: string;
  name: string;
  provider: string;
  universityId: string;
  level: "Undergraduate";
  kind:
    | "Institutional policy"
    | "Competitive scholarship"
    | "Government scholarship"
    | "Fee reduction";
  fundingType: "Need-based" | "Merit" | "Government" | "Fee reduction";
  eligibleCitizenships: string[] | null;
  eligibleMajors: string[] | null;
  coverage: string;
  amount: number | null;
  currency: Currency;
  renewal: string | null;
  deadline: Fact<string>;
  separateApplication: string | null;
  source: EvidenceSource;
  eligibilityUnknown: boolean;
};
export const storageSchema = z
  .object({
    version: z.literal(1),
    profile: profileSchema.nullable(),
    saved: z.array(savedUniversitySchema).max(100),
    compare: z.array(z.string()).max(4),
    scenarios: z.array(scenarioSchema).max(100),
    savedFunding: z.array(z.string()).max(100),
    theme: z.enum(["light", "dark"]),
  })
  .superRefine((s, ctx) => {
    for (const [key, ids] of [
      ["saved", s.saved.map((v) => v.universityId)],
      ["compare", s.compare],
      ["scenarios", s.scenarios.map((v) => v.id)],
      ["savedFunding", s.savedFunding],
    ] as const) {
      if (new Set(ids).size !== ids.length)
        ctx.addIssue({
          code: "custom",
          path: [key],
          message: "Duplicate records are not allowed.",
        });
    }
    for (const saved of s.saved)
      if (new Set(saved.tasks.map((t) => t.id)).size !== saved.tasks.length)
        ctx.addIssue({
          code: "custom",
          path: ["saved"],
          message: "Duplicate task IDs are not allowed.",
        });
  });
export type LocalState = z.infer<typeof storageSchema>;
