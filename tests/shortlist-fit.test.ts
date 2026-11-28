import { describe, expect, it } from "vitest";
import { findUniversity } from "@/data/universities";
import { blankProfile, type University } from "@/types/domain";
import { shortlistFit, shortlistFitSchool } from "@/lib/studio/shortlist-fit";

const university = (id: string) => findUniversity(id)!;
const applicant = { ...blankProfile, major: "Computer Science", sat: 1480 };

function qualifiedSchool(id = "university-of-kansas"): University {
  const existing = university(id);
  const current = { cycle: "Fall 2027", sourceIds: [existing.sources[0].id] };
  return {
    ...existing,
    programs: { ...current, value: ["Computer Science"] },
    satPolicy: { ...current, value: "required" },
    satMinimum: { ...current, value: 1300 },
    annualCost: { ...current, value: 60_000 },
    costCurrency: "USD",
  };
}

describe("My List evidence", () => {
  it("keeps low schoolwide acceptance and profile checks separate", () => {
    const fit = shortlistFit(shortlistFitSchool(university("mit")), null);
    expect(fit).toMatchObject({
      suggestedBand: "reach",
      checked: 0,
      aligned: 0,
      total: 4,
      rate: { year: 2026 },
    });
  });

  it.each(["university-of-edinburgh", "sciences-po"])(
    "preserves the scope of published rate context at %s",
    (id) => {
      const fit = shortlistFit(
        shortlistFitSchool(qualifiedSchool(id)),
        applicant,
      );
      expect(fit).toMatchObject({
        suggestedBand: "unsure",
        checked: 2,
        aligned: 2,
      });
      expect(fit.rate?.scopeNote).toBeTruthy();
    },
  );

  it("suggests a target from a matching discipline, test and current budget", () => {
    const fit = shortlistFit(shortlistFitSchool(qualifiedSchool()), {
      ...applicant,
      budget: 70_000,
    });
    expect(fit).toMatchObject({
      suggestedBand: "target",
      aligned: 3,
      checked: 3,
      total: 4,
    });
  });

  it("surfaces below-minimum scores and unresolved funding", () => {
    const school = shortlistFitSchool(qualifiedSchool());
    expect(shortlistFit(school, { ...applicant, sat: 1260 })).toMatchObject({
      suggestedBand: "unsure",
      checked: 2,
      aligned: 1,
    });
    const future = shortlistFit(school, {
      ...applicant,
      entryYear: 2028,
      budget: 70_000,
    });
    expect(future.suggestedBand).toBe("unsure");
    expect(
      shortlistFit(school, { ...applicant, budget: 70_000, currency: "KZT" })
        .reason[0],
    ).toContain("funding");
  });

  it("uses only a current test policy with a recent verified historical range", () => {
    const applicantSchool = {
      ...qualifiedSchool(),
      id: "fixture-without-published-rate",
      satMiddle50: {
        value: { low: 1450, high: 1550 },
        cycle: "Fall 2025",
        sourceIds: [qualifiedSchool().sources[0].id],
      },
    };
    const fit = shortlistFitSchool(applicantSchool);
    expect(shortlistFit(fit, { ...applicant, sat: 1400 }).suggestedBand).toBe(
      "reach",
    );
    expect(
      shortlistFit(fit, { ...applicant, sat: 1400, act: 34 }).suggestedBand,
    ).toBe("unsure");
    const oldPolicy = {
      ...fit,
      satPolicy: { ...fit.satPolicy, cycle: "Fall 2025" },
    };
    expect(
      shortlistFit(oldPolicy, { ...applicant, sat: 1400 }).suggestedBand,
    ).toBe("unsure");
  });
});
