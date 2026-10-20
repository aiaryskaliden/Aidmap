import type { University } from "@/types/domain";
import {
  currentDeadlines,
  fieldStatus,
  normalizeMajor,
  nextAdmissionDeadline,
  TARGET_INTAKE,
} from "@/lib/admissions";
export type Filters = Record<string, string>;
export type MatchState = "match" | "mismatch" | "unknown";
export const selectedValues = (value?: string) =>
  value ? value.split("|").filter(Boolean) : [];
const is = (value: unknown, expected: unknown): MatchState =>
  value == null ? "unknown" : value === expected ? "match" : "mismatch";
const any = (states: MatchState[]): MatchState =>
  states.includes("match")
    ? "match"
    : states.includes("unknown")
      ? "unknown"
      : "mismatch";
export function evaluateUniversity(u: University, f: Filters) {
  const groups: { label: string; state: MatchState }[] = [];
  const group = (
    key: string,
    label: string,
    test: (value: string) => MatchState,
  ) => {
    const selected = selectedValues(f[key]);
    if (selected.length) groups.push({ label, state: any(selected.map(test)) });
  };
  const q = (f.q || "").toLowerCase().trim();
  if (q)
    groups.push({
      label: "Search",
      state: [
        u.name,
        u.shortName,
        u.country,
        u.city,
        u.state,
        ...(u.programs.value ?? []),
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
        ? "match"
        : "mismatch",
    });
  group("region", "Region", (v) => is(u.region, v));
  group("country", "Country", (v) => is(u.country, v));
  group("city", "City", (v) => is(u.city, v));
  group("type", "Institution type", (v) => is(u.type, v));
  group("degree", "Degree", (v) => is(u.degree, v));
  group("major", "Subject", (v) =>
    u.programs.value === null
      ? "unknown"
      : is(
          u.programs.value.map(normalizeMajor).includes(normalizeMajor(v)),
          true,
        ),
  );
  group("aid", "Funding", (v) => {
    const value = (
      {
        international: u.internationalAid.value,
        need: u.meetsFullNeed.value,
        merit: u.meritAid.value,
        tuition: u.fullTuition.value,
        "full-cost": u.fullCost.value,
      } as Record<string, boolean | null>
    )[v];
    return v === "unknown"
      ? is(u.internationalAid.value === null && u.meritAid.value === null, true)
      : is(value, true);
  });
  group("test", "SAT policy", (v) =>
    v === "unknown"
      ? is(u.satPolicy.value === null, true)
      : is(u.satPolicy.value, v),
  );
  group("act", "ACT policy", (v) =>
    v === "unknown"
      ? is(u.actPolicy.value === null, true)
      : is(u.actPolicy.value, v),
  );
  group("english", "English evidence", (v) => {
    const scope = u.englishTests.scope;
    if (
      scope?.purpose === "scholarship" ||
      (scope &&
        f.major &&
        !selectedValues(f.major).some((m) =>
          scope.subjects.includes(normalizeMajor(m)),
        ))
    )
      return v === "unknown" ? "match" : "unknown";
    if (v === "unknown") return is(u.englishTests.value === null, true);
    if (v === "verified") return is(u.englishPolicy.value !== null, true);
    if (v === "waiver") return is(u.englishWaiver.value, true);
    return u.englishTests.value === null
      ? "unknown"
      : is(u.englishTests.value.includes(v), true);
  });
  group("minimum", "Published English minimum", (v) =>
    u.englishMinimums.scope?.purpose === "scholarship" ||
    (u.englishMinimums.scope &&
      f.major &&
      !selectedValues(f.major).some((m) =>
        u.englishMinimums.scope!.subjects.includes(normalizeMajor(m)),
      )) ||
    u.englishMinimums.value === null
      ? "unknown"
      : is(
          u.englishMinimums.value.some(
            (m) => m.test === v && m.kind === "minimum",
          ),
          true,
        ),
  );
  group("waiver", "Application fee waiver", () => is(u.feeWaiver.value, true));
  group("platform", "Application platform", (v) =>
    u.applicationPlatform.value === null
      ? "unknown"
      : is(
          u.applicationPlatform.value.toLowerCase().includes(v.toLowerCase()),
          true,
        ),
  );
  group("plan", "Application round", (v) =>
    u.applicationPlans.value === null
      ? "unknown"
      : is(u.applicationPlans.value.includes(v), true),
  );
  group("citizenship", "Citizenship conditions", (v) =>
    u.citizenshipEligibility.value === null
      ? "unknown"
      : is(
          u.citizenshipEligibility.value.includes(v) ||
            u.citizenshipEligibility.value.includes("All"),
          true,
        ),
  );
  if (f.intake && f.intake !== TARGET_INTAKE)
    groups.push({ label: "Target intake", state: "unknown" });
  if (f.deadline || f.from) {
    const dates = currentDeadlines(u, f.intake || TARGET_INTAKE).filter(
      (d) => !/aid|scholarship/i.test(d.label),
    );
    groups.push({
      label: "Admission deadline",
      state: !dates.length
        ? "unknown"
        : is(
            dates.some(
              (d) =>
                (!f.from || d.date! >= f.from) &&
                (!f.deadline || d.date! <= f.deadline),
            ),
            true,
          ),
    });
  }
  if (f.cost) {
    const total = u.annualCost.value;
    groups.push({
      label: "Annual cost",
      state:
        total === null
          ? "unknown"
          : u.costCurrency !== (f.currency || "USD")
            ? "mismatch"
            : is(total <= Number(f.cost), true),
    });
  }
  group("quality", "Verification", (v) =>
    v === "verified"
      ? is(
          u.sources.some((s) => s.status === "verified"),
          true,
        )
      : v === "current"
        ? is(
            [
              u.satPolicy,
              u.actPolicy,
              u.applicationPlatform,
              u.admissionEligibility,
            ].some((x) => fieldStatus(x, u) === "verified_current") ||
              currentDeadlines(u).length > 0,
            true,
          )
        : v === "unknown"
          ? is(u.internationalAid.value === null, true)
          : is(
              [u.satPolicy, u.annualCost, u.deadlines].some(
                (x) => fieldStatus(x, u) !== "verified_current",
              ),
              true,
            ),
  );
  const state: MatchState = groups.some((g) => g.state === "mismatch")
    ? "mismatch"
    : groups.some((g) => g.state === "unknown")
      ? "unknown"
      : "match";
  return {
    university: u,
    state,
    unknowns: groups.filter((g) => g.state === "unknown").map((g) => g.label),
  };
}
export function discoverUniversities(universities: University[], f: Filters) {
  const order = (
    a: ReturnType<typeof evaluateUniversity>,
    b: ReturnType<typeof evaluateUniversity>,
  ) =>
    f.sort === "name-desc"
      ? b.university.name.localeCompare(a.university.name)
      : f.sort === "deadline"
        ? (
            nextAdmissionDeadline(a.university, f.intake || TARGET_INTAKE)
              ?.date ?? "9999"
          ).localeCompare(
            nextAdmissionDeadline(b.university, f.intake || TARGET_INTAKE)
              ?.date ?? "9999",
          )
        : a.university.name.localeCompare(b.university.name);
  const evaluated = universities.map((u) => evaluateUniversity(u, f));
  const matches = evaluated.filter((x) => x.state === "match").sort(order);
  const unknown = evaluated.filter((x) => x.state === "unknown").sort(order);
  return {
    matches,
    unknown,
    results: [...matches, ...(f.includeUnknown === "yes" ? unknown : [])],
  };
}
export function searchUniversities(universities: University[], f: Filters) {
  return discoverUniversities(universities, f).results.map((x) => x.university);
}
