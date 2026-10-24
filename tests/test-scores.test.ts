import { describe, expect, it } from "vitest";
import { universities, findUniversity } from "@/data/universities";
import {
  satBenchmark,
  ieltsSummary,
  ieltsComparison,
  ieltsScoreLabel,
} from "@/lib/test-scores";
import { ieltsGuidanceSchema } from "@/types/test-scores";
import { validateUniversities } from "@/lib/validation/universities";
import { evaluateUniversity } from "@/lib/search";

const university = (id: string) => findUniversity(id)!;
describe("sourced test benchmarks", () => {
  it("preserves missing composite statistics instead of adding sections or averaging endpoints", () => {
    expect(satBenchmark(university("harvard")).value).toBe("Not verified");
    expect(university("wesleyan").satMedian.value).toBeNull();
    expect(satBenchmark(university("brown")).label).toContain("Middle 50%");
    expect(university("brown").satMedian.value).toBeNull();
    expect(university("duke").satMiddle50.note).toContain("Admitted students");
  });
  it("keeps minimum and recommended IELTS scores separate", () => {
    expect(ieltsSummary(university("mit"))).toBe(
      "7.0 minimum · 7.5 recommended",
    );
    expect(university("mit").ielts.value?.requirement).toBe("Recommended");
    expect(ieltsSummary(university("yale"))).toContain("typical, not a cutoff");
    expect(ieltsSummary(university("dartmouth"))).toContain(">7.0");
    expect(ieltsSummary(university("williams"))).toContain("7.5–9.0");
    expect(university("bowdoin").ielts.value?.scores).toEqual([]);
    expect(university("bowdoin").ielts.value?.requirement).toBe("Optional");
  });
  it("does not turn an optional test's expected score into a required test", () => {
    expect(university("wesleyan").ielts.value?.requirement).toBe("Recommended");
    expect(ieltsSummary(university("wesleyan"))).toContain("expected minimum");
    expect(ieltsComparison(university("notre-dame"))).toContain(
      "Confirm how this applies",
    );
  });
  it("retains program, route and enrollment scope", () => {
    expect(ieltsComparison(university("amsterdam"))).toContain(
      "BSc Economics and Business Economics only (admission)",
    );
    expect(university("amsterdam").englishTests.scope?.purpose).toBe(
      "scholarship",
    );
    expect(university("bocconi").ielts.scope?.purpose).toBe("enrollment");
    expect(satBenchmark(university("luiss")).field.scope?.program).toContain(
      "Non-EU/Schengen",
    );
    expect(satBenchmark(university("berea")).label).toContain("minimum");
  });
  it("feeds published minimum filters without promoting recommendations or enrollment rules", () => {
    expect(
      evaluateUniversity(university("wellesley"), { minimum: "IELTS" }).state,
    ).toBe("unknown");
    expect(
      evaluateUniversity(university("rice"), { minimum: "IELTS" }).state,
    ).toBe("match");
    expect(
      evaluateUniversity(university("vanderbilt"), {
        minimum: "IELTS",
      }).state,
    ).toBe("mismatch");
    expect(
      evaluateUniversity(university("bocconi"), {
        minimum: "IELTS",
      }).state,
    ).toBe("unknown");
    expect(
      evaluateUniversity(university("amsterdam"), {
        minimum: "IELTS",
        major: "Economics",
      }).state,
    ).toBe("match");
  });
  it("provides honest unknowns for unverified guidance across the catalogue", () => {
    expect(universities).toHaveLength(30);
    for (const u of universities) {
      expect(satBenchmark(u).value).toBeTruthy();
      expect(ieltsSummary(u)).toBeTruthy();
      if (u.satMedian.value !== null && u.satMiddle50.value) {
        expect(u.satMedian.value).toBeGreaterThanOrEqual(
          u.satMiddle50.value.low,
        );
        expect(u.satMedian.value).toBeLessThanOrEqual(u.satMiddle50.value.high);
      }
    }
    expect(ieltsSummary(university("uchicago"))).toContain("not yet verified");
  });
  it("requires source references and rejects invalid IELTS values", () => {
    const bad = structuredClone(university("mit"));
    bad.ielts.sourceIds = [];
    expect(() => validateUniversities([bad])).toThrow(/Missing evidence/);
    const guidance = structuredClone(university("mit").ielts.value!);
    guidance.scores[0].score = 10;
    expect(ieltsGuidanceSchema.safeParse(guidance).success).toBe(false);
    guidance.scores[0].score = 7;
    guidance.scores[0].high = 6;
    expect(ieltsGuidanceSchema.safeParse(guidance).success).toBe(false);
    expect(
      ieltsScoreLabel({
        score: 7,
        kind: "typical",
        comparison: "above",
        condition: "Above seven",
      }).value,
    ).toBe(">7.0");
  });
});
