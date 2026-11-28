import { describe, expect, it, vi } from "vitest";
import { findUniversity } from "@/data/universities";
import { conversation } from "@/lib/advisor/dialogue";
import { answerLanguage } from "@/lib/advisor/language";
import {
  allowCoaching,
  coachingContext,
  generateCoaching,
  groqProvider,
  modelDefaults,
} from "@/lib/advisor/provider";
import {
  checkReadiness,
  detectCvFields,
  reviewActivity,
  reviewEssay,
} from "@/lib/studio/reviews";
import { blankProfile, storageSchema } from "@/types/domain";
import { emptyState } from "@/lib/storage/state";
import { emptyStudio, type Activity } from "@/types/studio";

describe("application studio", () => {
  it("keeps old backups valid and preserves draft data in new backups", () => {
    const old = emptyState();
    expect(storageSchema.parse(old).studio).toBeUndefined();
    const next = storageSchema.parse({
      ...old,
      studio: {
        ...emptyStudio,
        name: "Taylor",
        cv: { fileName: "cv.txt", text: "SAT 1450" },
      },
    });
    expect(next.studio?.cv).toEqual({ fileName: "cv.txt", text: "SAT 1450" });
  });

  it("preserves recognition classifications and accepts earlier entries without them", () => {
    const oldHonor = {
      id: "award",
      title: "Robotics medal",
      context: "City robotics cup",
      date: "2025-11",
      description: "Won the team prize.",
    };
    const achievement = {
      ...oldHonor,
      id: "project",
      levels: ["city", "regional"],
      grades: ["11", "12", "postgraduate"],
    };
    const state = {
      ...emptyState(),
      studio: {
        ...emptyStudio,
        honors: [oldHonor],
        achievements: [achievement],
      },
    };
    const restored = storageSchema.parse(JSON.parse(JSON.stringify(state)));
    expect(restored.studio?.honors).toEqual([oldHonor]);
    expect(restored.studio?.achievements).toEqual([achievement]);
  });

  it("extracts labelled CV scores without treating SAT Math or test scales as totals", () => {
    expect(
      detectCvFields(
        "SAT Math 770\nSAT total: 1490\nIELTS Academic: 7,5\nGPA 4.3/5",
      ),
    ).toEqual({
      sat: 1490,
      englishTest: "IELTS",
      englishScore: 7.5,
      grades: "4.3",
      gradingScale: "5.0",
    });
    expect(detectCvFields("SAT Math 770\nGPA 6.0/5\nIELTS 10")).toEqual({});
    expect(detectCvFields("SAT 1490. IELTS 7.5.")).toMatchObject({ englishScore: 7.5 });
    expect(detectCvFields("IELTS 7,4.")).toEqual({});
  });

  it("estimates activity tiers from the contribution, outcome and reach", () => {
    const base: Activity = {
      id: "test",
      title: "Coding",
      category: "project",
      months: 0,
      hours: 0,
      role: "",
      action: "",
      impact: "",
      evidence: "",
    };
    const detailed: Activity = {
      ...base,
      role: "Project lead",
      months: 8,
      hours: 3,
      action:
        "Designed the interface and wrote a guide the team could use to onboard new classmates.",
      impact: "Twenty participants contributed, and 12 completed projects.",
      evidence: "Workshop guide and attendance record.",
    };
    expect(reviewActivity(base)).toBeNull();
    expect(reviewActivity({ ...base, role: detailed.role })?.tier).toBe("C−");
    expect(reviewActivity({ ...base, action: detailed.action })?.tier).toBe(
      "C",
    );
    expect(
      reviewActivity({
        ...base,
        action: detailed.action,
        impact: detailed.impact,
      })?.tier,
    ).toBe("B−");
    expect(reviewActivity({ ...detailed, evidence: "" })?.tier).toBe("B");
    expect(reviewActivity(detailed)?.tier).toBe("A−");
    expect(reviewActivity({ ...detailed, category: "research" })?.tier).toBe(
      "A−",
    );
    expect(reviewActivity({ ...detailed, reach: "regional" })?.tier).toBe("A");
    expect(reviewActivity({ ...detailed, reach: "national" })?.tier).toBe("S−");
    expect(reviewActivity({ ...detailed, reach: "international" })).toEqual({
      tier: "S",
      reason: "international",
    });
    expect(
      reviewActivity({ ...detailed, reach: "international", evidence: "none" })
        ?.tier,
    ).toBe("A−");
    expect(
      reviewActivity({ ...detailed, reach: "international", impact: "" })?.tier,
    ).toBe("C");
  });

  it("quotes actual evidence from a draft and flags an exceeded word limit", () => {
    const text =
      "In the lab on Monday, I built a working prototype with a borrowed motor. I realized that I needed to listen before choosing a solution, because every teammate had noticed a different problem. We opened the door to another group and used their questions to rewrite the instructions.";
    const review = reviewEssay({
      prompt: "Describe a prototype and an important problem",
      text,
      wordLimit: 40,
    });
    expect(review?.metrics.length).toBe(0);
    expect(review?.moment).toContain("I built a working prototype");
    expect(review?.insight).toContain("I realized");
    expect(
      reviewEssay({ prompt: "Topic", text: "Too short", wordLimit: 250 }),
    ).toBeNull();
  });

  it("shows criteria and sources without a probability or past-cycle cost claim", () => {
    const school = findUniversity("mit")!;
    const assessment = checkReadiness(
      school,
      { ...blankProfile, major: "Computer Science", sat: 1500, budget: 90_000 },
      { essays: 1, activities: 1 },
    );
    expect(assessment.find((row) => row.key === "program")?.state).toBe(
      "aligned",
    );
    expect(assessment.find((row) => row.key === "annual")?.state).toBe(
      "unknown",
    );
    expect(
      assessment.find((row) => row.key === "program")?.sources?.length,
    ).toBeGreaterThan(0);
    expect(JSON.stringify(assessment)).not.toMatch(/%\s*(?:chance|шанс)/i);
  });

  it("does not treat a 2027 cost as current for a future entry year", () => {
    const school = findUniversity("mit")!;
    const current = {
      ...school,
      annualCost: { ...school.annualCost, cycle: "2027–28" },
    };
    const p = { ...blankProfile, budget: 150_000 };
    expect(
      checkReadiness(current, p, { essays: 0, activities: 0 }).find(
        (item) => item.key === "annual",
      )?.state,
    ).toBe("aligned");
    expect(
      checkReadiness(
        current,
        { ...p, entryYear: 2028 },
        { essays: 0, activities: 0 },
      ).find((item) => item.key === "annual")?.state,
    ).toBe("unknown");
  });
});

describe("advisor conversation", () => {
  it("recognizes each language and explicit response directions", () => {
    expect(answerLanguage("Какой дедлайн у MIT?", "en")).toBe("ru");
    expect(answerLanguage("MIT үшін қандай IELTS балы керек?", "ru")).toBe(
      "kk",
    );
    expect(answerLanguage("How much do they charge?", "kk")).toBe("en");
    expect(answerLanguage("MIT IELTS. Отвечай на казахском.", "en")).toBe("kk");
  });
  it("responds to a greeting without generic university results", () => {
    const answer = conversation({ question: "Привет!", language: "ru" });
    expect(answer.dialogue.kind).toBe("welcome");
    expect(answer.result.cards).toHaveLength(0);
    expect(answer.dialogue.message).toContain("Привет");
  });
  it("answers a different topic and keeps the school for a follow-up", () => {
    const dates = conversation({
      question: "Какие дедлайны у Гарварда?",
      language: "ru",
    });
    expect(dates.result.cards.map(({ id }) => id)).toEqual(["harvard"]);
    const english = conversation({
      question: "А IELTS?",
      language: "ru",
      previous: {
        intent: dates.result.intent,
        ids: ["harvard"],
        focus: dates.dialogue.focus,
      },
    });
    expect(english.result.cards.map(({ id }) => id)).toEqual(["harvard"]);
    expect(english.dialogue.focus).toBe("ielts");
    expect(english.dialogue.message).toContain("IELTS");
    expect(english.dialogue.message).not.toEqual(dates.dialogue.message);
  });
  it("clarifies a question without a university and understands a changed destination", () => {
    expect(
      conversation({ question: "Какой IELTS нужен?", language: "ru" }).dialogue
        .kind,
    ).toBe("clarify");
    const latest = conversation({
      question: "А в Германии?",
      language: "ru",
      previous: { intent: "search", ids: ["mit"] },
    });
    expect(latest.result.cards.length).toBeGreaterThan(0);
    expect(
      latest.result.cards.every((card) => card.country === "Germany"),
    ).toBe(true);
  });
  it("keeps model coaching in the right language and removes direct contact from synthetic context", () => {
    const response = conversation({
      question: "Compare MIT and Princeton",
      language: "en",
    });
    const context = coachingContext(
      "Compare those schools. Demo email learner@example.test",
      "en",
      response.dialogue,
      response.result,
    );
    expect(context).not.toContain("learner@example.test");
    expect(
      allowCoaching(
        JSON.stringify({
          advice:
            "Check which application round gives you time to prepare your evidence.",
        }),
        "en",
      ),
    ).toContain("Check which");
    expect(
      allowCoaching(
        JSON.stringify({ advice: "Your chance of admission is 24 percent." }),
        "en",
      ),
    ).toBeNull();
    expect(
      allowCoaching(
        JSON.stringify({
          advice: "Проверьте, в каком раунде вы успеете подготовить материалы.",
        }),
        "kk",
      ),
    ).toBeNull();
  });

  it("gets real coaching text through the primary Groq transport when a demo is configured", async () => {
    const text =
      "Check the application round that gives you time to finish your essay and ask for feedback.";
    const http = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({
        choices: [{ message: { content: JSON.stringify({ advice: text }) } }],
      }),
    );
    const reserve = vi.fn(async () => true);
    const input = {
      question: "Compare MIT and Princeton",
      language: "en" as const,
    };
    const { dialogue, result } = conversation(input);
    await expect(
      generateCoaching({
        provider: groqProvider("synthetic-test-key", http),
        result,
        dialogue,
        ...input,
        signal: new AbortController().signal,
        reserve,
        cooldown: async () => {},
      }),
    ).resolves.toBe(text);
    const body = JSON.parse(String(http.mock.calls[0][1]?.body));
    expect(body.model).toBe(process.env.GROQ_MODEL || modelDefaults[0]);
    expect(reserve).toHaveBeenCalledTimes(1);
  });
});
