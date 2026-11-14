import type { University } from "@/types/domain";

/**
 * Official 2025 enrolled first-year SAT score profiles (CDS 2025–26, C9).
 * These are historical percentiles among score-submitters, NOT admissions thresholds.
 */
export const cdsSAT2025: Record<
  string,
  { p25: number; p50: number; p75: number; source: string; cohort: string }
> = {
  mit: {
    p25: 1520,
    p50: 1550,
    p75: 1570,
    source: "https://ir.mit.edu/projects/2025-26-common-data-set/",
    cohort: "Fall 2025 enrolled SAT submitters",
  },
  princeton: {
    p25: 1490,
    p50: 1530,
    p75: 1560,
    source: "https://ir.princeton.edu/sites/g/files/toruqf2041/files/documents/CDS_2526_Princeton_v2.pdf",
    cohort: "Fall 2025 enrolled SAT submitters",
  },
  dartmouth: {
    p25: 1440,
    p50: 1520,
    p75: 1550,
    source: "https://www.dartmouth.edu/oir/pdfs/cds_2025-26.pdf",
    cohort: "Fall 2025 enrolled SAT submitters",
  },
};

export function researchedSATContext(university: University) {
  const latest = cdsSAT2025[university.id];
  if (latest) return latest;
  const middle = university.satMiddle50.value;
  if (!middle) return null;
  const ids = university.satMiddle50.sourceIds;
  const source = university.sources.find((item) => ids.includes(item.id));
  return {
    p25: middle.low,
    p50: university.satMedian.value,
    p75: middle.high,
    source: source?.url ?? university.website,
    cohort: university.satMiddle50.cycle || "Historical enrolled-score context",
  };
}

export function satBandText(
  score: number,
  p25: number,
  p50: number | null,
  p75: number,
) {
  if (score < p25) return "Below the reported 25th percentile";
  if (p50 !== null && score < p50) return "Within the middle 50%, below the median";
  if (p50 !== null && score === p50) return "At the reported median";
  if (score <= p75) return "Within the middle 50%, above the median if reported";
  return "Above the reported 75th percentile";
}
