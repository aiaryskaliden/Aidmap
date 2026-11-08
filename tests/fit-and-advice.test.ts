import { describe, expect, it } from "vitest";
import { assessUniversityFit } from "@/lib/matching/fit";
import { applicationAdvice } from "@/lib/matching/advice";
import { findUniversity } from "@/data/universities";
import { blankProfile } from "@/types/domain";

describe("evidence-based applicant fit", () => {
  it("does not display an admission percentage without verified profile evidence", () => {
    const u = findUniversity("cuhk-shenzhen")!;
    expect(assessUniversityFit(u, null).score).toBeNull();
    expect(assessUniversityFit(u, { ...blankProfile, isDemo: true }).score).toBeNull();
  });

  it("compares only supported fields, and explains missing evidence", () => {
    const u = findUniversity("cuhk-shenzhen")!;
    const result = assessUniversityFit(u, {
      ...blankProfile,
      major: "Computer Science",
      targetCountries: ["China"],
      sat: 1540,
      englishTest: "IELTS",
      englishScore: 6.5,
      aidPreference: "Merit",
    });
    expect(result.score).not.toBeNull();
    expect(result.coverage).toBeLessThan(100); // The SAT route has no universal published cutoff
    expect(result.signals.some((s) => s.label === "SAT evidence" && s.status === "check")).toBe(true);
    expect(result.signals.some((s) => s.label === "English minimum" && s.status === "match")).toBe(true);
  });

  it("marks a below-minimum English score as a mismatch, not a rejection", () => {
    const u = findUniversity("mbzuai")!;
    const result = assessUniversityFit(u, {
      ...blankProfile,
      major: "Artificial Intelligence / Data Science",
      targetCountries: ["United Arab Emirates"],
      englishTest: "IELTS",
      englishScore: 5.5,
      aidPreference: "Merit",
    });
    expect(result.signals.some((s) => s.label === "English minimum" && s.status === "mismatch")).toBe(true);
    expect(result.nextSteps.some((x) => x.includes("retake"))).toBe(true);
  });

  it("does not treat scholarship-only English evidence as admission evidence", () => {
    const u = findUniversity("nazarbayev-university")!;
    const result = assessUniversityFit(u, {
      ...blankProfile,
      major: "Computer Science",
      targetCountries: ["Kazakhstan"],
      englishTest: "IELTS",
      englishScore: 6,
    });
    expect(result.signals.some((s) => s.label === "English requirements" && s.status === "check")).toBe(true);
  });

  it("advises on real project evidence and trustworthy documentation", () => {
    const tips = applicationAdvice(blankProfile, []);
    expect(tips.some((a) => a.id === "cv" && a.explanation.includes("verifiable"))).toBe(true);
    expect(tips.some((a) => a.id === "shortlist")).toBe(true);
  });
});
