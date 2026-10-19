import { describe, expect, it } from "vitest";
import { calculateFunding, hypotheticalFunding } from "@/lib/funding/calculate";
import {
  emptyState,
  parseStoredData,
  toggleCompare,
  toggleSaved,
  updateSaved,
  shortlistCSV,
} from "@/lib/storage/state";
import { matchUniversity } from "@/lib/matching/match";
import { validateUniversities } from "@/lib/validation/universities";
import { searchUniversities } from "@/lib/search";
import { universities } from "@/data/universities";
import { money } from "@/lib/utils";
import {
  blankProfile,
  profileSchema,
  storageSchema,
  type CostItems,
} from "@/types/domain";
const costs: CostItems = {
  tuition: 50000,
  fees: 1000,
  housing: 10000,
  food: 5000,
  insurance: 2000,
  books: 1500,
  transportation: 1500,
};

describe("funding arithmetic and uncertainty", () => {
  it("handles decimal costs without floating point funding gaps", () => {
    const cents = {
      tuition: 0.1,
      fees: 0.2,
      housing: 0,
      food: 0,
      insurance: 0,
      books: 0,
      transportation: 0,
    };
    expect(calculateFunding(cents, "USD", 0.3)).toMatchObject({
      total: 0.3,
      remaining: 0.3,
      aboveBudget: 0,
    });
    expect(hypotheticalFunding(cents, "USD", 0.1, 0.2)).toMatchObject({
      remaining: 0.1,
      aboveBudget: 0,
    });
    expect(money(10.25)).toBe("$10.25");
  });
  it("rejects enormous values rather than overflowing totals", () => {
    expect(() =>
      calculateFunding({ ...costs, tuition: 1e308 }, "USD", 0),
    ).toThrow();
    expect(() => hypotheticalFunding(costs, "USD", 0, 1e308)).toThrow();
  });
  it("totals all expenses and calculates the budget gap", () => {
    const r = calculateFunding(costs, "USD", 5000, {
      amount: 50000,
      currency: "USD",
      kind: "confirmed",
    });
    expect(r).toMatchObject({
      total: 71000,
      remaining: 21000,
      aboveBudget: 16000,
      confirmedAward: 50000,
    });
  });
  it("does not confuse a full tuition award with full attendance costs", () => {
    expect(
      calculateFunding(costs, "USD", 0, {
        amount: costs.tuition!,
        currency: "USD",
        kind: "confirmed",
      }).remaining,
    ).toBe(21000);
  });
  it("does not subtract eligibility or a hypothetical award in the base calculation", () => {
    for (const kind of ["eligibility", "hypothetical"] as const)
      expect(
        calculateFunding(costs, "USD", 5000, {
          amount: 50000,
          currency: "USD",
          kind,
        }).remaining,
      ).toBe(71000);
  });
  it("keeps unknown awards visibly unknown", () => {
    expect(calculateFunding(costs, "USD", 5000)).toMatchObject({
      confirmedAward: 0,
      awardUnknown: true,
      remaining: 71000,
    });
  });
  it("makes an incomplete total unknown even with a large award", () => {
    expect(
      calculateFunding({ ...costs, insurance: null }, "USD", 10000, {
        amount: 100000,
        currency: "USD",
        kind: "confirmed",
      }),
    ).toMatchObject({
      total: null,
      remaining: null,
      aboveBudget: null,
      knownCost: 69000,
      missing: ["insurance"],
    });
  });
  it("handles an explicit zero cost without treating it as missing", () => {
    expect(calculateFunding({ ...costs, insurance: 0 }, "USD", 0).total).toBe(
      69000,
    );
  });
  it("calculates a hypothetical scenario separately", () => {
    expect(hypotheticalFunding(costs, "USD", 5000, 50000)).toMatchObject({
      remaining: 21000,
      aboveBudget: 16000,
    });
    expect(calculateFunding(costs, "USD", 5000).remaining).toBe(71000);
  });
  it("rejects currency mismatches", () => {
    expect(() =>
      calculateFunding(costs, "USD", 0, {
        amount: 1000,
        currency: "EUR",
        kind: "confirmed",
      }),
    ).toThrow(/Currency mismatch/);
  });
  it("rejects negative or non-finite inputs", () => {
    for (const n of [-1, NaN, Infinity]) {
      expect(() =>
        calculateFunding({ ...costs, tuition: n }, "USD", 0),
      ).toThrow();
      expect(() => calculateFunding(costs, "USD", n)).toThrow();
      expect(() => hypotheticalFunding(costs, "USD", 0, n)).toThrow();
    }
  });
  it("caps remaining cost at zero and reports excess funding", () => {
    expect(
      calculateFunding(costs, "USD", 5000, {
        amount: 80000,
        currency: "USD",
        kind: "confirmed",
      }),
    ).toMatchObject({ remaining: 0, aboveBudget: 0, excessAward: 9000 });
  });
});
describe("discovery and explainable research matches", () => {
  it("searches names, cities and subjects case-insensitively", () => {
    expect(
      searchUniversities(universities, { q: "CAMBRIDGE" }).map((u) => u.id),
    ).toEqual(["harvard", "mit"]);
    expect(
      searchUniversities(universities, { q: "computer science" }).length,
    ).toBeGreaterThan(0);
  });
  it("combines subject, geography, aid and text filters", () => {
    expect(
      searchUniversities(universities, {
        q: "Princeton",
        region: "United States",
        major: "Computer Science",
        aid: "international",
        test: "optional",
      }).map((u) => u.id),
    ).toEqual(["princeton"]);
  });
  it("excludes unavailable and unknown international aid", () => {
    const u = universities[0];
    const fixtures = [
      u,
      {
        ...u,
        id: "unknown",
        internationalAid: { ...u.internationalAid, value: null },
      },
      {
        ...u,
        id: "no",
        internationalAid: { ...u.internationalAid, value: false },
      },
    ];
    expect(
      searchUniversities(fixtures, { aid: "international" }).map((x) => x.id),
    ).toEqual([u.id]);
  });
  it("does not label full-need policies as full-tuition awards", () => {
    expect(searchUniversities(universities, { aid: "tuition" })).toHaveLength(
      0,
    );
  });
  it("does not treat unknown cost or deadline as matching a numeric filter", () => {
    expect(searchUniversities(universities, { cost: "1000000" })).toHaveLength(
      0,
    );
    expect(
      searchUniversities(universities, { deadline: "2027-12-31" }),
    ).toHaveLength(0);
  });
  it("honors Europe without inventing records", () => {
    expect(searchUniversities(universities, { region: "Europe" })).toHaveLength(
      0,
    );
  });
  it("explains country, interest, policy, and affordability limitations", () => {
    const p = {
      ...blankProfile,
      major: "Computer Science",
      targetCountries: ["United States"],
      budget: 5000,
    };
    const reasons = matchUniversity(universities[0], p);
    expect(reasons.map((r) => r.category)).toEqual(
      expect.arrayContaining([
        "Country preference",
        "Academic interest match",
        "Funding policy match",
        "Affordability not established",
      ]),
    );
    expect(JSON.stringify(reasons)).not.toMatch(/\d+%/);
  });
  it("does not change matching with grades or test scores", () => {
    expect(
      matchUniversity(universities[0], {
        ...blankProfile,
        sat: 1600,
        grades: "4.0",
        gradingScale: "4.0",
      }),
    ).toEqual(matchUniversity(universities[0], { ...blankProfile, sat: 800 }));
  });
  it("flags merit mismatch and missing policy", () => {
    const u = universities.find((u) => u.meritAid.value === false)!;
    expect(
      matchUniversity(u, { ...blankProfile, aidPreference: "Merit" }).some(
        (r) => r.category === "Funding preference mismatch",
      ),
    ).toBe(true);
    expect(
      matchUniversity(
        { ...u, internationalAid: { ...u.internationalAid, value: null } },
        blankProfile,
      ).some((r) => r.category === "Funding information unavailable"),
    ).toBe(true);
  });
});
describe("local persistence and application workflow", () => {
  it("round-trips a saved shortlist and comparison", () => {
    let s = toggleSaved(emptyState(), "harvard");
    s = toggleCompare(s, "harvard");
    expect(parseStoredData(JSON.stringify(s)).state).toEqual(s);
  });
  it("unsaves without mutating its previous state", () => {
    const initial = toggleSaved(emptyState(), "yale");
    const next = toggleSaved(initial, "yale");
    expect(next.saved).toHaveLength(0);
    expect(initial.saved).toHaveLength(1);
  });
  it("limits comparison to four and permits replacing after removal", () => {
    let s = emptyState();
    for (const u of universities.slice(0, 4)) s = toggleCompare(s, u.id);
    expect(() => toggleCompare(s, "fifth")).toThrow(/four/);
    s = toggleCompare(s, s.compare[0]);
    expect(toggleCompare(s, "fifth").compare).toHaveLength(4);
  });
  it("persists task additions, completion, edits, deletions, and application status", () => {
    let s = toggleSaved(emptyState(), "harvard");
    s = updateSaved(s, "harvard", {
      tasks: [{ id: "t1", text: "Check requirements", done: false }],
      status: "Preparing",
    });
    s = updateSaved(s, "harvard", {
      tasks: [{ id: "t1", text: "Check aid requirements", done: true }],
    });
    const restored = parseStoredData(JSON.stringify(s)).state;
    expect(restored.saved[0]).toMatchObject({
      status: "Preparing",
      tasks: [{ id: "t1", text: "Check aid requirements", done: true }],
    });
    expect(
      updateSaved(restored, "harvard", { tasks: [] }).saved[0].tasks,
    ).toHaveLength(0);
  });
  it("returns safe defaults and an error for corrupt or unsupported data", () => {
    for (const raw of [
      "not-json",
      '{"version":2}',
      JSON.stringify({ ...emptyState(), compare: ["a", "a"] }),
    ]) {
      const parsed = parseStoredData(raw);
      expect(parsed.error).toBeTruthy();
      expect(parsed.state).toEqual(emptyState());
    }
  });
  it("does not flag a new empty browser as corruption", () => {
    expect(parseStoredData(null).error).toBeNull();
  });
  it("rejects duplicate task IDs in imports", () => {
    const s = toggleSaved(emptyState(), "harvard");
    s.saved[0].tasks = [
      { id: "x", text: "one", done: false },
      { id: "x", text: "two", done: false },
    ];
    expect(storageSchema.safeParse(s).success).toBe(false);
  });
  it("escapes CSV quotes, newlines and spreadsheet formula prefixes", () => {
    const csv = shortlistCSV([
      {
        name: '=HYPERLINK("bad")',
        country: "US",
        status: "Interested",
        deadline: null,
      },
    ]);
    expect(csv).toContain('"\'=HYPERLINK(""bad"")"');
  });
});
describe("source-backed data integrity and profile validation", () => {
  it("validates eight records with traceable evidence", () => {
    expect(validateUniversities(universities)).toHaveLength(8);
  });
  it("rejects duplicate universities", () => {
    expect(() =>
      validateUniversities([...universities, universities[0]]),
    ).toThrow(/Duplicate/);
  });
  it("rejects facts without evidence", () => {
    expect(() =>
      validateUniversities([
        {
          ...universities[0],
          internationalAid: { value: true, sourceIds: [], cycle: null },
        },
      ]),
    ).toThrow(/Missing evidence/);
  });
  it("rejects unsupported field-source relationships", () => {
    const u = structuredClone(universities[0]);
    u.sources = u.sources.map((s) => ({ ...s, fields: ["unrelated"] }));
    expect(() => validateUniversities([u])).toThrow(/does not support/);
  });
  it("rejects negative costs", () => {
    expect(() =>
      validateUniversities([
        { ...universities[0], costs: { ...costs, tuition: -1 } },
      ]),
    ).toThrow();
  });
  it("requires cycle and evidence for numeric costs", () => {
    expect(() => validateUniversities([{ ...universities[0], costs }])).toThrow(
      /cycle and evidence/,
    );
  });
  it("does not infer costs or admission dates from aid dates", () => {
    for (const u of universities) {
      expect(u.admissionDeadline.value).toBeNull();
      expect(Object.values(u.costs).every((x) => x === null)).toBe(true);
    }
  });
  it("validates English test and school-grade scale without conversion", () => {
    expect(
      profileSchema.safeParse({
        ...blankProfile,
        englishTest: "IELTS",
        englishScore: 10,
      }).success,
    ).toBe(false);
    expect(
      profileSchema.safeParse({
        ...blankProfile,
        gradingScale: "5.0",
        grades: "4.8",
      }).success,
    ).toBe(true);
    expect(
      profileSchema.safeParse({
        ...blankProfile,
        gradingScale: "4.0",
        grades: "4.8",
      }).success,
    ).toBe(false);
  });
});
