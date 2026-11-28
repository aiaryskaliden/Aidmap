import {
  currentDeadlines,
  fieldStatus,
  normalizeMajor,
} from "@/lib/admissions";
import type {
  ApplicantProfile,
  EvidenceSource,
  Fact,
  University,
} from "@/types/domain";
import type { Activity, EssayDraft } from "@/types/studio";
import type { Language } from "@/lib/advisor/contracts";

export type Copy = [en: string, ru: string, kk: string];
export const tr = (language: Language, copy: Copy) =>
  copy[language === "en" ? 0 : language === "ru" ? 1 : 2];
export const textWords = (text: string) =>
  text.match(/[\p{L}\p{N}]+(?:[’'-][\p{L}\p{N}]+)*/gu) ?? [];

export const activityTiers = ["S", "S−", "A", "A−", "B", "B−", "C", "C−"] as const;
export type ActivityTier = (typeof activityTiers)[number];
export type ActivityReason =
  | "international"
  | "national"
  | "regional"
  | "documented"
  | "sustainedReach"
  | "namedRole"
  | "regularWork"
  | "supportingRecord"
  | "basic"
  | "missingOutcome"
  | "missingContribution"
  | "roleOnly";

export function reviewActivity(
  activity: Activity,
): { tier: ActivityTier; reason: ActivityReason } | null {
  const contribution = activity.action.trim();
  const outcome = activity.impact.trim();
  const role = activity.role.trim();
  const evidence = activity.evidence.trim();
  const hasEvidence = !!evidence && !/^(?:[-–—]+|none|n\/a|нет|жоқ)\.?$/iu.test(evidence);
  if (!contribution && !outcome)
    return role ? { tier: "C−", reason: "roleOnly" } : null;
  if (!outcome) return { tier: "C", reason: "missingOutcome" };
  if (!contribution) return { tier: "C", reason: "missingContribution" };

  if (role && hasEvidence) {
    if (activity.reach === "international")
      return { tier: "S", reason: "international" };
    if (activity.reach === "national")
      return { tier: "S−", reason: "national" };
    if (activity.reach === "regional")
      return { tier: "A", reason: "regional" };
    return { tier: "A−", reason: "documented" };
  }

  const sustained = activity.months >= 3 && activity.hours > 0;
  const broadReach = activity.reach === "regional" || activity.reach === "national" || activity.reach === "international";
  if (role && sustained && broadReach)
    return { tier: "A−", reason: "sustainedReach" };
  if (role) return { tier: "B", reason: "namedRole" };
  if (sustained) return { tier: "B", reason: "regularWork" };
  if (hasEvidence) return { tier: "B", reason: "supportingRecord" };
  return { tier: "B−", reason: "basic" };
}

const action =
  /\b(?:built|designed|led|tested|organised|organized|taught|wrote|measured|repaired|asked|decided|learned|created|started|helped|found|walked|remember|opened|ran|used)\b|(?:созда|постро|решил|обуч|разработ|собрал|написал|провер|организ|руковод|открыл|замети|помог|измер)|(?:құрастыр|жаса|көмектес|шешт|үйрет|өлше|жазд|баста|зертте|байқа|ұйымдастыр)/iu;
const reflection =
  /\b(?:realiz|understood|learn|changed|became|instead|because|noticed|reflect|questioned|taught me)\w*|(?:поня[лв]|осозна|научи|переосмысл|измен|замет|вместо|поэтому|потому|вывод)|(?:түсіндім|үйрендім|байқадым|ойлан|өзгер|сондықтан|себебі|бұрын|маған)/iu;
const scene =
  /\d|\b(?:morning|night|after|first|room|street|wall|door|room|table|hall|lab|classroom|kitchen|bus|spring|winter|corner)\b|(?:утро|вечер|впервые|кабинет|улиц|лаборат|зим|весн|двер|класс)|(?:таңертең|кешке|алғаш|зертхан|бөлме|көшеде|мектепте|қыс|есікт)/iu;
const stop = new Set(
  "about would could should could what which where when from your have been that this their them because with more must describe расскажите опишите какой почему чтобы ваше вашего было этого этих үшін туралы қалай қандай болса кейін дейін өзіңіздің сипаттаңыз туралы".split(
    " ",
  ),
);
const matchingWords = (text: string) => [
  ...new Set(
    textWords(text.toLowerCase())
      .filter((word) => word.length >= 4 && !stop.has(word))
      .map((word) => word.slice(0, 6)),
  ),
];
const sentences = (text: string) =>
  text
    .trim()
    .split(/(?<=[.!?…])[\s\u00a0]+|\n+/u)
    .map((line) => line.trim())
    .filter(Boolean);

export type DraftReview = ReturnType<typeof reviewEssay>;
export function reviewEssay(
  draft: Pick<EssayDraft, "text" | "prompt" | "wordLimit">,
) {
  const words = textWords(draft.text).length;
  if (words < 30) return null;
  const lines = sentences(draft.text);
  const paragraphs = draft.text
    .trim()
    .split(/\n[ \t]*\n/u)
    .filter(Boolean);
  const moment = lines.find((line) => action.test(line) && scene.test(line));
  const insight = lines.find((line) => reflection.test(line));
  const promptTerms = matchingWords(draft.prompt);
  const essayTerms = new Set(matchingWords(draft.text));
  const shared = promptTerms.filter((term) => essayTerms.has(term));
  const long = lines.filter((line) => textWords(line).length > 38).length;
  const metrics = {
    prompt: promptTerms.length
      ? shared.length >= Math.min(3, promptTerms.length)
        ? 2
        : shared.length > 0
          ? 1
          : 0
      : null,
    detail: moment
      ? 2
      : lines.some((line) => action.test(line) || scene.test(line))
        ? 1
        : 0,
    reflection: insight ? (textWords(insight).length >= 9 ? 2 : 1) : 0,
    flow:
      lines.length >= 2 && long <= 1 && (words <= 180 || paragraphs.length > 1)
        ? 2
        : lines.length > 1
          ? 1
          : 0,
    length:
      words > draft.wordLimit
        ? 0
        : words >= Math.min(90, draft.wordLimit * 0.5)
          ? 2
          : 1,
  };
  const values = Object.values(metrics).filter((value) => value !== null);
  const score = Math.max(
    1,
    Math.round(
      (values.reduce((sum, value) => sum + value, 0) / (values.length * 2)) *
        10,
    ),
  );
  return {
    score,
    words,
    metrics,
    moment: moment?.slice(0, 270),
    insight: insight?.slice(0, 270),
    shared: shared.length,
  };
}

export type CvFields = Partial<
  Pick<
    ApplicantProfile,
    "sat" | "act" | "englishTest" | "englishScore" | "grades" | "gradingScale"
  >
>;

export function detectCvFields(text: string): CvFields {
  const sat = Number(
    text.match(
      /\bSAT(?:\s+(?:total|score|composite))?\s*[:–-]?\s*(\d{3,4})(?!\d)\b/i,
    )?.[1],
  );
  const act = Number(
    text.match(
      /\bACT(?:\s+(?:total|score|composite))?\s*[:–-]?\s*(\d{1,2})(?!\d)\b/i,
    )?.[1],
  );
  const ielts = Number(
    text
      .match(
        /\bIELTS(?:\s+Academic)?(?:\s+overall)?\s*[:–-]?\s*(\d(?:[.,][05])?)\b(?![.,]\d)/i,
      )?.[1]
      ?.replace(",", "."),
  );
  const gpa = text.match(
    /\bGPA\s*[:–-]?\s*(\d{1,3}(?:[.,]\d{1,2})?)\s*(?:\/|out of)\s*(4(?:\.0)?|5(?:\.0)?|10|100)(?![\d.])/i,
  );
  const grades = gpa?.[1].replace(",", ".");
  const scale = Number(gpa?.[2]);
  const gradingScale =
    scale === 4 ? "4.0" : scale === 5 ? "5.0" : scale === 10 ? "10" : "100";
  return {
    ...(sat >= 400 && sat <= 1600 ? { sat } : {}),
    ...(act >= 1 && act <= 36 ? { act } : {}),
    ...(ielts >= 0 && ielts <= 9
      ? { englishTest: "IELTS", englishScore: ielts }
      : {}),
    ...(grades && Number(grades) <= scale ? { grades, gradingScale } : {}),
  };
}

export type ReadinessItem = {
  key: "program" | "scores" | "english" | "annual" | "deadline" | "portfolio";
  state: "aligned" | "review" | "unknown";
  message: Copy;
  sources?: EvidenceSource[];
};

export type ApplicantReadinessSchool = Pick<
  University,
  "programs" | "satPolicy" | "satMinimum" | "ielts" | "englishTests" | "annualCost" | "costCurrency" | "costSourceIds" | "sources"
>;

function readinessSources(school: Pick<University, "sources">, ids: string[]) {
  return school.sources
    .filter((s) => ids.includes(s.id) && s.status === "verified")
    .slice(0, 2);
}

export function checkApplicantReadiness(
  school: ApplicantReadinessSchool,
  p: ApplicantProfile | null,
): ReadinessItem[] {
  const entryYear = p?.entryYear ?? 2027;
  const intake = "Fall " + entryYear;
  const appliesToYear = (value: Fact<unknown>) => {
    const sourceYear = value.cycle?.match(/\b20\d{2}\b/)?.[0];
    return !sourceYear || Number(sourceYear) === entryYear;
  };
  const usable = (value: Fact<unknown>) =>
    appliesToYear(value) &&
    ["verified_current", "official_general"].includes(
      fieldStatus(value, school, intake),
    );
  const sources = (ids: string[]) => readinessSources(school, ids);
  const r: ReadinessItem[] = [];
  const major = normalizeMajor(p?.major ?? "");
  const programMatch =
    major &&
    usable(school.programs) &&
    school.programs.value?.some((program) => normalizeMajor(program) === major);
  r.push({
    key: "program",
    state: programMatch ? "aligned" : "unknown",
    message: programMatch
      ? [
          major +
            " appears in the published subject list. Check the exact degree.",
          major + " есть в списке направлений. Сверьте точную программу.",
          major +
            " жарияланған бағыттар тізімінде бар. Нақты бағдарламаны тексеріңіз.",
        ]
      : [
          "Choose a subject and confirm the exact programme on the official site.",
          "Выберите направление и уточните программу на сайте вуза.",
          "Бағытты таңдап, нақты бағдарламаны ресми сайттан тексеріңіз.",
        ],
    sources: sources(school.programs.sourceIds),
  });

  const scopeApplies = (field: Fact<unknown>) =>
    !field.scope ||
    (field.scope.purpose === "admission" &&
      (!field.scope.subjects.length ||
        (major && field.scope.subjects.includes(major))));
  const minimum = school.satMinimum.value;
  const sat = p?.sat ?? null;
  const satSources = sources([
    ...school.satMinimum.sourceIds,
    ...school.satPolicy.sourceIds,
  ]);
  if (
    sat !== null &&
    minimum !== null &&
    usable(school.satMinimum) &&
    scopeApplies(school.satMinimum) &&
    school.satPolicy.value !== "not-accepted"
  ) {
    r.push({
      key: "scores",
      state: sat >= minimum ? "aligned" : "review",
      sources: satSources,
      message: [
        "Your SAT " +
          sat +
          " · published minimum " +
          minimum +
          ". Check route conditions.",
        "Ваш SAT " +
          sat +
          " · опубликованный минимум " +
          minimum +
          ". Сверьте условия вашего трека.",
        "SAT нәтижеңіз " +
          sat +
          " · жарияланған минимум " +
          minimum +
          ". Бағыт шарттарын тексеріңіз.",
      ],
    });
  } else {
    r.push({
      key: "scores",
      state: "unknown",
      sources: satSources,
      message: [
        "Check the test policy and entry qualification for your route. A directly comparable minimum is unavailable.",
        "Сверьте политику тестов и требования к аттестату. Сопоставимый минимум для вашего маршрута неизвестен.",
        "Тестілеу және аттестат талаптарын тексеріңіз. Салыстыруға болатын минимум әзірге белгісіз.",
      ],
    });
  }

  const english = p?.englishScore ?? null;
  // TOEFL thresholds depend on the version and scale. Leave them for manual review.
  const score =
    p?.englishTest === "IELTS" &&
    usable(school.ielts) &&
    scopeApplies(school.ielts)
      ? school.ielts.value?.scores.find(
          (rule) => rule.kind === "minimum" && rule.high === undefined,
        )
      : undefined;
  if (english !== null && score) {
    const enough =
      score.comparison === "above"
        ? english > score.score
        : english >= score.score;
    const threshold =
      (score.comparison === "above" ? "> " : "≥ ") + score.score;
    r.push({
      key: "english",
      state: enough ? "aligned" : "review",
      sources: sources(school.ielts.sourceIds),
      message: [
        "IELTS " +
          english +
          " · listed overall threshold " +
          threshold +
          ". Review " +
          score.condition +
          ".",
        "IELTS " +
          english +
          " · порог общего балла " +
          threshold +
          ". Сверьте условия: " +
          score.condition +
          ".",
        "IELTS " +
          english +
          " · жалпы балл шегі " +
          threshold +
          ". Шарттарды тексеріңіз: " +
          score.condition +
          ".",
      ],
    });
  } else
    r.push({
      key: "english",
      state: "unknown",
      sources: sources([
        ...school.ielts.sourceIds,
        ...school.englishTests.sourceIds,
      ]),
      message: [
        "Verify accepted tests, section minimums and exemptions.",
        "Сверьте допустимые тесты, минимумы по секциям и исключения.",
        "Қабылданатын тесттерді, бөлім минимумдарын және босату шарттарын тексеріңіз.",
      ],
    });

  const annual = school.annualCost.value;
  const budget = p?.budget ?? null;
  const money = (value: number) =>
    school.costCurrency + " " + value.toLocaleString("en-US");
  if (
    budget !== null &&
    p?.currency === school.costCurrency &&
    annual !== null &&
    appliesToYear(school.annualCost) &&
    fieldStatus(school.annualCost, school, intake) === "verified_current"
  ) {
    r.push({
      key: "annual",
      state: annual <= budget ? "aligned" : "review",
      sources: sources(school.annualCost.sourceIds),
      message: [
        money(annual) +
          " published annual cost · " +
          money(budget) +
          " budget before aid.",
        money(annual) +
          " опубликованных годовых расходов · " +
          money(budget) +
          " бюджета до стипендий.",
        money(annual) +
          " жарияланған жылдық шығын · " +
          money(budget) +
          " көмекке дейінгі бюджет.",
      ],
    });
  } else
    r.push({
      key: "annual",
      state: "unknown",
      sources: sources([
        ...school.annualCost.sourceIds,
        ...school.costSourceIds,
      ]),
      message: [
        "A current total in your budget currency is unavailable. Open the official costs and funding sources.",
        "Сопоставимые полные расходы для вашего набора неизвестны. Откройте официальную стоимость и варианты помощи.",
        "Осы қабылдау цикліне бюджет валютасындағы толық баға белгісіз. Оқу бағасы мен қаржыландыруды тексеріңіз.",
      ],
    });

  return r;
}

export function checkReadiness(
  school: University,
  p: ApplicantProfile | null,
  evidence: { essays: number; activities: number },
): ReadinessItem[] {
  const r = checkApplicantReadiness(school, p);
  const intake = "Fall " + (p?.entryYear ?? 2027);
  const sources = (ids: string[]) => readinessSources(school, ids);
  const today = new Date().toISOString().slice(0, 10);
  const deadline = currentDeadlines(school, intake)
    .filter(
      (item) =>
        item.date &&
        (item.category === "admission" ||
          (!item.category && !/aid|scholarship/i.test(item.label))),
    )
    .sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""))
    .find((item) => item.date! >= today);
  r.push({
    key: "deadline",
    state: deadline ? "aligned" : "unknown",
    sources: sources(
      deadline
        ? (deadline.sourceIds ?? school.deadlines.sourceIds)
        : [
            ...school.admissionDeadline.sourceIds,
            ...school.deadlines.sourceIds,
          ],
    ),
    message: deadline
      ? [
          deadline.label + " · " + deadline.date,
          deadline.label + " · " + deadline.date,
          deadline.label + " · " + deadline.date,
        ]
      : [
          "Check the upcoming date for your intake and admission round.",
          "Уточните ближайшую дату вашего цикла и раунда подачи.",
          "Қабылдау циклі мен раундының алдағы мерзімін нақтылаңыз.",
        ],
  });
  r.push({
    key: "portfolio",
    state:
      evidence.essays > 0 && evidence.activities > 0 ? "aligned" : "review",
    message: [
      evidence.essays +
        " drafts and " +
        evidence.activities +
        " activities in your workspace. Check the university’s requirements.",
      "В кабинете " +
        evidence.essays +
        " черн. и " +
        evidence.activities +
        " активн. Сверьте конкретные требования вуза.",
      "Кабинетте " +
        evidence.essays +
        " эссе және " +
        evidence.activities +
        " іс-шара бар. Университет талаптарын тексеріңіз.",
    ],
    sources: sources(school.requirements.sourceIds),
  });
  return r;
}
