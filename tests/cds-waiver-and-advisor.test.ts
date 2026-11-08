import { describe, expect, it } from "vitest";
import { cdsSAT2025, researchedSATContext, satBandText } from "@/data/cds-sat-2025";
import { findUniversity } from "@/data/universities";
import { blankProfile, profileSchema } from "@/types/domain";
import { applicationAdvice } from "@/lib/matching/advice";
import { assessUniversityFit } from "@/lib/matching/fit";

describe("SAT score research and honest profile guidance", () => {
  it("keeps the published 25th, median, and 75th order", () => {
    for (const entry of Object.values(cdsSAT2025)) {
      expect(entry.p25).toBeLessThanOrEqual(entry.p50);
      expect(entry.p50).toBeLessThanOrEqual(entry.p75);
      expect(entry.source).toMatch(/^https:\/\//);
    }
  });

  it("uses the official 2025 source for MIT, Princeton and Dartmouth", () => {
    expect(researchedSATContext(findUniversity("mit")!)?.p50).toBe(1550);
    expect(researchedSATContext(findUniversity("princeton")!)?.p50).toBe(1530);
    expect(researchedSATContext(findUniversity("dartmouth")!)?.p50).toBe(1520);
  });

  it("compares a score to the historical cohort without claiming admission", () => {
    expect(satBandText(1540, 1440, 1520, 1550)).toContain("middle 50%");
    expect(satBandText(1510, 1520, 1550, 1570)).toContain("Below");
    expect(satBandText(1580, 1520, 1550, 1570)).toContain("Above");
  });

  it("can store optional SAT Math without rejecting old saved profiles", () => {
    expect(profileSchema.safeParse(blankProfile).success).toBe(true);
    expect(profileSchema.safeParse({ ...blankProfile, sat: 1540, satMath: 790 }).success).toBe(true);
    expect(profileSchema.safeParse({ ...blankProfile, sat: 1540, satMath: 810 }).success).toBe(false);
  });

  it("only claims potential MBZUAI screening waiver when both SAT scores meet the published numbers", () => {
    const school = findUniversity("mbzuai")!;
    const fit = assessUniversityFit(school, { ...blankProfile, sat: 1540, satMath: 790 });
    expect(fit.signals.every((s) => !s.detail.includes("guarantee"))).toBe(true);
    const advice = applicationAdvice({ ...blankProfile, sat: 1540, satMath: 790 }, [school]);
    expect(advice.some((a) => a.id === "mbzuai-waiver" && a.explanation.includes("possible"))).toBe(true);
    const other = applicationAdvice({ ...blankProfile, sat: 1540, satMath: 730 }, [school]);
    expect(other.find((a) => a.id === "mbzuai-waiver")?.explanation).toContain("1400+");
  });
});
