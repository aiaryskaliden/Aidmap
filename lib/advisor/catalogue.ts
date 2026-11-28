import {
  opportunities,
  universities,
  findUniversity,
} from "@/data/universities";
import {
  currentDeadlines,
  fieldStatus,
  normalizeMajor,
  programTaxonomy,
  verifiedDeadline,
  TARGET_INTAKE,
} from "@/lib/admissions";
import {
  formatAdmissionCycle,
  formatAdmissionRate,
  getAdmissionRate,
} from "@/lib/admission-rates";
import type { EvidenceSource, Fact, University } from "@/types/domain";
import type {
  Action,
  AdvisorCard,
  AdvisorFact,
  AdvisorInput,
  AdvisorResult,
  Evidence,
  Funding,
  FocusArea,
  Intent,
} from "./contracts";
import { label } from "./copy";

const norm = (v: string) =>
  v
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
const has = (value: string, word: string) =>
  (" " + value + " ").includes(" " + word + " ");
const intentPatterns: [Intent, RegExp][] = [
  ["compare", /compar|versus|\bvs\b|сравн|сопостав|салыстыр/],
  [
    "acceptance",
    /acceptance rate|admit rate|admission rate|процент (?:при[её]ма|принят|поступив)|дол[яю] принятых|қабылдау (?:үлесі|пайызы)/,
  ],
  [
    "roadmap",
    /roadmap|strategy|step by step|стратег|дорожн|план подач|жол карт|жоспар/,
  ],
  [
    "shortlist",
    /shortlist|recommend|best fit|target|safety|подбор|подбер|рекоменд|шорт.?лист|ірікт|ұсын/,
  ],
  ["timeline", /deadline|timeline|when|дедлайн|срок|когда|мерзім|қашан/],
  ["documents", /document|checklist|transcript|документ|чек.?лист|құжат/],
  [
    "funding",
    /scholarship|full ride|full tuition|full cost|financial aid|funding|стипенди|грант|шәкіртақы|қаржылан|тегін/,
  ],
  [
    "cost",
    /affordab|budget|cheap|tuition|cost|expense|стоим|бюджет|цен|недорог|доступн|шығын|арзан|қолжетім|ақысы/,
  ],
  [
    "eligibility",
    /eligib|qualif|\bsat\b|\bielts\b|\bgpa\b|requirement|поступ|требован|балл|қабылда|талап/,
  ],
];
const majorPatterns: [string, RegExp][] = [
  [
    "Computer Science",
    /computer science|\bcs\b|компьютерн.*наук|информат|компьютерлік ғылым/,
  ],
  [
    "Artificial Intelligence / Data Science",
    /data science|artificial intelligence|\bai\b|искусственн.*интеллект|наук.*данн|жасанды интеллект|деректер ғылым/,
  ],
  ["Engineering", /engineer|инженер|инжинир/],
  ["Mathematics / Statistics", /mathemat|statistic|математик|статистик/],
  ["Business / Management", /business|management|бизнес|менеджмент/],
  ["Economics", /economics|экономик/],
];
const countryAliases: Record<string, string[]> = {
  "United States": ["usa", "us", "сша", "ақш", "америке", "америка"],
  "United Kingdom": ["uk", "britain", "великобрит", "британи", "ұлыбрит"],
  Germany: ["герман", "германи", "неміс"],
  Canada: ["канад"],
  Kazakhstan: ["казахстан", "қазақстан"],
  Singapore: ["сингапур"],
  Japan: ["япон", "жапон"],
  Netherlands: ["нидерланд", "голланди"],
  Australia: ["австрали"],
  "South Korea": ["коре", "оңтүстік коре"],
  China: ["китай", "китае", "қытай"],
  Italy: ["итали"],
  Qatar: ["катар", "қатар"],
  "United Arab Emirates": ["uae", "оаэ", "әмірлі"],
  Switzerland: ["швейцар"],
};
const schoolAliases: Record<string, string[]> = {
  harvard: ["гарвард", "гарварда", "гарварде", "гарвардқа", "һарвард"],
  mit: ["массачусетский технологический институт", "мит", "митте", "митке"],
  princeton: ["принстон", "принстона", "принстоне", "принстонда"],
  yale: ["йель", "йеля", "йеле", "йельский университет", "йельге"],
  dartmouth: ["дартмут", "дартмута", "дартмуте"],
  "notre-dame": ["нот дам", "нотре дам", "нотр дам"],
  duke: ["дьюк", "дьюка", "дьюке"],
  "nazarbayev-university": [
    "назарбаев университет",
    "назарбаев университеті",
    "назарбаев университете",
    "назарбаев университета",
    "назарбаев университетіне",
    "nu",
  ],
  "university-of-toronto": [
    "торонтский университет",
    "университет торонто",
    "торонто",
  ],
  "university-of-waterloo": ["ватерлоо", "уотерлу", "университет ватерлоо"],
  "national-university-of-singapore": [
    "национальный университет сингапура",
    "сингапурский национальный университет",
  ],
  "aalto-university": ["аалто", "университет аалто"],
  mbzuai: ["мбзуай", "мбзуи"],
  kaist: ["каист", "кайст"],
  bocconi: ["боккони", "университет боккони"],
};
const nameIndex = universities
  .flatMap((u) =>
    [
      ...new Set(
        [
          u.name,
          u.shortName,
          u.id,
          u.initials,
          ...(schoolAliases[u.id] ?? []),
        ].map(norm),
      ),
    ]
      .filter(
        (name) =>
          (name.length >= 3 || schoolAliases[u.id]?.includes(name)) &&
          name !== norm(u.country),
      )
      .map((name) => ({ name, id: u.id })),
  )
  .sort((a, b) => b.name.length - a.name.length);
const countries = [...new Set(universities.map((u) => u.country))].sort();
export const advisorOptions = { countries, majors: programTaxonomy };
const awardsBySchool = Map.groupBy(
  opportunities,
  (award) => award.universityId,
);
const plans: Record<Intent, Action[]> = {
  acceptance: [],
  search: ["program", "qualification", "cost"],
  shortlist: ["program", "qualification", "tests", "cost", "funding"],
  compare: ["program", "qualification", "cost", "funding", "timeline"],
  eligibility: ["qualification", "tests", "documents", "apply"],
  documents: ["documents", "tests", "apply"],
  timeline: ["timeline", "documents", "funding", "apply"],
  roadmap: [
    "qualification",
    "timeline",
    "tests",
    "documents",
    "funding",
    "apply",
  ],
  cost: ["cost", "funding", "timeline"],
  funding: ["funding", "cost", "timeline", "documents"],
};
export const actionFields: Record<Action, string[]> = {
  program: ["program"],
  qualification: ["eligibility", "sat", "ielts"],
  tests: ["sat", "ielts", "english", "scoreReports"],
  documents: ["documents"],
  cost: ["cost", "tuition"],
  funding: ["aidDeadline", "aidForms"],
  timeline: ["admissionDeadline", "aidDeadline"],
  apply: ["application"],
};
const fields: Record<Intent, string[]> = {
  acceptance: ["acceptance"],
  search: ["program", "cost", "tuition", "admissionDeadline"],
  shortlist: [
    "program",
    "eligibility",
    "sat",
    "ielts",
    "cost",
    "tuition",
    "admissionDeadline",
  ],
  compare: [
    "acceptance",
    "program",
    "sat",
    "ielts",
    "cost",
    "tuition",
    "admissionDeadline",
    "aidDeadline",
  ],
  eligibility: [
    "program",
    "eligibility",
    "sat",
    "ielts",
    "english",
    "scoreReports",
    "application",
  ],
  documents: [
    "documents",
    "scoreReports",
    "english",
    "application",
    "admissionDeadline",
  ],
  timeline: ["admissionDeadline", "aidDeadline", "application"],
  roadmap: [
    "admissionDeadline",
    "aidDeadline",
    "documents",
    "scoreReports",
    "application",
    "english",
    "cost",
    "tuition",
  ],
  cost: ["program", "cost", "tuition", "aidDeadline"],
  funding: ["cost", "tuition", "aidDeadline", "aidForms"],
};

function sourceRef(
  evidence: Map<string, Evidence>,
  school: University,
  source: EvidenceSource,
) {
  const id = school.id + ":" + source.id;
  evidence.set(id, {
    id,
    title: source.title,
    url: source.url,
    checkedAt: source.checkedAt,
    cycle: source.cycle,
  });
  return id;
}

function fact<T>(
  evidence: Map<string, Evidence>,
  u: University,
  field: string,
  data: Fact<T>,
  format: (value: T) => string = String,
): AdvisorFact {
  const sources = data.sourceIds
    .map((id) => u.sources.find((s) => s.id === id))
    .filter((s): s is EvidenceSource => s?.status === "verified");
  const status = fieldStatus(data, u);
  if (status === "unverified") {
    return {
      field,
      status: data.value === null && !data.note ? "unverified" : "incomplete",
      value: null,
      cycle: data.cycle,
      refs: sources.map((s) => sourceRef(evidence, u, s)),
    };
  }
  return {
    field,
    status,
    value: format(data.value as T),
    cycle: data.cycle,
    scope: data.scope && data.scope.program + " · " + data.scope.purpose,
    note: data.note,
    refs: sources.map((s) => sourceRef(evidence, u, s)),
  };
}

const deadlineFact = (u: University, aid: boolean): Fact<string> => {
  const relevant = (
    d: NonNullable<University["deadlines"]["value"]>[number],
  ) =>
    aid
      ? d.category === "aid" ||
        (!d.category && /aid|scholarship/i.test(d.label))
      : d.category === "admission" ||
        (!d.category && !/aid|scholarship/i.test(d.label));
  const rows = currentDeadlines(u)
    .filter(relevant)
    .sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""));
  const today = new Date().toISOString().slice(0, 10);
  const previous = (u.deadlines.value ?? [])
    .filter(
      (d) =>
        d.date &&
        d.kind !== "relative" &&
        d.cycle !== TARGET_INTAKE &&
        relevant(d),
    )
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
  const row =
    rows.find((d) => d.date && d.date >= today) ?? rows.at(-1) ?? previous[0];
  if (row)
    return {
      value: row.date,
      sourceIds: row.sourceIds ?? u.deadlines.sourceIds,
      cycle: row.cycle,
      note:
        row.label +
        " · " +
        row.note +
        (rows.length > 1
          ? " · See the university profile for all documented rounds."
          : ""),
    };
  const entry = aid ? u.aidDeadline : u.admissionDeadline;
  return entry.cycle === TARGET_INTAKE &&
    !verifiedDeadline(u, {
      date: entry.value,
      cycle: entry.cycle,
      sourceIds: entry.sourceIds,
      label: "",
      kind: "fixed",
      note: "",
    })
    ? { ...entry, value: null }
    : entry;
};

function tuitionFor(u: University): Fact<number> {
  return {
    value: u.costs.tuition,
    sourceIds: u.costSourceIds,
    cycle: u.costCycle,
  };
}

function money(
  currency: string,
  amount: number,
  language: AdvisorInput["language"],
) {
  return new Intl.NumberFormat(language, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

function schoolFacts(
  u: University,
  intent: Intent,
  evidence: Map<string, Evidence>,
  language: AdvisorInput["language"],
  focus?: FocusArea,
) {
  const f = <T>(key: string, data: Fact<T>, format?: (value: T) => string) =>
    fact(evidence, u, key, data, format);
  const englishScores = (key: string, test: string) => {
    const scores = u.englishMinimums.value?.filter((row) => row.test === test);
    return f(
      key,
      { ...u.englishMinimums, value: scores?.length ? scores : null },
      (rows) =>
        rows
          .map(({ score, kind, condition }) => {
            const category =
              kind === "minimum"
                ? label(language, ["minimum", "минимум", "ең төменгі"])
                : label(language, [
                    "recommended",
                    "рекомендуется",
                    "ұсынылады",
                  ]);
            return `${score} · ${category}${condition ? " · " + condition : ""}`;
          })
          .join("\n"),
    );
  };
  const rows: Record<string, () => AdvisorFact> = {
    acceptance: () => {
      const rate = getAdmissionRate(u.id);
      if (!rate)
        return {
          field: "acceptance",
          status: "unverified",
          value: null,
          cycle: null,
          refs: [],
        };
      const id = u.id + ":acceptance-" + rate.year;
      const cycle = formatAdmissionCycle(rate, language);
      evidence.set(id, {
        id,
        title: rate.sourceTitle,
        url: rate.sourceUrl,
        checkedAt: rate.checkedAt,
        cycle,
      });
      const number = new Intl.NumberFormat(language);
      return {
        field: "acceptance",
        status: "verified_previous_cycle",
        value:
          formatAdmissionRate(rate, language) +
          (rate.metric === "offer"
            ? " · " +
              label(language, ["offer rate", "доля офферов", "ұсыныс үлесі"])
            : ""),
        cycle,
        scope:
          rate.scopeNote ??
          (rate.scope.endsWith("application records")
            ? label(language, [
                "First-year application records",
                "Заявки на первый курс",
                "Бірінші курс өтінімдері",
              ])
            : label(language, [
                "All first-year applicants",
                "Все абитуриенты первого курса",
                "Бірінші курсқа өтінім бергендердің бәрі",
              ])),
        note:
          rate.kind === "counts" && !rate.metric
            ? label(language, [
                `${number.format(rate.admitted)} admitted of ${number.format(rate.applicants)} applicants`,
                `${number.format(rate.admitted)} принятых из ${number.format(rate.applicants)} абитуриентов`,
                `${number.format(rate.applicants)} үміткердің ${number.format(rate.admitted)}-і қабылданды`,
              ])
            : undefined,
        refs: [id],
      };
    },
    program: () => f("program", u.programs, (v) => v.join(", ")),
    eligibility: () => f("eligibility", u.admissionEligibility),
    act: () => f("act", u.actPolicy),
    toefl: () => englishScores("toefl", "TOEFL"),
    duolingo: () => englishScores("duolingo", "Duolingo"),
    englishTests: () =>
      f("englishTests", u.englishTests, (tests) => tests.join(", ")),
    sat: () =>
      u.satMinimum.value === null
        ? f("sat", u.satPolicy)
        : f("sat", u.satMinimum),
    ielts: () =>
      f("ielts", u.ielts, (v) =>
        [
          v.requirement,
          ...v.scores.map(
            (s) =>
              (s.comparison === "above" ? "> " : "") +
              s.score +
              (s.high ? "–" + s.high : "") +
              " · " +
              s.kind +
              " · " +
              s.condition,
          ),
          v.detail,
        ].join("; "),
      ),
    english: () => f("english", u.englishPolicy),
    application: () => f("application", u.applicationPlatform),
    documents: () =>
      f("documents", u.requirements, (v) =>
        v
          .map(
            (r) =>
              r.label +
              " — " +
              r.status +
              (r.condition ? " (" + r.condition + ")" : ""),
          )
          .join("\n"),
      ),
    scoreReports: () => {
      const rows =
        u.requirements.value?.filter((r) =>
          /score report|official score|self.report|testing agency|test provider/i.test(
            r.label + " " + r.condition,
          ),
        ) ?? [];
      return f(
        "scoreReports",
        { ...u.requirements, value: rows.length ? rows : null },
        (v) =>
          v
            .map(
              (r) =>
                r.label +
                " — " +
                r.status +
                (r.condition ? " (" + r.condition + ")" : ""),
            )
            .join("\n"),
      );
    },
    cost: () =>
      f("cost", u.annualCost, (v) => money(u.costCurrency, v, language)),
    tuition: () =>
      f("tuition", tuitionFor(u), (v) => money(u.costCurrency, v, language)),
    admissionDeadline: () => f("admissionDeadline", deadlineFact(u, false)),
    aidDeadline: () => f("aidDeadline", deadlineFact(u, true)),
    aidForms: () => f("aidForms", u.aidForms),
  };
  const extra =
    focus === "toefl" || focus === "duolingo"
      ? [focus, "englishTests", "english"]
      : focus === "english"
        ? ["englishTests", "english"]
        : focus === "act"
          ? ["act"]
          : [];
  return [...new Set([...extra, ...fields[intent]])].map((key) => rows[key]());
}

function fundingFilter(q: string, funding: AdvisorInput["profile"]) {
  if (funding?.funding && funding.funding !== "any") return funding.funding;
  if (
    /full ride|full cost|living costs|полн\p{L}* (?:покрыти|стипенди).*(?:прожив|расход)|оқу мен тұру|ақысын.*тұру/u.test(
      q,
    )
  )
    return "fullCost";
  if (
    /full tuition|full scholarships?|100.*tuition|полн\p{L}* оплат\p{L}* обуч|полн\p{L}* стоим.*обуч|оқу ақысын толық/u.test(
      q,
    )
  )
    return "fullTuition";
  if (/full demonstrated need|full need/.test(q)) return "fullNeed";
  return undefined;
}
const verified = (data: Fact<unknown>, u: University) =>
  ["verified_current", "official_general"].includes(fieldStatus(data, u));

const countryNames = new Intl.DisplayNames("en", {
  type: "region",
  fallback: "none",
});
function citizenshipList(
  entries: string[] | null,
  nationality?: string,
): Funding["eligibility"] {
  const country = nationality && countryNames.of(nationality);
  if (!country || !entries?.length) return "check";
  if (
    entries.some((entry) =>
      [norm(country), norm(nationality)].includes(norm(entry)),
    )
  )
    return "listed";
  // The catalogue also uses prose conditions. Only interpret country-only lists as restrictions.
  if (entries.every((s) => /^[A-Z]{2}$/.test(s) && countryNames.of(s)))
    return "excluded";
  if (
    entries.length > 5 &&
    entries.every((s) => /^[A-Z][a-z]+(?: [A-Z][a-z]+)*$/.test(s))
  )
    return "excluded";
  return "check";
}

function matchingAwards(
  u: University,
  funding: ReturnType<typeof fundingFilter>,
  nationality?: string,
) {
  return (awardsBySchool.get(u.id) ?? [])
    .filter((a) => a.source.status === "verified")
    .filter(
      (a) =>
        citizenshipList(a.eligibleCitizenships, nationality) !== "excluded",
    )
    .filter((a) => {
      const coverage = norm(a.coverage);
      if (funding === "fullCost")
        return /\b(full cost of attendance|full ride|100 of tuition and cost of attendance)\b/.test(
          coverage,
        );
      if (funding === "fullTuition")
        return /\b(full tuition|100 (?:of )?(?:subsidised )?(?:tuition|course fees))\b/.test(
          coverage,
        );
      if (funding === "fullNeed")
        return (
          a.kind === "Institutional policy" &&
          /^meets .*demonstrated need/.test(coverage)
        );
      return funding !== "merit" || a.fundingType === "Merit";
    });
}

function awards(
  u: University,
  evidence: Map<string, Evidence>,
  funding: ReturnType<typeof fundingFilter>,
  nationality?: string,
): Funding[] {
  return matchingAwards(u, funding, nationality)
    .slice(0, 3)
    .map((a) => {
      const ref = sourceRef(evidence, u, a.source);
      const deadline = fact(
        evidence,
        { ...u, sources: [...u.sources, a.source] },
        "awardDeadline",
        a.deadline,
      );
      return {
        name: a.name,
        kind: a.kind,
        coverage: a.coverage,
        amount: a.amount,
        currency: a.currency,
        deadline,
        renewal: a.renewal,
        application: a.separateApplication,
        eligibility: citizenshipList(a.eligibleCitizenships, nationality),
        eligibilityTerms: a.eligibleCitizenships?.join("; "),
        ref,
      };
    });
}

export function querySchools(question: string) {
  const positions = new Map<string, number>();
  let remaining = " " + norm(question) + " ";
  for (const item of nameIndex) {
    const start = remaining.indexOf(" " + item.name + " ");
    if (start < 0) continue;
    positions.set(item.id, Math.min(start, positions.get(item.id) ?? start));
    remaining =
      remaining.slice(0, start + 1) +
      " ".repeat(item.name.length) +
      remaining.slice(start + item.name.length + 1);
  }
  return [...positions]
    .sort((a, b) => a[1] - b[1])
    .slice(0, 4)
    .map(([id]) => id);
}

export function queryCountries(question: string) {
  const q = norm(question);
  return countries.filter(
    (country) =>
      has(q, norm(country)) ||
      countryAliases[country]?.some((alias) =>
        alias.length < 4 ? has(q, alias) : q.includes(alias),
      ),
  );
}

export function questionProfile(input: AdvisorInput): AdvisorInput {
  const q = input.question.normalize("NFKC");
  const sat = Number(q.match(/\bSAT(?:\s+total)?\s*[:=]?\s*(\d{3,4})\b/i)?.[1]);
  const ielts = Number(
    q
      .match(
        /\bIELTS(?:\s+Academic)?\s*[:=]?\s*([0-9](?:[.,][05])?)(?![\d.,])/i,
      )?.[1]
      ?.replace(",", "."),
  );
  const { profile } = input;
  const parsedSat = sat >= 400 && sat <= 1600 ? sat : undefined;
  const parsedIelts = ielts >= 0 && ielts <= 9 ? ielts : undefined;
  if (parsedSat === undefined && parsedIelts === undefined) return input;
  return {
    ...input,
    profile: {
      ...profile,
      ...(parsedSat !== undefined && {
        sat: parsedSat,
        // A changed overall score identifies a different sitting.
        satMath: parsedSat === profile?.sat ? profile.satMath : undefined,
      }),
      ...(parsedIelts !== undefined && { ielts: parsedIelts }),
    },
  };
}

export function retrieve(
  input: AdvisorInput,
  options?: { intent?: Intent; followUp?: boolean; focus?: FocusArea },
): AdvisorResult {
  const q = norm(input.question);
  const p = input.profile;
  const named = querySchools(q);
  const pinned = (input.universityIds ?? []).filter((id) => findUniversity(id));
  const followUp =
    options?.followUp ??
    /\b(them|their|these|those|both|next)\b|у них|для них|этих|және олар|осылар/.test(
      q,
    );
  const prior = followUp
    ? (input.previous?.ids ?? []).filter((id) => findUniversity(id))
    : [];
  const candidates = options
    ? named.length
      ? named
      : prior.length
        ? prior
        : pinned
    : [...named, ...pinned, ...prior];
  const specific = [...new Set(candidates)].slice(0, 4);
  const funding = fundingFilter(q, p);
  const intent =
    options?.intent ??
    intentPatterns.find(([, re]) => re.test(q))?.[0] ??
    (specific.length > 1
      ? "compare"
      : funding
        ? "funding"
        : followUp
          ? (input.previous?.intent ?? "search")
          : "search");
  const questionMajor = majorPatterns.find(([, re]) => re.test(q))?.[0];
  const major =
    options && questionMajor
      ? questionMajor
      : p?.major && programTaxonomy.includes(p.major)
        ? p.major
        : questionMajor;
  const mentionedCountries = queryCountries(q);
  const profileCountries = (p?.countries ?? []).filter((c) =>
    countries.includes(c),
  );
  const destinations = new Set(
    options && mentionedCountries.length
      ? mentionedCountries
      : [...profileCountries, ...mentionedCountries],
  );
  const matched = universities.flatMap((u) => {
    if (
      specific.length
        ? !specific.includes(u.id)
        : destinations.size > 0 && !destinations.has(u.country)
    )
      return [];
    const programMatch =
      !!major &&
      !!u.programs.value?.some((v) => normalizeMajor(v) === major) &&
      verified(u.programs, u);
    if (!specific.length && major && !programMatch) return [];
    const fundingSupport = funding
      ? verified(
          u[
            funding === "fullNeed"
              ? "meetsFullNeed"
              : funding === "merit"
                ? "meritAid"
                : funding
          ],
          u,
        ) &&
        u[
          funding === "fullNeed"
            ? "meetsFullNeed"
            : funding === "merit"
              ? "meritAid"
              : funding
        ].value === true
      : false;
    const availableAwards = matchingAwards(u, funding, p?.nationality).length;
    if (!specific.length && funding && !availableAwards && !fundingSupport)
      return [];
    if (
      !specific.length &&
      intent === "funding" &&
      !funding &&
      !availableAwards &&
      u.internationalAid.value !== true
    )
      return [];
    if (
      intent === "acceptance" &&
      specific.length === 0 &&
      !getAdmissionRate(u.id)
    )
      return [];

    const checks: AdvisorCard["checks"] = [];
    if (programMatch) checks.push("programMatch");
    const tuition = tuitionFor(u);
    if (p?.budget !== undefined) {
      if (p.currency !== u.costCurrency) checks.push("budgetUnknown");
      else if (
        u.annualCost.value !== null &&
        fieldStatus(u.annualCost, u) === "verified_current"
      )
        checks.push(
          u.annualCost.value <= p.budget ? "withinBudget" : "overBudget",
        );
      else if (
        tuition.value !== null &&
        fieldStatus(tuition, u) === "verified_current"
      )
        checks.push(tuition.value <= p.budget ? "tuitionOnly" : "tuitionOver");
      else if (
        [u.annualCost, tuition].some(
          (cost) => fieldStatus(cost, u) === "verified_previous_cycle",
        )
      )
        checks.push("historicalBudget");
      else checks.push("budgetUnknown");
    }
    const comparableSAT =
      p?.sat !== undefined &&
      u.satMinimum.value !== null &&
      verified(u.satMinimum, u) &&
      !u.satMinimum.scope &&
      !u.satMinimum.note;
    if (
      p?.sat !== undefined &&
      u.satMinimum.value !== null &&
      verified(u.satMinimum, u)
    )
      checks.push(
        comparableSAT
          ? p.sat >= u.satMinimum.value
            ? "satAbove"
            : "satBelow"
          : "satConditional",
      );
    if (p?.ielts !== undefined && verified(u.ielts, u))
      checks.push("ieltsCondition");
    if (p?.gpa !== undefined) checks.push("gpaUnassessed");
    if (["shortlist", "eligibility", "roadmap"].includes(intent))
      checks.push("qualificationPending");
    if (p?.nationality) checks.push("citizenshipPending");
    if (intent === "roadmap" && p?.activities?.length)
      checks.push("activitiesContext");
    const band: AdvisorCard["band"] =
      checks.includes("satBelow") ||
      (p?.sat !== undefined &&
        fieldStatus(u.satMiddle50, u) !== "unverified" &&
        u.satMiddle50.value &&
        p.sat < u.satMiddle50.value.low)
        ? "reach"
        : programMatch &&
            checks.includes("satAbove") &&
            checks.includes("withinBudget")
          ? "target"
          : programMatch &&
              checks.includes("withinBudget") &&
              !funding &&
              u.satPolicy.value === "not-accepted" &&
              verified(u.satPolicy, u)
            ? "safetyCandidate"
            : "unclassified";
    const costScore = checks.includes("withinBudget")
      ? 12
      : checks.includes("tuitionOnly")
        ? 6
        : checks.includes("historicalBudget")
          ? 2
          : checks.includes("overBudget") || checks.includes("tuitionOver")
            ? -12
            : 0;
    const score = programMatch ? 8 : 0;
    return [
      {
        u,
        checks,
        band,
        score:
          score +
          costScore +
          Number(fundingSupport) * 4 +
          Math.min(3, availableAwards) +
          Number(verified(u.admissionEligibility, u)),
        fundingSupport,
      },
    ];
  });
  const costOrder = (u: University) =>
    [u.annualCost, tuitionFor(u)].some(
      (f) => fieldStatus(f, u) === "verified_current",
    )
      ? 2
      : [u.annualCost, tuitionFor(u)].some(
            (f) => fieldStatus(f, u) === "verified_previous_cycle",
          )
        ? 1
        : 0;
  matched.sort((a, b) =>
    specific.length
      ? specific.indexOf(a.u.id) - specific.indexOf(b.u.id)
      : (intent === "cost" && p?.budget === undefined
          ? costOrder(b.u) - costOrder(a.u)
          : 0) ||
        b.score - a.score ||
        a.u.name.localeCompare(b.u.name),
  );
  const evidence = new Map<string, Evidence>();
  const cards: AdvisorCard[] = matched
    .slice(0, 4)
    .map(({ u, checks, band, fundingSupport }) => {
      const facts = schoolFacts(
        u,
        intent,
        evidence,
        input.language,
        options?.focus,
      );
      if (intent !== "acceptance" && funding && fundingSupport) {
        const key =
          funding === "fullNeed"
            ? "meetsFullNeed"
            : funding === "merit"
              ? "meritAid"
              : funding;
        facts.push(fact(evidence, u, key, u[key], () => ""));
      }
      if (checks.includes("ieltsCondition")) {
        const row = u.ielts.value?.scores.find(
          (s) => s.kind === "minimum" && s.high === undefined,
        );
        if (row && p?.ielts !== undefined) {
          const compare =
            row.comparison === "above"
              ? p.ielts > row.score
              : p.ielts >= row.score;
          const sign = p.ielts === row.score ? " = " : compare ? " > " : " < ";
          facts.push(
            fact(
              evidence,
              u,
              "ieltsComparison",
              u.ielts,
              () => p.ielts + sign + row.score + " · " + row.condition,
            ),
          );
        }
      }
      if (
        u.id === "mbzuai" &&
        ["eligibility", "roadmap", "shortlist", "compare"].includes(intent)
      ) {
        const values =
          p?.sat !== undefined && p.satMath !== undefined
            ? ([p.sat, p.satMath] as const)
            : null;
        const screening = fact(
          evidence,
          u,
          "screening",
          u.testPolicy,
          () => "SAT total ≥ 1400 + SAT Math ≥ 760",
        );
        if (screening.value)
          facts.push({
            ...screening,
            scope: "MBZUAI · undergraduate screening exam waiver",
          });
        if (screening.value && values)
          checks.push(
            values[0] >= 1400 && values[1] >= 760
              ? "screeningMet"
              : "screeningReview",
          );
      }
      if (
        band === "reach" &&
        p?.sat !== undefined &&
        !checks.includes("satBelow")
      ) {
        facts.push(
          fact(
            evidence,
            u,
            "satRange",
            u.satMiddle50,
            (v) => v.low + "–" + v.high,
          ),
        );
      }
      return {
        id: u.id,
        name: u.name,
        location: [u.city, u.country].filter(Boolean).join(", "),
        country: u.country,
        checks,
        band,
        facts,
        funding:
          intent === "acceptance"
            ? []
            : awards(u, evidence, funding, p?.nationality),
      };
    });
  const plan = cards.length
    ? plans[intent].map((action) => ({
        action,
        refs: [
          ...new Set(
            cards.flatMap((c) => [
              ...c.facts
                .filter(
                  (f) =>
                    actionFields[action].includes(f.field) && f.value !== null,
                )
                .flatMap((f) => f.refs),
              ...(action === "funding" ? c.funding.map((a) => a.ref) : []),
            ]),
          ),
        ].slice(0, 3),
      }))
    : [];
  return {
    intent,
    cards,
    evidence: [...evidence.values()],
    plan,
    major,
    funding,
    totalMatches: matched.length,
  };
}
