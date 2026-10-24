import type { University } from "@/types/domain";
import type { IeltsGuidance } from "@/types/test-scores";

export function satPolicyLabel(u: University) {
  return u.satPolicy.value === null
    ? "Policy not yet verified"
    : {
        required: "SAT or ACT required",
        optional: "SAT / ACT optional",
        flexible: "Alternative tests accepted",
        "not-accepted": "SAT not accepted",
      }[u.satPolicy.value];
}

export function satBenchmark(u: University) {
  if (u.satMedian.value !== null)
    return {
      value: String(u.satMedian.value),
      label: "Median · 50th percentile",
      field: u.satMedian,
    };
  if (u.satMiddle50.value)
    return {
      value: `${u.satMiddle50.value.low}–${u.satMiddle50.value.high}`,
      label: "Middle 50% · not a minimum",
      field: u.satMiddle50,
    };
  if (u.satMinimum.value !== null)
    return {
      value: String(u.satMinimum.value),
      label: "Published minimum · route conditions apply",
      field: u.satMinimum,
    };
  return {
    value: "Not verified",
    label: "Composite median unavailable",
    field: u.satMedian,
  };
}

export function ieltsScoreLabel(s: IeltsGuidance["scores"][number]) {
  const value = `${s.comparison === "above" ? ">" : ""}${s.score.toFixed(1)}${s.high === undefined ? "" : `–${s.high.toFixed(1)}`}`;
  const kind = {
    minimum: "minimum",
    recommended: "recommended",
    typical: "typical, not a cutoff",
    expected: "expected minimum",
  }[s.kind];
  return { value, label: kind };
}

export function ieltsSummary(u: University) {
  if (!u.ielts.value) return "Score and requirement not yet verified";
  return u.ielts.value.scores.length
    ? u.ielts.value.scores
        .map((s) => {
          const v = ieltsScoreLabel(s);
          return `${v.value} ${v.label}`;
        })
        .join(" · ")
    : u.ielts.value.noScoreLabel;
}

export function satComparison(u: University) {
  const b = satBenchmark(u);
  return `${b.value} · ${b.label}${b.field.scope ? ` · ${b.field.scope.program} only (${b.field.scope.purpose})` : ""}${b.field.cycle ? ` · ${b.field.cycle}` : ""}${b.field.note ? `. ${b.field.note}` : ""}`;
}

export function ieltsComparison(u: University) {
  return [
    ieltsSummary(u),
    u.ielts.value ? `English evidence: ${u.ielts.value.requirement}` : "",
    u.ielts.cycle ?? "",
    u.ielts.scope
      ? `${u.ielts.scope.program} only (${u.ielts.scope.purpose})`
      : "",
    ...(u.ielts.value?.scores.map((s) => s.condition) ?? []),
  ]
    .filter(Boolean)
    .join(". ");
}
