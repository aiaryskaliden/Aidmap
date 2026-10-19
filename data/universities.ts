import research from "../research-universities.json";
import {
  emptyCosts,
  type EvidenceSource,
  type Fact,
  type Scholarship,
} from "@/types/domain";
import { validateUniversities } from "@/lib/validation/universities";

export const universities = validateUniversities(
  research.map((r) => {
    const sources: EvidenceSource[] = r.findings.map((f, i) => ({
      id: `${r.slug}-${i + 1}`,
      title: f.title,
      url: f.sourceUrl,
      checkedAt: f.checkedAt,
      cycle: f.cycle,
      type: "official",
      status:
        f.field === "meritAid" && f.value === null
          ? "needs-rechecking"
          : "verified",
      fields: [
        f.field,
        ...(f.field === "aidFormsDetail" ? ["aidForms"] : []),
        ...(f.field === "needBlindException" ? ["needBlind"] : []),
      ],
      note: f.note,
    }));
    const get = <T>(field: string): Fact<T> => {
      const indices = r.findings.flatMap((f, i) =>
        f.field === field ? [i] : [],
      );
      const index = indices.at(-1);
      const finding = index === undefined ? null : r.findings[index];
      if (!finding || index === undefined)
        return { value: null, sourceIds: [], cycle: null };
      const extras = r.findings.flatMap((f, i) =>
        f.field ===
        (field === "aidForms"
          ? "aidFormsDetail"
          : field === "needBlind"
            ? "needBlindException"
            : "__none")
          ? [i]
          : [],
      );
      const raw = finding.value;
      return {
        value: (field === "aidForms" && Array.isArray(raw)
          ? [...raw, ...extras.map((i) => r.findings[i].value)].join("; ")
          : raw) as T | null,
        sourceIds: [sources[index].id, ...extras.map((i) => sources[i].id)],
        cycle: finding.cycle,
        note: [finding.note, ...extras.map((i) => r.findings[i].note)].join(
          " ",
        ),
      };
    };
    return {
      id: r.slug,
      name: r.name,
      shortName: r.slug === "mit" ? "MIT" : r.name.split(" ")[0],
      initials: r.initials,
      country: "United States",
      region: "United States",
      city: r.city,
      state: r.state,
      type: ["amherst", "bowdoin"].includes(r.slug)
        ? "Liberal arts college"
        : "Private university",
      website: r.website,
      color: r.color,
      degree: "Undergraduate",
      programs: get<string[]>("programs"),
      internationalAid: get<boolean>("internationalAid"),
      needBlind: get<boolean>("needBlind"),
      meetsFullNeed: get<boolean>("meetsFullNeed"),
      meritAid: get<boolean>("meritAid"),
      fullTuition: get<boolean>("fullTuition"),
      fullCost: get<boolean>("fullCost"),
      aidForms: get<string>("aidForms"),
      testPolicy: get<string>("testPolicy"),
      englishPolicy: get<string>("englishPolicy"),
      admissionDeadline: get<string>("admissionDeadline"),
      aidDeadline: get<string>("aidDeadline"),
      applicationPlatform: get<string>("applicationPlatform"),
      applicationPlans: get<string[]>("applicationPlans"),
      feeWaiver: get<boolean>("feeWaiver"),
      applicationFee: get<number>("applicationFee"),
      costs: { ...emptyCosts },
      costCurrency: "USD",
      costCycle: null,
      costSourceIds: [],
      sources,
      unknowns: r.unknowns,
    };
  }),
);
export const findUniversity = (id: string) =>
  universities.find((u) => u.id === id);
export const academicFields = [
  ...new Set(universities.flatMap((u) => u.programs.value ?? [])),
].sort();
export const opportunities: Scholarship[] = universities.map((u) => ({
  id: `${u.id}-need-based`,
  name: `${u.shortName} need-based financial aid`,
  provider: u.name,
  universityId: u.id,
  level: "Undergraduate",
  kind: "Institutional policy",
  fundingType: "Need-based",
  eligibleCitizenships: u.internationalAid.value
    ? ["International applicants"]
    : null,
  eligibleMajors: null,
  coverage: u.meetsFullNeed.value
    ? "Meets institution-calculated demonstrated need; your award is unknown."
    : "Coverage not yet verified.",
  amount: null,
  currency: "USD",
  renewal: null,
  deadline: u.aidDeadline,
  separateApplication: u.aidForms.value,
  source:
    u.sources.find((s) => u.internationalAid.sourceIds.includes(s.id)) ??
    u.sources[0],
  eligibilityUnknown: u.internationalAid.value === null,
}));
