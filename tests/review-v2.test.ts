import { describe, it, expect } from "vitest";
import {
  universities,
  findUniversity,
  opportunities,
} from "@/data/universities";
import { calculateFunding } from "@/lib/funding/calculate";
import {
  discoverUniversities,
  searchUniversities,
  evaluateUniversity,
  type Filters,
} from "@/lib/search";
import {
  fieldStatus,
  currentDeadlines,
  verifiedDeadline,
  nextAdmissionDeadline,
  englishAdvice,
} from "@/lib/admissions";
import { importOfficialDeadline } from "@/lib/planning";
import {
  emptyState,
  parseStoredData,
  toggleSaved,
  updateSaved,
  shortlistCSV,
} from "@/lib/storage/state";
import {
  blankProfile,
  profileSchema,
  type University,
  type AdmissionDeadline,
} from "@/types/domain";
import { validateUniversities } from "@/lib/validation/universities";
const costs = {
  tuition: 40000,
  fees: 1000,
  housing: 10000,
  food: 5000,
  insurance: 2000,
  books: 1000,
  transportation: 1000,
};
const u = findUniversity("harvard")!;
describe("review calculator regressions", () => {
  it("AM-004: empty contribution keeps costs and remaining known, gap unknown", () => {
    expect(calculateFunding(costs, "USD", null)).toMatchObject({
      total: 60000,
      knownCost: 60000,
      remaining: 60000,
      aboveBudget: null,
      contributionUnknown: true,
      contributionError: null,
      missing: [],
    });
  });
  it("explicit zero contribution produces the full remaining funding gap", () =>
    expect(calculateFunding(costs, "USD", 0).aboveBudget).toBe(60000));
  it.each([-1, NaN, Infinity, 1e15])(
    "AM-005: invalid contribution %s preserves all valid expenses",
    (value) => {
      const r = calculateFunding(costs, "USD", value, {
        amount: 10000,
        currency: "USD",
        kind: "confirmed",
      });
      expect(r).toMatchObject({
        total: 60000,
        remaining: 50000,
        knownCost: 60000,
        missing: [],
        aboveBudget: null,
      });
      expect(r.contributionError).toBeTruthy();
    },
  );
  it("nullable contributions survive scenario backup and old numeric backups still work", () => {
    for (const contribution of [null, 0, 5000]) {
      const state = {
        ...emptyState(),
        scenarios: [
          {
            id: "fictional",
            name: "Synthetic QA",
            universityId: "harvard",
            currency: "USD" as const,
            costs,
            contribution,
            confirmedAward: null,
            hypotheticalAward: 10000,
            createdAt: "2026-10-20T00:00:00.000Z",
          },
        ],
      };
      const restored = parseStoredData(JSON.stringify(state));
      expect(restored.error).toBeNull();
      expect(restored.state).toEqual(state);
    }
  });
});
describe("typed requirements and filter combinations", () => {
  it("SAT required and optional use normalized policy, not misleading prose", () => {
    const fixtures = [
      {
        ...u,
        id: "required",
        satPolicy: { ...u.satPolicy, value: "required" as const },
        testPolicy: {
          ...u.testPolicy,
          value:
            "Optional SAT scores are NOT accepted instead of required testing",
        },
      },
      {
        ...u,
        id: "optional",
        satPolicy: { ...u.satPolicy, value: "optional" as const },
      },
    ];
    expect(
      searchUniversities(fixtures, { test: "optional" }).map((x) => x.id),
    ).toEqual(["optional"]);
    expect(
      searchUniversities(fixtures, { test: "required" }).map((x) => x.id),
    ).toEqual(["required"]);
    expect(
      searchUniversities(fixtures, { test: "optional|required" }),
    ).toHaveLength(2);
  });
  it("unknown SAT records remain inspectable, while known mismatches remain excluded", () => {
    const fixtures = [
      u,
      {
        ...u,
        id: "missing",
        satPolicy: { value: null, sourceIds: [], cycle: null },
      },
      {
        ...u,
        id: "optional",
        satPolicy: { ...u.satPolicy, value: "optional" as const },
      },
    ];
    const result = discoverUniversities(fixtures, {
      test: "required",
      includeUnknown: "yes",
    });
    expect(result.matches.map((x) => x.university.id)).toEqual([u.id]);
    expect(result.unknown.map((x) => x.university.id)).toEqual(["missing"]);
    expect(result.results).toHaveLength(2);
    expect(
      searchUniversities(fixtures, { test: "unknown" }).map((x) => x.id),
    ).toEqual(["missing"]);
  });
  it("AND across groups and OR within groups, including finance vs economics", () => {
    const fixtures = [
      {
        ...u,
        id: "business",
        country: "Italy",
        programs: { ...u.programs, value: ["Business / Management"] },
      },
      {
        ...u,
        id: "econ",
        country: "Italy",
        programs: { ...u.programs, value: ["Economics"] },
      },
      u,
    ];
    expect(
      searchUniversities(fixtures, {
        country: "Italy",
        major: "Business / Management",
      }).map((x) => x.id),
    ).toEqual(["business"]);
    expect(
      searchUniversities(fixtures, {
        country: "Italy",
        major: "Business / Management|Economics",
      }),
    ).toHaveLength(2);
    expect(
      searchUniversities(fixtures, {
        country: "Germany",
        major: "Economics",
        includeUnknown: "yes",
      }),
    ).toHaveLength(0);
  });
  it("distinguishes accepted tests, alternatives, exemptions and unknown data", () => {
    expect(searchUniversities([u], { english: "IELTS" })).toHaveLength(1);
    expect(englishAdvice(u, "IELTS", 1)).not.toMatch(
      /ineligible|not eligible/i,
    );
    expect(englishAdvice(u, "Unknown test", 1)).toMatch(/other accepted tests/);
    const unknown = {
      ...u,
      englishTests: { value: null, sourceIds: [], cycle: null },
    };
    expect(evaluateUniversity(unknown, { english: "IELTS" }).state).toBe(
      "unknown",
    );
    const exempt = { ...u, englishWaiver: { ...u.englishWaiver, value: true } };
    expect(
      searchUniversities([exempt], { english: "waiver|TOEFL" }),
    ).toHaveLength(1);
  });
  it("never reuses scholarship-only English thresholds as admission evidence", () => {
    expect(
      evaluateUniversity(findUniversity("amsterdam")!, { english: "IELTS" })
        .state,
    ).toBe("unknown");
  });
  it("does not apply Computer Science English rules to a different program", () => {
    expect(
      evaluateUniversity(findUniversity("szeged")!, {
        major: "Business / Management",
        english: "IELTS",
      }).state,
    ).toBe("unknown");
    expect(
      evaluateUniversity(findUniversity("szeged")!, {
        major: "Computer Science",
        english: "IELTS",
      }).state,
    ).toBe("match");
  });
  it("citizenship and destination are different; missing citizenship conditions stay unknown", () => {
    const limited = {
      ...u,
      citizenshipEligibility: {
        ...u.citizenshipEligibility,
        value: ["Kazakhstan"],
      },
    };
    expect(
      evaluateUniversity(limited, {
        country: "United States",
        citizenship: "Kazakhstan",
      }).state,
    ).toBe("match");
    expect(evaluateUniversity(limited, { citizenship: "Germany" }).state).toBe(
      "mismatch",
    );
    expect(evaluateUniversity(u, { citizenship: "Kazakhstan" }).state).toBe(
      "unknown",
    );
  });
  it("does not compare costs across currencies or treat unknown cost as zero", () => {
    const euros = {
      ...u,
      costCurrency: "EUR" as const,
      annualCost: { ...u.annualCost, value: 20000 },
    };
    expect(
      searchUniversities([euros], { cost: "30000", currency: "USD" }),
    ).toHaveLength(0);
    expect(
      searchUniversities([euros], { cost: "30000", currency: "EUR" }),
    ).toHaveLength(1);
    expect(
      evaluateUniversity(
        { ...u, annualCost: { value: null, sourceIds: [], cycle: null } },
        { cost: "30000" },
      ).state,
    ).toBe("unknown");
  });
  it("does not use medians or middle-50% statistics as eligibility thresholds", () => {
    const stats = {
      ...u,
      satMedian: { ...u.satPolicy, value: 1550 },
      satMiddle50: { ...u.satPolicy, value: { low: 1500, high: 1580 } },
    };
    expect(
      evaluateUniversity(stats, { test: "required", sat: "1000" }).state,
    ).toBe("match");
  });
  it("home discovery categories contain actual relevant undergraduate evidence", () => {
    const categories: Filters[] = [
      { region: "Europe" },
      { major: "Business / Management" },
      { aid: "tuition" },
    ];
    for (const filters of categories)
      expect(searchUniversities(universities, filters).length).toBeGreaterThan(
        0,
      );
    expect(
      searchUniversities(universities, { major: "Business / Management" }).some(
        (x) => x.id === "harvard",
      ),
    ).toBe(false);
    expect(
      searchUniversities(universities, { major: "Business / Management" }).some(
        (x) => x.id === "mit",
      ),
    ).toBe(true);
  });
  it("does not manufacture all-expense Hungarian awards from partial living stipends", () => {
    for (const id of ["debrecen", "szeged", "corvinus-budapest"])
      expect(findUniversity(id)!.fullCost.value).not.toBe(true);
  });
  it("does not present scholarship English thresholds as admission minimums", () => {
    const amsterdam = findUniversity("amsterdam")!;
    expect(evaluateUniversity(amsterdam, { minimum: "IELTS" }).state).toBe(
      "unknown",
    );
    expect(englishAdvice(amsterdam, "IELTS", 7, "Economics")).toContain(
      "scholarship",
    );
    expect(
      englishAdvice(
        findUniversity("szeged")!,
        "IELTS",
        7,
        "Business / Management",
      ),
    ).toContain("chosen program");
  });
  it("selects upcoming admission dates and respects the requested intake", () => {
    const bocconi = findUniversity("bocconi")!;
    expect(
      nextAdmissionDeadline(bocconi, "Fall 2027", "2026-10-20")?.date,
    ).toBe("2027-01-26");
    expect(
      nextAdmissionDeadline(bocconi, "Fall 2027", "2027-01-27"),
    ).toBeUndefined();
    expect(
      nextAdmissionDeadline(bocconi, "Fall 2028", "2026-10-20"),
    ).toBeUndefined();
  });
});
// Synthetic dates exercise cycle boundaries; these are not university claims.
const current: AdmissionDeadline = {
  label: "Synthetic Regular Decision",
  date: "2027-01-05",
  cycle: "Fall 2027",
  kind: "fixed",
  note: "Fictional test fixture",
  sourceIds: ["fixture-source"],
};
function deadlineUniversity(deadlines: AdmissionDeadline[]): University {
  return {
    ...u,
    deadlines: {
      value: deadlines,
      cycle: "Fall 2027",
      sourceIds: ["fixture-source"],
    },
    sources: [
      ...u.sources,
      {
        id: "fixture-source",
        title: "Synthetic fixture",
        url: "https://example.edu/admission",
        checkedAt: "2026-10-20",
        cycle: "Fall 2027",
        type: "official",
        status: "verified",
        fields: ["deadlines", "annualCost"],
      },
    ],
  };
}
describe("intakes, academic years and safe planning", () => {
  it("distinguishes current, previous-cycle, yearless and unverified fields", () => {
    const fixture = deadlineUniversity([current]);
    expect(fieldStatus(fixture.deadlines, fixture)).toBe("verified_current");
    expect(
      fieldStatus({ ...fixture.deadlines, cycle: "Fall 2026" }, fixture),
    ).toBe("verified_previous_cycle");
    expect(fieldStatus({ ...fixture.deadlines, cycle: null }, fixture)).toBe(
      "official_general",
    );
    expect(fieldStatus({ ...fixture.deadlines, value: null }, fixture)).toBe(
      "unverified",
    );
    expect(
      fieldStatus({ ...fixture.annualCost, cycle: "2026–27" }, fixture),
    ).toBe("verified_previous_cycle");
    expect(
      fieldStatus({ ...fixture.annualCost, cycle: "2027–28" }, fixture),
    ).toBe("verified_current");
  });
  it("only correct-cycle dates enter upcoming deadline lists and date filters", () => {
    const historical = { ...current, date: "2026-01-05", cycle: "Fall 2026" };
    const yearless = { ...current, date: null, cycle: null };
    const fixture = deadlineUniversity([historical, yearless, current]);
    expect(currentDeadlines(fixture)).toEqual([current]);
    expect(
      searchUniversities([fixture], {
        from: "2027-01-01",
        deadline: "2027-02-01",
      }),
    ).toHaveLength(1);
    expect(
      evaluateUniversity(deadlineUniversity([historical]), {
        deadline: "2027-02-01",
      }).state,
    ).toBe("unknown");
  });
  it.each([
    { ...current, date: "2026-01-05", cycle: "Fall 2026" },
    { ...current, cycle: null },
    { ...current, date: null, cycle: null },
    { ...current, kind: "relative" as const },
  ])("rejects non-actionable source dates", (d) => {
    const fixture = deadlineUniversity([d]);
    expect(verifiedDeadline(fixture, d)).toBe(false);
    expect(() =>
      importOfficialDeadline(
        emptyState(),
        fixture,
        d,
        "Fall 2027",
        "2026-10-20",
      ),
    ).toThrow();
  });
  it("imports confirmed current dates with sources and survives export/refresh", () => {
    const fixture = deadlineUniversity([current]);
    const state = importOfficialDeadline(
      emptyState(),
      fixture,
      current,
      "Fall 2027",
      "2026-10-20",
    );
    expect(state.saved[0]).toMatchObject({
      deadline: "2027-01-05",
      deadlineSource: { cycle: "Fall 2027", kind: "fixed" },
    });
    expect(parseStoredData(JSON.stringify(state)).state).toEqual(state);
    expect(() =>
      importOfficialDeadline(
        state,
        fixture,
        current,
        "Fall 2027",
        "2027-02-01",
      ),
    ).toThrow();
  });
  it("rejects conflicting current dates and undated cost years", () => {
    expect(() =>
      validateUniversities([
        deadlineUniversity([current, { ...current, date: "2027-01-06" }]),
      ]),
    ).toThrow(/Conflicting deadlines/);
    expect(() =>
      validateUniversities([
        { ...u, annualCost: { ...u.annualCost, cycle: null } },
      ]),
    ).toThrow(/academic year/);
  });
  it("U01 custom date plus task status survives a complete local serialization", () => {
    const state = updateSaved(toggleSaved(emptyState(), "harvard"), "harvard", {
      deadline: "2026-12-17",
      status: "Preparing",
      notes: "Fictional test notes",
      tasks: [
        {
          id: "qa",
          text: "Review transcript",
          done: true,
          kind: "research",
          sourceUrl: "https://example.edu/admission",
        },
      ],
    });
    expect(parseStoredData(JSON.stringify(state)).state).toEqual(state);
    const csv = shortlistCSV([
      {
        name: u.name,
        country: u.country,
        status: state.saved[0].status,
        deadline: state.saved[0].deadline,
      },
    ]);
    expect(csv).toContain('"2026-12-17"');
    expect(csv).toContain('"Preparing"');
  });
  it("supports both explicit TOEFL scales without conversion", () => {
    expect(
      profileSchema.safeParse({
        ...blankProfile,
        englishTest: "TOEFL",
        englishScore: 5.5,
        toeflScale: "6",
      }).success,
    ).toBe(true);
    expect(
      profileSchema.safeParse({
        ...blankProfile,
        englishTest: "TOEFL",
        englishScore: 100,
        toeflScale: "6",
      }).success,
    ).toBe(false);
    expect(
      profileSchema.safeParse({
        ...blankProfile,
        englishTest: "TOEFL",
        englishScore: 100,
      }).success,
    ).toBe(true);
  });
  it("scholarship references identify their source and undergraduate level", () => {
    for (const o of opportunities) {
      expect(o.source.url).toMatch(/^https:\/\//);
      expect(o.level).toBe("Undergraduate");
      expect(o.source.checkedAt).toMatch(/^2026-/);
    }
  });
});
