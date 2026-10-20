import type { AdmissionDeadline, Fact, University } from "@/types/domain";
export const TARGET_INTAKE = "Fall 2027";
export const programTaxonomy = [
  "Computer Science",
  "Artificial Intelligence / Data Science",
  "Mathematics / Statistics",
  "Engineering",
  "Business / Management",
  "Economics",
  "Finance",
  "Natural Sciences",
  "Social Sciences",
  "Humanities",
];
export function normalizeMajor(value: string) {
  return (
    (
      {
        Mathematics: "Mathematics / Statistics",
        Statistics: "Mathematics / Statistics",
        Business: "Business / Management",
        "Data Science": "Artificial Intelligence / Data Science",
        "Engineering Sciences": "Engineering",
        "Mechanical Engineering": "Engineering",
        "Electrical and Computer Engineering": "Engineering",
        "Computer Science and Engineering": "Computer Science",
        English: "Humanities",
        History: "Humanities",
        Biology: "Natural Sciences",
      } as Record<string, string>
    )[value] ?? value
  );
}
export type FieldStatus =
  | "verified_current"
  | "verified_previous_cycle"
  | "official_general"
  | "unverified";
export function fieldStatus(
  field: Fact<unknown>,
  u: University,
  intake = TARGET_INTAKE,
): FieldStatus {
  if (
    field.value === null ||
    !field.sourceIds.length ||
    !field.sourceIds.every((id) =>
      u.sources.some((s) => s.id === id && s.status === "verified"),
    )
  )
    return "unverified";
  if (
    field.cycle === intake ||
    /^(2027)[–\-/](28|2028)$/.test(field.cycle ?? "")
  )
    return "verified_current";
  if (field.cycle && Number(field.cycle.match(/20\d{2}/)?.[0]) < 2027)
    return "verified_previous_cycle";
  return "official_general";
}
export function cycleLabel(field: Fact<unknown>, u: University) {
  const status = fieldStatus(field, u);
  return status === "verified_current"
    ? `Verified for ${field.cycle}`
    : status === "verified_previous_cycle"
      ? `Previous-cycle reference — ${field.cycle}`
      : status === "official_general"
        ? "Official policy · intake not specified"
        : "Not yet verified for Fall 2027";
}
export function verifiedDeadline(
  u: University,
  deadline: AdmissionDeadline,
  intake = TARGET_INTAKE,
) {
  const year = Number(intake.match(/\d{4}/)?.[0]);
  return (
    !!deadline.date &&
    deadline.cycle === intake &&
    deadline.kind !== "relative" &&
    deadline.date >= `${year - 1}-01-01` &&
    deadline.date < `${year}-09-01` &&
    (deadline.sourceIds ?? u.deadlines.sourceIds).length > 0 &&
    (deadline.sourceIds ?? u.deadlines.sourceIds).every((id) =>
      u.sources.some((s) => s.id === id && s.status === "verified"),
    )
  );
}
export function currentDeadlines(u: University, intake = TARGET_INTAKE) {
  return (u.deadlines.value ?? []).filter((d) =>
    verifiedDeadline(u, d, intake),
  );
}
export function nextAdmissionDeadline(
  u: University,
  intake = TARGET_INTAKE,
  today = new Date().toISOString().slice(0, 10),
) {
  return currentDeadlines(u, intake)
    .filter((d) => d.date! >= today && !/aid|scholarship/i.test(d.label))
    .sort((a, b) => a.date!.localeCompare(b.date!))[0];
}
export function englishAdvice(
  u: University,
  test: string,
  score: number | null,
  major = "",
) {
  const scope = u.englishTests.scope;
  if (scope?.purpose === "scholarship")
    return "The available English evidence concerns a scholarship. Verify the separate admission requirements for your degree.";
  if (scope && major && !scope.subjects.includes(normalizeMajor(major)))
    return `The verified English policy is for ${scope.program}. Check the requirements for your chosen program.`;
  if (u.englishTests.value === null)
    return "Accepted English tests need verification. Check the official policy.";
  if (!test)
    return `Accepted evidence includes ${u.englishTests.value.join(", ") || "no verified tests"}. Check whether a test is required for your schooling background.`;
  if (!u.englishTests.value.includes(test))
    return `${test} is not in the verified alternatives. Check other accepted tests and any exemption before deciding whether you can apply.`;
  const minimum = u.englishMinimums.value?.find(
    (m) => m.test === test && m.kind === "minimum",
  );
  if (minimum && score !== null)
    return `${test} is accepted. The published minimum is ${minimum.score} (${minimum.condition}). Compare using the same test version and scale; another test or exemption may apply.`;
  return `${test} is an accepted alternative. ${u.englishWaiver.value === true ? "A conditional exemption may apply. " : ""}A score alone does not establish eligibility or admission.`;
}
