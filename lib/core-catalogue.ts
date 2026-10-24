import type { AdmissionsDossier } from "@/types/admissions";
import type { Fact, University, EvidenceSource } from "@/types/domain";

// Normalized discovery categories; detailed exceptions remain in the sourced dossier.
const policies: Record<
  string,
  NonNullable<University["satPolicy"]["value"]>
> = {
  harvard: "required",
  yale: "required",
  princeton: "optional",
  mit: "required",
  amherst: "optional",
  dartmouth: "flexible",
  bowdoin: "optional",
  brown: "required",
};
export function withCoreResearch(
  u: University,
  d: AdmissionsDossier | undefined,
): University {
  if (!d) return u;
  const sources: EvidenceSource[] = d.sources.map((s) => ({
    ...s,
    type: "official",
    fields: [],
    status: ["target-cycle", "general-policy", "historical"].includes(s.status)
      ? "verified"
      : "needs-rechecking",
    note: [s.applicability, s.note].filter(Boolean).join(" "),
  }));
  function fact<T>(
    field: string,
    value: T | null,
    ids: string[],
    note?: string,
    cycle?: string | null,
  ): Fact<T> {
    const unique = [...new Set(ids)];
    unique.forEach((id) =>
      sources.find((s) => s.id === id)?.fields.push(field),
    );
    const cycles = [
      ...new Set(
        unique
          .map((id) => sources.find((s) => s.id === id)?.cycle)
          .filter(Boolean),
      ),
    ];
    const current =
      unique.some(
        (id) => d!.sources.find((s) => s.id === id)?.status === "target-cycle",
      ) &&
      unique.every((id) =>
        ["target-cycle", "general-policy"].includes(
          d!.sources.find((s) => s.id === id)?.status ?? "",
        ),
      );
    return {
      value,
      sourceIds: unique,
      note,
      cycle:
        cycle === undefined
          ? current
            ? "Fall 2027"
            : cycles.length === 1
              ? cycles[0]!
              : null
          : cycle,
    };
  }
  const ids = (items: { sourceIds: string[] }[]) => [
    ...new Set(items.flatMap((x) => x.sourceIds)),
  ];
  const intake = (cycle: string | null) =>
    /^2027[–-](28|2028)( aid year)?$/.test(cycle ?? "") ? "Fall 2027" : cycle;
  const deadlines = d.deadlines.map((t) => ({
    label: `${t.label} · ${t.category}`,
    category: t.category,
    date: t.date,
    cycle: intake(t.cycle),
    kind: t.relative ? ("relative" as const) : ("fixed" as const),
    sourceIds: t.sourceIds,
    note: [
      t.note,
      t.monthDay
        ? `Recurring guidance: ${t.monthDay}; target year unconfirmed.`
        : "",
      t.relative ? `${t.relative.days} days after ${t.relative.event}.` : "",
      t.time,
      t.timezone,
    ]
      .filter(Boolean)
      .join(" "),
  }));
  const firstDate = (category: string) =>
    d.deadlines
      .filter(
        (t) =>
          t.category === category &&
          t.date &&
          intake(t.cycle) === "Fall 2027" &&
          t.sourceIds.every(
            (id) =>
              d.sources.find((s) => s.id === id)?.status === "target-cycle",
          ),
      )
      .sort((a, b) => a.date!.localeCompare(b.date!))[0];
  const admission = firstDate("admission"),
    aid = firstDate("aid");
  const normalizedTest = (name: string) =>
    /IELTS/i.test(name)
      ? "IELTS"
      : /TOEFL/i.test(name)
        ? "TOEFL"
        : /Duolingo/i.test(name)
          ? "Duolingo"
          : name;
  const updated: University = {
    ...u,
    programs: d.programs.length
      ? fact(
          "programs",
          [
            ...new Set([
              ...(u.programs.value ?? []),
              ...d.programs.map((p) => p.category),
            ]),
          ],
          [...u.programs.sourceIds, ...ids(d.programs)],
          d.programs.map((p) => `${p.name} (${p.credential})`).join("; "),
        )
      : u.programs,
    testPolicy: fact("testPolicy", d.testing.text, d.testing.sourceIds),
    satPolicy: fact(
      "satPolicy",
      policies[u.id],
      d.testing.sourceIds,
      d.testing.text,
    ),
    actPolicy: fact(
      "actPolicy",
      policies[u.id],
      d.testing.sourceIds,
      d.testing.text,
    ),
    satMiddle50: fact(
      "satMiddle50",
      d.scores.satComposite
        ? { low: d.scores.satComposite[0], high: d.scores.satComposite[1] }
        : null,
      d.scores.sourceIds,
      d.scores.population + ". " + d.scores.note,
      d.scores.cohort,
    ),
    satMedian: fact(
      "satMedian",
      d.scores.satMedian,
      d.scores.sourceIds,
      d.scores.population,
      d.scores.cohort,
    ),
    englishPolicy: fact("englishPolicy", d.english.text, d.english.sourceIds),
    ielts: fact(
      "ielts",
      d.english.requirement
        ? {
            requirement: d.english.requirement,
            scores: d.english.tests.flatMap((t) =>
              /IELTS/i.test(t.name) && t.score !== null && t.kind !== "accepted"
                ? [
                    {
                      score: t.score,
                      kind: t.kind,
                      comparison: t.comparison ?? "at-least",
                      condition: t.condition,
                    },
                  ]
                : [],
            ),
            noScoreLabel: "No numeric guidance verified",
            detail: d.english.text,
          }
        : null,
      d.english.sourceIds,
    ),
    englishTests: fact(
      "englishTests",
      [...new Set(d.english.tests.map((t) => normalizedTest(t.name)))],
      d.english.sourceIds,
      d.english.text,
    ),
    englishWaiver: fact(
      "englishWaiver",
      d.english.waiver ? true : null,
      d.english.sourceIds,
      d.english.waiver?.rule,
    ),
    englishMinimums: fact(
      "englishMinimums",
      d.english.tests.flatMap((t) =>
        t.score !== null && (t.kind === "minimum" || t.kind === "recommended")
          ? [
              {
                test: normalizedTest(t.name),
                score: t.score,
                kind: t.kind,
                condition: `${t.name} (${t.scale}): ${t.condition}`,
              },
            ]
          : [],
      ),
      d.english.sourceIds,
    ),
    admissionEligibility: fact(
      "admissionEligibility",
      d.route.text,
      d.route.sourceIds,
    ),
    applicationPlatform: fact(
      "applicationPlatform",
      d.route.text,
      d.route.sourceIds,
    ),
    applicationPlans: fact(
      "applicationPlans",
      d.rounds.map((r) => r.name),
      ids(d.rounds),
    ),
    applicationFee: fact("applicationFee", d.fee.amount, d.fee.sourceIds),
    feeWaiver: fact(
      "feeWaiver",
      d.fee.waiver ? true : null,
      d.fee.sourceIds,
      d.fee.waiver,
    ),
    requirements: fact(
      "requirements",
      d.requirements.map((r) => ({
        label: r.label,
        status: r.level,
        condition: r.condition || null,
      })),
      ids(d.requirements),
    ),
    deadlines: fact("deadlines", deadlines, ids(d.deadlines)),
    admissionDeadline: fact(
      "admissionDeadline",
      admission?.date ?? null,
      admission?.sourceIds ?? [],
      admission?.label,
      admission?.cycle ?? null,
    ),
    aidDeadline: fact(
      "aidDeadline",
      aid?.date ?? null,
      aid?.sourceIds ?? [],
      aid?.label,
      aid?.cycle ?? null,
    ),
    aidForms: fact(
      "aidForms",
      d.funding.forms,
      d.funding.sourceIds,
      d.funding.exceptions,
    ),
    internationalAid: fact(
      "internationalAid",
      u.internationalAid.value,
      d.funding.sourceIds,
      d.funding.text,
    ),
    needBlind: fact(
      "needBlind",
      u.needBlind.value,
      d.funding.sourceIds,
      d.funding.exceptions,
    ),
    meetsFullNeed: fact(
      "meetsFullNeed",
      u.meetsFullNeed.value,
      d.funding.sourceIds,
      d.funding.text,
    ),
    annualCost: fact(
      "annualCost",
      d.costs.total,
      d.costs.sourceIds,
      d.costs.exclusions,
      d.costs.year,
    ),
    costCycle: d.costs.year,
    costCurrency: d.costs.currency,
    unknowns: [
      ...d.gaps,
      "Individual award amounts and family contributions require the university's assessment.",
    ],
  };
  // Retain legacy evidence used by unchanged policies; expose current evidence only for its mapped fields.
  updated.sources = [
    ...u.sources,
    ...sources.filter((s) => s.fields.length > 0),
  ];
  return updated;
}
