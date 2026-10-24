import { describe, expect, it } from "vitest";
import { dossierSchema, type AdmissionsDossier } from "@/types/admissions";
import {
  emptyState,
  parseStoredData,
  shortlistCSV,
  toggleSaved,
} from "@/lib/storage/state";
import { storageSchema, blankProfile } from "@/types/domain";
import {
  importRequirements,
  requirementsForRound,
  requirementSummary,
} from "@/lib/requirements";
import { addDays, calendarICS, timelineEvents } from "@/lib/calendar";
import { scorePosition, languageContext } from "@/lib/academic-context";
import { countLabel } from "@/lib/format";
const source = {
  id: "official",
  title: "Official guidance",
  url: "https://example.edu/apply",
  checkedAt: "2026-10-20",
  cycle: null,
  status: "general-policy",
  applicability: "International first-year",
};
const fact = { text: "Source-backed guidance.", sourceIds: ["official"] };
const baseRequirement = {
  id: "transcript",
  label: "School transcript",
  level: "Required",
  condition: "All first-year applicants",
  owner: "School",
  stage: "admission",
  rounds: [],
  submission: "School channel",
  due: "By application deadline",
  sourceIds: ["official"],
  reusableKey: "transcript-preparation",
};
const fixture = dossierSchema.parse({
  universityId: "example",
  sources: [source],
  route: fact,
  rounds: [
    { name: "Early Decision", policy: "Binding", sourceIds: ["official"] },
    { name: "Regular Decision", policy: "Nonbinding", sourceIds: ["official"] },
  ],
  fee: {
    amount: 50,
    currency: "USD",
    waiver: "Hardship process",
    sourceIds: ["official"],
  },
  programs: [],
  requirements: [
    baseRequirement,
    {
      ...baseRequirement,
      id: "ed-agreement",
      label: "ED agreement",
      rounds: ["Early Decision"],
    },
    {
      ...baseRequirement,
      id: "translation",
      level: "Conditional",
      condition: "Original is not in English",
    },
  ],
  testing: fact,
  scores: {
    cohort: "Fall 2025",
    population: "Enrolled score submitters",
    satComposite: [1400, 1550],
    satReading: null,
    satMath: null,
    actComposite: [32, 35],
    satMedian: null,
    satSubmissionPercent: 40,
    actSubmissionPercent: 20,
    sourceIds: ["official"],
    note: "Historical",
  },
  english: {
    text: "Conditional",
    tests: [],
    waiver: {
      englishMediumYears: 3,
      nativeEnglish: true,
      rule: "Three years in secondary school",
    },
    sourceIds: ["official"],
  },
  selection: { ...fact, cdsYear: null, factors: [] },
  funding: {
    ...fact,
    forms: "Own form",
    renewal: "Annual",
    exceptions: "Check conditions",
  },
  costs: {
    year: "2026–27",
    currency: "USD",
    total: 60000,
    components: [],
    exclusions: "Travel variable",
    sourceIds: ["official"],
  },
  deadlines: [
    {
      id: "application",
      label: "Apply",
      category: "admission",
      rounds: [],
      date: "2026-11-01",
      monthDay: null,
      cycle: "Fall 2027",
      time: "23:59",
      timezone: "America/New_York",
      relative: null,
      sourceIds: ["official"],
      note: "Target year",
    },
    {
      id: "aid-after-offer",
      label: "Aid",
      category: "aid",
      rounds: [],
      date: null,
      monthDay: null,
      cycle: "Fall 2027",
      time: null,
      timezone: null,
      relative: { event: "admission offer", days: 7 },
      sourceIds: ["official"],
      note: "After admission",
    },
    {
      id: "recurring",
      label: "Recurring only",
      category: "documents",
      rounds: [],
      date: null,
      monthDay: "02-15",
      cycle: null,
      time: null,
      timezone: null,
      relative: null,
      sourceIds: ["official"],
      note: "No year",
    },
  ],
  gaps: [],
});
describe("Sourced requirements and migration", () => {
  it("imports repeatedly without losing progress or old requirement keys", () => {
    const progress = importRequirements(fixture, {
      transcript: { status: "Prepared" },
      "retired-requirement": { status: "In progress" },
    });
    expect(importRequirements(fixture, progress)).toEqual(progress);
    expect(progress.transcript.status).toBe("Prepared");
    expect(progress["retired-requirement"].status).toBe("In progress");
    expect(
      requirementsForRound(fixture, "Regular Decision").some(
        (r) => r.id === "ed-agreement",
      ),
    ).toBe(false);
    expect(requirementsForRound(fixture, "Early Decision")).toHaveLength(3);
  });
  it("does not count preparation or unsupported N/A as sent", () => {
    const p = importRequirements(fixture);
    p.transcript.status = "Prepared";
    p.translation = {
      status: "Not applicable",
      reason: "My transcript is already English.",
    };
    expect(
      requirementSummary(fixture.requirements, p).pending.map((r) => r.id),
    ).toEqual(["transcript", "ed-agreement"]);
    p.transcript = {
      status: "Not applicable",
      reason: "I chose not to send it.",
    };
    expect(
      requirementSummary(fixture.requirements, p).pending.map((r) => r.id),
    ).toContain("transcript");
    p.translation = { status: "Not applicable" };
    expect(
      requirementSummary(fixture.requirements, p).pending.map((r) => r.id),
    ).toContain("translation");
  });
  it("migrates a populated v1 backup and round trips Unicode and identifiers", () => {
    const old = {
      ...toggleSaved(emptyState(), "example"),
      version: 1,
      profile: {
        ...blankProfile,
        citizenship: "Қазақстан",
        grades: "4.8",
        gradingScale: "5.0",
      },
      scenarios: [
        {
          id: "stable",
          name: "家族の計画",
          universityId: "example",
          currency: "USD",
          costs: {
            tuition: 45000,
            fees: 0,
            housing: 10000,
            food: 5000,
            insurance: 0,
            books: 0,
            transportation: 0,
          },
          contribution: 0,
          confirmedAward: 45000,
          hypotheticalAward: 50000,
          createdAt: "2026-10-20T00:00:00Z",
        },
      ],
    };
    old.saved[0] = {
      ...old.saved[0],
      notes: "Әкеммен сөйлесу — 家族",
      deadline: "2026-11-01",
      tasks: [{ id: "old-task", text: "Ask school", done: true }],
    };
    const migrated = parseStoredData(JSON.stringify(old));
    expect(migrated.error).toBeNull();
    expect(migrated.state.version).toBe(2);
    expect(migrated.state.saved[0].notes).toBe(old.saved[0].notes);
    expect(migrated.state.scenarios[0].confirmedAward).toBe(45000);
    expect(migrated.state.profile?.grades).toBe("4.8");
    expect(parseStoredData(JSON.stringify(migrated.state)).state).toEqual(
      migrated.state,
    );
    expect(storageSchema.safeParse({ ...old, version: 99 }).success).toBe(
      false,
    );
  });
  it("rejects broken evidence and missing conditional scope", () => {
    expect(
      dossierSchema.safeParse({
        ...fixture,
        testing: { text: "Missing citation", sourceIds: ["missing"] },
      }).success,
    ).toBe(false);
    expect(
      dossierSchema.safeParse({
        ...fixture,
        requirements: [
          { ...baseRequirement, level: "Conditional", condition: "" },
        ],
      }).success,
    ).toBe(false);
  });
});
describe("Calendar and private exports", () => {
  it("leaves unknown years and relative triggers unresolved, preserves the personal date", () => {
    const s = {
      ...toggleSaved(emptyState(), "example").saved[0],
      deadline: "2026-10-25",
    };
    const events = timelineEvents(s, fixture);
    expect(
      events.find((e) => e.id.endsWith("aid-after-offer"))?.date,
    ).toBeNull();
    expect(events.find((e) => e.id.endsWith("recurring"))?.date).toBeNull();
    expect(events.find((e) => e.category === "personal")?.date).toBe(
      "2026-10-25",
    );
    const triggered = timelineEvents(
      { ...s, triggerDates: { "aid-after-offer": "2026-12-28" } },
      fixture,
    );
    expect(triggered.find((e) => e.id.endsWith("aid-after-offer"))?.date).toBe(
      "2027-01-04",
    );
    expect(s.deadline).toBe("2026-10-25");
  });
  it("exports correct UTC cutoff after DST, exclusive all-day end and stable IDs", () => {
    const s = {
      ...toggleSaved(emptyState(), "example").saved[0],
      deadline: "2026-10-25",
    };
    const events = timelineEvents(s, fixture);
    const ics = calendarICS(events, "2026-10-20T12:00:00.000Z");
    expect(ics).toContain("DTSTART:20261102T045900Z");
    expect(ics).toContain("DTSTART;VALUE=DATE:20261025");
    expect(ics).toContain("DTEND;VALUE=DATE:20261026");
    expect(ics).toContain("UID:example-application@aidmap.local");
    expect(ics).not.toContain("UID:example-aid-after-offer");
    expect(ics).toContain("URL:https://example.edu/apply");
    expect(ics).not.toContain("VALARM");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
  });
  it("escapes calendar text and folds Unicode on byte boundaries", () => {
    const event = {
      ...timelineEvents(
        toggleSaved(emptyState(), "example").saved[0],
        fixture,
      )[0],
      label: "Қазақстан, one; two\nBEGIN:BAD " + "界".repeat(50),
    };
    const ics = calendarICS([event]);
    expect(ics).toContain("\\, one\\; two\\nBEGIN:BAD");
    expect(ics).not.toContain("\r\nBEGIN:BAD");
    for (const line of ics.split("\r\n"))
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    expect(ics).not.toContain("�");
  });
  it("guards spreadsheet formulas with whitespace while retaining non-Latin names", () => {
    const csv = shortlistCSV([
      {
        name: '  =HYPERLINK("bad")',
        country: "Қазақстан",
        status: "+1",
        deadline: null,
      },
    ]);
    expect(csv).toContain('"\'  =HYPERLINK(""bad"")"');
    expect(csv).toContain("Қазақстан");
    expect(csv).toContain('"\'+1"');
  });
});
describe("Context without admissions predictions", () => {
  it("compares only a known published composite and keeps endpoints within", () => {
    expect(scorePosition(1400, [1400, 1550])).toBe("Within");
    expect(scorePosition(1550, [1400, 1550])).toBe("Within");
    expect(scorePosition(1390, [1400, 1550])).toBe("Below");
    expect(scorePosition(1560, [1400, 1550])).toBe("Above");
    expect(scorePosition(1500, null)).toBeNull();
  });
  it("uses university-specific years and leaves nationality insufficient", () => {
    const p = {
      ...blankProfile,
      citizenship: "United Kingdom",
      nativeEnglish: false,
      englishMediumYears: 2,
    };
    expect(languageContext(fixture, p)).toContain("shorter");
    const twoYears = {
      ...fixture,
      english: {
        ...fixture.english,
        waiver: { ...fixture.english.waiver!, englishMediumYears: 2 },
      },
    } as AdmissionsDossier;
    expect(languageContext(twoYears, p)).toContain("may meet");
    expect(
      languageContext(fixture, {
        ...blankProfile,
        citizenship: "United Kingdom",
      }),
    ).toContain("Citizenship alone");
  });
  it("formats zero, one and many consistently", () => {
    expect([0, 1, 2].map((n) => countLabel(n, "policy", "policies"))).toEqual([
      "0 policies",
      "1 policy",
      "2 policies",
    ]);
    expect(countLabel(1, "university", "universities")).toBe("1 university");
    expect(countLabel(1, "scenario")).toBe("1 scenario");
  });
});
