import original from "../research-universities.json";
import existingUpdates from "./research-existing-v2.json";
import followupUpdates from "./research-followup-v2.json";
import usExpansion from "./research-us-v2.json";
import europeanExpansion from "./research-europe-v2.json";
import testingUpdates from "./research-testing.json";
import {
  emptyCosts,
  type EvidenceSource,
  type Fact,
  type Scholarship,
  type Currency,
  type University,
  type AdmissionDeadline,
} from "@/types/domain";
import { validateUniversities } from "@/lib/validation/universities";
import { normalizeMajor } from "@/lib/admissions";
import { withCoreResearch } from "@/lib/core-catalogue";
import { findDossier } from "./core-admissions";
import type { IeltsGuidance } from "@/types/test-scores";
type Finding = {
  field: string;
  value: unknown;
  sourceUrl: string;
  title: string;
  checkedAt: string;
  cycle: string | null;
  note?: string;
  scope?: Fact<unknown>["scope"];
};
type ResearchAward = {
  name: string;
  kind: Scholarship["kind"];
  fundingType: Scholarship["fundingType"];
  eligibleCitizenships: string[] | null;
  coverage: string;
  amount: number | null;
  currency: Currency;
  renewal: string | null;
  separateApplication: string | null;
  sourceUrl: string;
  title: string;
  cycle: string | null;
  note: string;
  deadline: string | null;
  deadlineCycle: string | null;
};
type Research = {
  slug: string;
  name: string;
  initials: string;
  city: string;
  state: string;
  country?: string;
  region?: "United States" | "Europe";
  type?: string;
  website: string;
  color: string;
  findings: Finding[];
  scholarships?: ResearchAward[];
  unknowns?: string[];
};
const research: Research[] = (
  [
    ...original.map((r) => ({
      ...r,
      findings: [
        ...r.findings,
        ...(existingUpdates.find((x) => x.slug === r.slug)?.findings ?? []),
        ...(followupUpdates.find((x) => x.slug === r.slug)?.findings ?? []),
      ],
    })),
    ...(usExpansion as Research[]),
    ...(europeanExpansion as Research[]),
  ] as Research[]
).map((r) => ({
  ...r,
  findings: [
    ...r.findings,
    ...((testingUpdates.find((x) => x.slug === r.slug)?.findings ??
      []) as Finding[]),
  ],
}));
const baseUniversities = validateUniversities(
  research.map((r) => {
    const sources: EvidenceSource[] = r.findings.map((f, i) => ({
      id: `${r.slug}-${i + 1}`,
      title: f.title,
      url: f.sourceUrl,
      checkedAt: f.checkedAt,
      cycle: f.cycle,
      type: "official",
      status: f.value === null ? "needs-rechecking" : "verified",
      fields: [
        f.field,
        ...(f.field === "aidFormsDetail" ? ["aidForms"] : []),
        ...(f.field === "needBlindException" ? ["needBlind"] : []),
        ...(f.field === "satPolicy" ? ["testPolicy"] : []),
        ...(f.field === "englishTests" ? ["englishPolicy"] : []),
        ...(f.field === "ielts" ? ["englishMinimums"] : []),
      ],
      note: f.note,
    }));
    const get = <T>(field: string): Fact<T> => {
      const indices = r.findings.flatMap((f, i) =>
        f.field === field ? [i] : [],
      );
      const index = indices.at(-1);
      if (index === undefined)
        return { value: null, sourceIds: [], cycle: null };
      const f = r.findings[index];
      const extras = r.findings.flatMap((x, i) =>
        x.field ===
        (field === "aidForms"
          ? "aidFormsDetail"
          : field === "needBlind"
            ? "needBlindException"
            : "__none")
          ? [i]
          : [],
      );
      return {
        value: (field === "aidForms" && Array.isArray(f.value)
          ? [...f.value, ...extras.map((i) => r.findings[i].value)].join("; ")
          : f.value) as T | null,
        sourceIds: [sources[index].id, ...extras.map((i) => sources[i].id)],
        cycle: f.cycle,
        note: [f.note, ...extras.map((i) => r.findings[i].note)]
          .filter(Boolean)
          .join(" "),
        scope: f.scope,
      };
    };
    const programs = get<string[]>("programs");
    const programIndices = r.findings.flatMap((f, i) =>
      f.field === "programs" && Array.isArray(f.value) ? [i] : [],
    );
    if (programIndices.length) {
      programs.value = [
        ...new Set(
          programIndices.flatMap((i) =>
            (r.findings[i].value as string[]).map(normalizeMajor),
          ),
        ),
      ];
      const extraProgramSources = r.findings.flatMap((f, i) =>
        f.field === "programsDetail" ? [i] : [],
      );
      extraProgramSources.forEach((i) => sources[i].fields.push("programs"));
      programs.sourceIds = [...programIndices, ...extraProgramSources].map(
        (i) => sources[i].id,
      );
      programs.note = [...programIndices, ...extraProgramSources]
        .map(
          (i) =>
            `${Array.isArray(r.findings[i].value) ? (r.findings[i].value as string[]).join(", ") + ". " : ""}${r.findings[i].note ?? ""}`,
        )
        .join(" ");
    }
    const satPolicy = get<University["satPolicy"]["value"]>("satPolicy");
    let testPolicy = get<string>("testPolicy");
    if (satPolicy.value !== null)
      testPolicy = {
        ...satPolicy,
        value:
          satPolicy.value === "required"
            ? "SAT or ACT required"
            : satPolicy.value === "optional"
              ? `Test optional${satPolicy.cycle ? ` for ${satPolicy.cycle}` : ""}`
              : satPolicy.value === "not-accepted"
                ? "SAT not considered"
                : "SAT or other testing alternatives; check conditions",
      };
    const englishTests = get<string[]>("englishTests");
    const ielts = get<IeltsGuidance>("ielts");
    const englishMinimums = ielts.value
      ? {
          ...ielts,
          value: ielts.value.scores.length
            ? ielts.value.scores.flatMap((s) =>
                s.kind === "minimum" || s.kind === "recommended"
                  ? [
                      {
                        test: "IELTS",
                        score: s.score,
                        kind: s.kind,
                        condition: `${s.condition} English evidence: ${ielts.value!.requirement}.`,
                      },
                    ]
                  : [],
              )
            : null,
        }
      : get<NonNullable<University["englishMinimums"]["value"]>>(
          "englishMinimums",
        );
    let englishPolicy = get<string>("englishPolicy");
    if (
      englishTests.value !== null &&
      (!englishPolicy.value ||
        englishTests.sourceIds.some(
          (id) =>
            sources.find((s) => s.id === id)!.checkedAt >
            (sources.find((s) => englishPolicy.sourceIds.includes(s.id))
              ?.checkedAt ?? ""),
        ))
    )
      englishPolicy = {
        ...englishTests,
        value: `Accepted evidence: ${englishTests.value.join(", ")}. ${englishTests.note ?? "Check applicant-specific requirements and exemptions."}`,
      };
    const deadlines = get<AdmissionDeadline[]>("deadlines");
    const deadlineIndices = r.findings.flatMap((f, i) =>
      f.field === "deadlines" && Array.isArray(f.value) ? [i] : [],
    );
    if (deadlineIndices.length) {
      deadlines.value = deadlineIndices.flatMap((i) =>
        (r.findings[i].value as AdmissionDeadline[]).map((d) => ({
          ...d,
          sourceIds: [sources[i].id],
        })),
      );
      deadlines.sourceIds = deadlineIndices.map((i) => sources[i].id);
    }
    const annualCost = get<number>("annualCost");
    const tuition = get<number>("tuition");
    const region = r.region ?? "United States";
    return {
      id: r.slug,
      name: r.name,
      shortName:
        r.slug === "mit"
          ? "MIT"
          : r.name.replace(/^University of /, "").split(" ")[0],
      initials: r.initials,
      country: r.country ?? "United States",
      region,
      city: r.city,
      state: r.state,
      type:
        r.type ??
        (["amherst", "bowdoin"].includes(r.slug)
          ? "Liberal arts college"
          : "Private university"),
      website: r.website,
      color: r.color,
      degree: "Undergraduate",
      programs,
      internationalAid: get<boolean>("internationalAid"),
      needBlind: get<boolean>("needBlind"),
      meetsFullNeed: get<boolean>("meetsFullNeed"),
      meritAid: get<boolean>("meritAid"),
      fullTuition: get<boolean>("fullTuition"),
      fullCost: get<boolean>("fullCost"),
      aidForms: get<string>("aidForms"),
      testPolicy,
      englishPolicy,
      ielts,
      satPolicy,
      satMinimum: get("satMinimum"),
      satMedian: get("satMedian"),
      satMiddle50: get("satMiddle50"),
      actPolicy: get("actPolicy"),
      englishTests,
      englishWaiver: get("englishWaiver"),
      englishMinimums,
      admissionEligibility: get("admissionEligibility"),
      citizenshipEligibility: get("citizenshipEligibility"),
      requirements: get("requirements"),
      deadlines,
      annualCost,
      admissionDeadline: get<string>("admissionDeadline"),
      aidDeadline: get<string>("aidDeadline"),
      applicationPlatform: get<string>("applicationPlatform"),
      applicationPlans: get<string[]>("applicationPlans"),
      feeWaiver: get<boolean>("feeWaiver"),
      applicationFee: get<number>("applicationFee"),
      costs: { ...emptyCosts, tuition: tuition.value },
      costCurrency: region === "United States" ? "USD" : "EUR",
      costCycle: tuition.cycle ?? annualCost.cycle,
      costSourceIds: tuition.sourceIds,
      sources,
      unknowns: [
        ...(get("requirements").value === null
          ? [
              "Application documents and program-specific requirements need checking.",
            ]
          : []),
        ...(deadlines.value?.some((d) => d.cycle === "Fall 2027" && d.date)
          ? []
          : ["Fall 2027 admission dates need checking."]),
        ...(annualCost.value === null
          ? ["A dated total annual cost baseline is not yet verified."]
          : []),
        "Individual aid eligibility and award amounts depend on your circumstances.",
      ],
    };
  }),
);
export const universities = validateUniversities(
  baseUniversities.map((u) => withCoreResearch(u, findDossier(u.id))),
);
export const findUniversity = (id: string) =>
  universities.find((u) => u.id === id);
export const academicFields = [
  ...new Set(universities.flatMap((u) => u.programs.value ?? [])),
].sort();
export const opportunities: Scholarship[] = [
  ...universities
    .filter((u) => u.internationalAid.value === true)
    .map((u): Scholarship => ({
      id: `${u.id}-need-based`,
      name: `${u.shortName} need-based financial aid`,
      provider: u.name,
      universityId: u.id,
      level: "Undergraduate",
      kind: "Institutional policy",
      fundingType: "Need-based",
      eligibleCitizenships: [
        "Eligible international applicants; check conditions",
      ],
      eligibleMajors: null,
      coverage: u.meetsFullNeed.value
        ? "Meets institution-calculated demonstrated need. Your contribution and award are assessed individually."
        : u.internationalAid.note ||
          "Need-based support is available; verify coverage and conditions.",
      amount: null,
      currency: u.costCurrency,
      renewal: findDossier(u.id)?.funding.renewal ?? null,
      deadline: u.aidDeadline,
      separateApplication: u.aidForms.value,
      source: u.sources.find((s) =>
        u.internationalAid.sourceIds.includes(s.id),
      )!,
      eligibilityUnknown: false,
    })),
  ...research.flatMap((r) =>
    (r.scholarships ?? []).map((s, i): Scholarship => ({
      id: `${r.slug}-award-${i + 1}`,
      name: s.name,
      provider: r.name,
      universityId: r.slug,
      level: "Undergraduate",
      kind: s.kind,
      fundingType: s.fundingType,
      eligibleCitizenships: s.eligibleCitizenships,
      eligibleMajors: null,
      coverage: s.coverage,
      amount: s.amount,
      currency: s.currency,
      renewal: s.renewal,
      deadline: {
        value: s.deadline,
        sourceIds: [`${r.slug}-award-${i + 1}`],
        cycle: s.deadlineCycle,
        note: s.note,
      },
      separateApplication: s.separateApplication,
      source: {
        id: `${r.slug}-award-${i + 1}`,
        title: s.title,
        url: s.sourceUrl,
        checkedAt: "2026-10-19",
        cycle: s.cycle,
        type: "official",
        status: "verified",
        fields: ["scholarship"],
        note: s.note,
      },
      eligibilityUnknown: s.eligibleCitizenships === null,
    })),
  ),
];
