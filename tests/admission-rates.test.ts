import { describe, expect, it } from "vitest";
import { findUniversity, universities } from "@/data/universities";
import {
  formatAdmissionRate,
  getAdmissionRate,
  ratePercentage,
} from "@/lib/admission-rates";
import { conversation } from "@/lib/advisor/dialogue";
import { evaluateUniversity, searchUniversities } from "@/lib/search";

describe("source-backed acceptance rates", () => {
  it("computes a rate from first-year admits and applicants and keeps the intake", () => {
    const harvard = getAdmissionRate("harvard")!;
    expect(harvard).toMatchObject({
      year: 2026,
      applicants: 55104,
      admitted: 2037,
    });
    expect(formatAdmissionRate(harvard)).toBe("3.7%");
    expect(getAdmissionRate("not-a-university")).toBeUndefined();
  });

  it("sorts verified rates before unknown and respects the numeric ceiling", () => {
    const results = searchUniversities(universities, {
      sort: "acceptance",
      maxAdmitRate: "10",
    });
    const percentages = results.map((item) =>
      ratePercentage(getAdmissionRate(item.id)!),
    );
    expect(percentages.length).toBeGreaterThan(3);
    expect(percentages).toEqual([...percentages].sort((a, b) => a - b));
    expect(Math.max(...percentages)).toBeLessThanOrEqual(10);
    expect(
      evaluateUniversity(findUniversity("aalto-university")!, {
        maxAdmitRate: "10",
      }).state,
    ).toBe("unknown");
  });

  it("answers directly in Russian and carries the official source", () => {
    const { dialogue, result } = conversation({
      language: "ru",
      question: "Какая доля принятых в Гарвард?",
    });
    expect(dialogue.focus).toBe("acceptance");
    expect(dialogue.message).toContain("3,7");
    expect(dialogue.message).toContain("Осень 2026");
    expect(result?.evidence).toEqual([
      expect.objectContaining({
        url: "https://college.harvard.edu/admissions/admissions-statistics",
      }),
    ]);
  });

  it("handles a follow-up in Kazakh without treating readiness as probability", () => {
    const previous = {
      intent: "eligibility",
      ids: ["princeton"],
      focus: "ielts",
    } as const;
    const rate = conversation({
      language: "kk",
      question: "Ал қабылдау пайызы ше?",
      previous: { ...previous, ids: [...previous.ids] },
    });
    expect(rate.dialogue.message).toMatch(/Princeton University.*Күз 2026/);
    const advice = conversation({
      language: "ru",
      question: "Какие у меня шансы поступить в MIT с SAT 1550?",
    });
    expect(advice.dialogue.focus).toBe("readiness");
    expect(advice.dialogue.message).not.toContain("%");
  });
});
