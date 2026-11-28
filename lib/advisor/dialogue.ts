import { findUniversity } from "@/data/universities";
import {
  queryCountries,
  querySchools,
  questionProfile,
  retrieve,
} from "./catalogue";
import type {
  AdvisorCard,
  AdvisorFact,
  AdvisorInput,
  AdvisorResult,
  Dialogue,
  FocusArea,
  Intent,
  Language,
} from "./contracts";
import { label } from "./copy";

const focusRules: [FocusArea, RegExp, Intent, string[]][] = [
  [
    "acceptance",
    /acceptance rate|admit rate|admission rate|how selective|процент (?:при[её]ма|принят|зачислен|поступив)|дол[яю] (?:при[её]ма|принят)|показатель при[её]ма|қанша пайыз.*қабыл|қабылдау (?:үлесі|пайызы)/iu,
    "acceptance",
    ["acceptance"],
  ],
  [
    "readiness",
    /(?:my|personal) (?:admission )?(?:chances|odds)|chances (?:of getting|at)|will i get in|(?:мои|у меня).*шанс|шанс.*(?:моим|поступить)|менің.*мүмкіндіг|оқуға түсе алам/iu,
    "eligibility",
    ["eligibility", "sat", "ielts"],
  ],
  [
    "reports",
    /score report|official score|самостоятельн.*балл|отправ.*результ|кто отправ|нәтиже.*жібер|балл.*жібер/i,
    "documents",
    ["scoreReports", "application"],
  ],
  [
    "ielts",
    /\bielts\b/i,
    "eligibility",
    ["ielts", "ieltsComparison", "english"],
  ],
  ["toefl", /\btoefl\b/i, "eligibility", ["toefl", "englishTests", "english"]],
  [
    "duolingo",
    /\b(?:duolingo|det)\b|дуолинго/i,
    "eligibility",
    ["duolingo", "englishTests", "english"],
  ],
  [
    "english",
    /английск.*(?:порог|балл|тест)|тест.*английск|ағылшын|english (?:proficiency|tests?|language)/i,
    "eligibility",
    ["englishTests", "english"],
  ],
  ["act", /\bact\b/i, "eligibility", ["act"]],
  [
    "sat",
    /\bsat\b|screening|скрининг/i,
    "eligibility",
    ["sat", "screening", "satRange"],
  ],
  [
    "deadlines",
    /regular decision|early action|application date|deadlines?|срок|дедлайн|когда|мерзім|қашан/i,
    "timeline",
    ["admissionDeadline", "aidDeadline"],
  ],
  [
    "aid",
    /scholarship|financial aid|funding|full ride|full cost|full tuition|стипенди|грант|шәкіртақы|қаржылан/i,
    "funding",
    [
      "aidDeadline",
      "aidForms",
      "fullCost",
      "fullTuition",
      "meetsFullNeed",
      "meritAid",
    ],
  ],
  [
    "tuition",
    /tuition|afford|cheap|budget|cost|цен[ауы]|стоимост|сколько стоит|дешев|недорог|бюджет|ақысы|ақысы|құны|бағасы|арзан|шығын/i,
    "cost",
    ["cost", "tuition"],
  ],
  [
    "documents",
    /documents?|transcript|attestat|документ|аттестат|құжат|аттестат/i,
    "documents",
    ["documents", "scoreReports", "application"],
  ],
  [
    "eligibility",
    /eligib|minimum|gpa|required|requirement|поступ|требован|нуж|шанс|қабылда|талап|түсу/i,
    "eligibility",
    ["eligibility", "sat", "ielts"],
  ],
  [
    "programme",
    /\b(?:programmes?|programs?|major|cs)\b|computer science|data science|направлен|специальност|программ|информат|бағдарлам|компьютерлік ғылым|мамандық/i,
    "search",
    ["program"],
  ],
];
const follow =
  /^(?:and\b|also\b|what about\b|how about\b|а(?=\s)|тогда\b|а у них|ал(?=\s))|(?:\b(?:they|their|there|them|both)\b|у них|туда|там|олар|онда|ше[?!]?$)/iu;
const comparison = /compar|versus|\bvs\b|сравн|сопостав|салыстыр/i;
const roadmap =
  /roadmap|application plan|step by step|дорожн|план подач|план поступ|жол карт|өтінім беру жоспар/i;
const shortlist =
  /shortlist|recommend|best fit|подбор|подбер|рекоменд|шорт.?лист|ірікт|ұсын/i;

const blank = (): AdvisorResult => ({
  intent: "search",
  cards: [],
  evidence: [],
  plan: [],
  totalMatches: 0,
});
type Output = { result: AdvisorResult; dialogue: Dialogue };

function simple(
  language: Language,
  kind: Dialogue["kind"],
  message: [string, string, string],
  suggestions: [string, string, string][],
): Output {
  return {
    result: blank(),
    dialogue: {
      kind,
      focus: "general",
      message: label(language, message),
      suggestions: suggestions.map((entry) => label(language, entry)),
      emphasizedFields: [],
    },
  };
}

const openerChoices: [string, string, string][] = [
  [
    "What IELTS score does MIT ask for?",
    "Какой IELTS нужен в MIT?",
    "MIT үшін қандай IELTS балы керек?",
  ],
  [
    "Compare MIT and Princeton",
    "Сравни MIT и Принстон",
    "MIT пен Princeton-ды салыстыр",
  ],
  [
    "Find full tuition scholarships",
    "Найди стипендии на полную оплату обучения",
    "Оқу ақысын толық өтейтін шәкіртақыларды тап",
  ],
];

function changeBudget(input: AdvisorInput) {
  if (/per month|monthly|в месяц|айына/i.test(input.question)) return input;
  const raw = input.question.match(
    /(?:under|up to|до|не дороже|budget(?:\s+of)?|бюджет|бюджетім)\s*(?:[:=]\s*)?([$€£])?\s*(\d{1,3}(?:[ ,\u00a0]\d{3})+|\d{1,7})\s*(k\b|тыс\.?|мың)?\s*(USD|EUR|GBP|KZT|CAD|AUD|долл\p{L}*|евро|тенге|теңге)?/iu,
  );
  if (!raw) return input;
  const currency =
    ({ $: "USD", "€": "EUR", "£": "GBP" } as const)[
      raw[1] as "$" | "€" | "£"
    ] ??
    (/^долл/i.test(raw[4] ?? "")
      ? "USD"
      : /^евро$/i.test(raw[4] ?? "")
        ? "EUR"
        : /^(тенге|теңге)$/i.test(raw[4] ?? "")
          ? "KZT"
          : (raw[4]?.toUpperCase() as
              "USD" | "EUR" | "GBP" | "KZT" | "CAD" | "AUD" | undefined)) ??
    input.profile?.currency;
  const budget =
    Number(raw[2].replace(/[ ,\u00a0]/g, "")) * (raw[3] ? 1000 : 1);
  return currency && budget <= 1_000_000
    ? { ...input, profile: { ...input.profile, budget, currency } }
    : input;
}

export function conversation(input: AdvisorInput): Output {
  const { language } = input;
  const q = input.question.trim().toLowerCase();
  const named = querySchools(q);
  const destination = queryCountries(q).length > 0;
  if (
    /^(?:hey|hi|hello|привет(?:ик)?|добрый (?:день|вечер)|здравствуйте|сәлем(?:етсіз бе)?|салем)[!.?\s]*$/iu.test(
      q,
    )
  )
    return simple(
      language,
      "welcome",
      [
        "Hi, I’m Maple. Tell me which university or topic you’re looking at and we can work through it.",
        "Привет, я Мэйпл. Назовите вуз или тему, и разберёмся по шагам.",
        "Сәлем, мен Мейплмін. Университетті немесе тақырыпты атаңыз, бірге талдайық.",
      ],
      openerChoices,
    );
  if (
    /^(?:thanks(?: a lot)?|thank you|спасибо(?: большое)?|рахмет|рақмет)[!.?\s]*$/iu.test(
      q,
    )
  )
    return simple(
      language,
      "thanks",
      [
        "Glad to help. You can ask a follow-up about the same university whenever you’re ready.",
        "Рада помочь. Можете задать следующий вопрос о том же вузе.",
        "Көмектесе алғаныма қуаныштымын. Сол университет туралы келесі сұрағыңызды қоя аласыз.",
      ],
      [],
    );
  if (
    /^(?:что ты умеешь|чем можешь помочь|help|what can you do|көмектесші)[!.?\s]*$/iu.test(
      q,
    )
  )
    return simple(
      language,
      "clarify",
      [
        "I can compare schools, explain published test policies, look up funding or plan an application. Try one of these questions.",
        "Могу сравнить вузы, объяснить требования к тестам, найти стипендии или составить план подачи. Попробуйте один из вопросов.",
        "Университеттерді салыстырамын, тест талаптарын түсіндіремін, шәкіртақы іздеймін немесе жоспар құрамын. Мына сұрақтарды байқап көріңіз.",
      ],
      openerChoices,
    );
  const writing =
    /\bessays?\b|эссе|personal statement|мотивационн|уәждеме/iu.test(q);
  const examples =
    /\b(?:examples?|samples?|read|stories|successful applicants?)\b|пример|образ[её]ц|почитать|үлгі|мысал|оқығым/iu.test(
      q,
    );
  const profileExamples =
    /\b(?:profiles?|applicants?)\b|профил|абитуриент|талапкер/iu.test(q);
  if (examples && (writing || profileExamples)) {
    const reply = simple(
      language,
      writing ? "writing" : "profile",
      writing
        ? [
            "Browse published essays by topic. Pick a situation close to yours and read the writer’s original through the source link.",
            "Выберите опубликованное эссе на близкую вам тему. По ссылке в разборе можно прочитать оригинал автора.",
            "Өзіңізге жақын тақырыптағы жарияланған эссені таңдаңыз. Талдаудағы сілтеме арқылы түпнұсқасын оқи аласыз.",
          ]
        : [
            "Browse student profiles by subject or situation and follow the original story for context.",
            "Найдите истории студентов по направлению или ситуации. В карточке есть ссылка на оригинальную публикацию.",
            "Студенттердің оқиғаларын мамандық не жағдай бойынша іздеңіз. Карточкадан түпнұсқа жарияланымға өтуге болады.",
          ],
      [],
    );
    reply.dialogue.library = writing ? "essays" : "profiles";
    return reply;
  }
  if (
    writing &&
    !/deadline|дедлайн|мерзім|требован|required|require|құжат/iu.test(q)
  )
    return simple(
      language,
      "writing",
      [
        "Put one concrete moment at the centre of the essay. Show what you did, then explain how it changed what you thought or did next. In Essays you can import a draft and get feedback on the exact text.",
        "Выберите один конкретный эпизод. Покажите, что сделали именно вы, и объясните, как это повлияло на ваши взгляды или дальнейшие действия. В разделе «Эссе» можно загрузить черновик и разобрать его текст.",
        "Эссеге бір нақты оқиғаны негіз етіңіз. Не істегеніңізді және оның ойыңызды не кейінгі әрекетіңізді қалай өзгерткенін көрсетіңіз. «Эссе» бөлімінде жобаңызды жүктеп, мәтінді талдай аласыз.",
      ],
      [],
    );
  if (
    /extracurricular|внеучеб|активност|үйірме|іс.?шара/iu.test(q) &&
    !named.length
  )
    return simple(
      language,
      "activities",
      [
        "Start with your role and time commitment, then describe what changed because of your work. Add an example or measurable outcome if you have one. The activity rubric checks how much of this the reader can see.",
        "Начните с роли и времени, которое вы уделяли делу. Затем опишите, что изменилось благодаря вашему вкладу. В разделе активностей можно оценить полноту описания и увидеть, каких деталей не хватает.",
        "Рөліңіз бен жұмсаған уақытыңыздан бастаңыз. Содан кейін еңбегіңіздің нәтижесінде не өзгергенін жазыңыз. Іс-шаралар бөлімінде сипаттаманы бағалап, жетіспейтін детальдарды көре аласыз.",
      ],
      [],
    );
  if (
    /\b(?:cv|resume|profile)\b|резюме|профил|түйіндем|профил/iu.test(q) &&
    !named.length &&
    !shortlist.test(q) &&
    !comparison.test(q) &&
    !/вуз|универ|college|universit|оқу/iu.test(q)
  )
    return simple(
      language,
      "profile",
      [
        "In My profile you can add grades, your intended subject and your budget. Import your CV to fill in detected scores, then check the values before saving.",
        "В профиле можно добавить оценки, направление и бюджет. Загрузите CV, подставьте найденные баллы и проверьте их перед сохранением.",
        "Профильге бағаларыңызды, бағытыңызды және бюджетіңізді қосыңыз. CV жүктеп, табылған балдарды сақтар алдында тексеріңіз.",
      ],
      [],
    );
  const match = focusRules.find(([, pattern]) => pattern.test(q));
  const hasBudget = /under|budget|не дороже|бюджет|теңге/iu.test(q);
  const subject = focusRules.find(
    ([key, pattern]) => key === "programme" && pattern.test(q),
  );
  const schoolBound =
    match &&
    ["eligibility", "documents", "timeline", "acceptance", "cost"].includes(
      match[2],
    );
  const referring =
    !!input.previous?.ids.length &&
    !destination &&
    (follow.test(q) ||
      (!named.length &&
        !!schoolBound &&
        !shortlist.test(q) &&
        !comparison.test(q)));
  const answeringClarification =
    !!named.length && input.previous?.ids.length === 0;
  const focus =
    match?.[0] ??
    (referring || answeringClarification ? input.previous?.focus : undefined) ??
    "general";
  const focusRule = focusRules.find(([key]) => key === focus);
  const intent = comparison.test(q)
    ? "compare"
    : roadmap.test(q)
      ? "roadmap"
      : shortlist.test(q)
        ? "shortlist"
        : hasBudget && !match
          ? "cost"
          : (focusRule?.[2] ??
            (named.length > 1
              ? "compare"
              : referring
                ? input.previous?.intent
                : undefined));
  if (!intent && !destination && !named.length && !input.universityIds?.length)
    return simple(
      language,
      "clarify",
      [
        "Which university, country or application topic should I look at? A name or a question about fees, funding, documents or tests is enough.",
        "Какой вуз, страна или этап поступления вас интересует? Можно назвать вуз или сразу спросить о цене, стипендиях, документах или тестах.",
        "Қай университет, ел немесе қабылдау тақырыбы қызықтырады? Университетті атаңыз немесе оқу ақысы, шәкіртақы, құжаттар не тест туралы сұраңыз.",
      ],
      openerChoices,
    );
  if (
    ["timeline", "documents", "eligibility", "acceptance"].includes(
      intent ?? "",
    ) &&
    !named.length &&
    !input.universityIds?.length &&
    !referring &&
    !(intent === "acceptance" && destination)
  ) {
    const clarification = simple(
      language,
      "clarify",
      [
        "Which university and application round is this about? Test and document rules can vary by route.",
        "О каком университете и раунде подачи речь? Правила по тестам, документам и срокам зависят от маршрута.",
        "Қай университет пен қабылдау раунды туралы сұрап тұрсыз? Тест, құжат және мерзім ережелері бағытқа байланысты.",
      ],
      openerChoices.slice(0, 1),
    );
    clarification.result.intent = intent ?? "eligibility";
    clarification.dialogue.focus = focus;
    return clarification;
  }
  if (
    intent === "compare" &&
    named.length +
      (input.universityIds?.length ?? 0) +
      (referring ? (input.previous?.ids.length ?? 0) : 0) <
      2
  )
    return simple(
      language,
      "clarify",
      [
        "Name or select at least two universities to compare.",
        "Назовите или выберите хотя бы два университета для сравнения.",
        "Салыстыру үшін кемінде екі университетті атаңыз немесе таңдаңыз.",
      ],
      openerChoices.slice(1, 2),
    );
  const requested =
    destination && !named.length
      ? { ...input, universityIds: undefined }
      : input;
  const result = retrieve(questionProfile(changeBudget(requested)), {
    intent,
    focus,
    followUp: referring,
  });
  if (result.intent === "compare" && result.cards.length < 2)
    return simple(
      language,
      "clarify",
      [
        "I found fewer than two catalogue profiles. Select two universities in the school menu.",
        "Нашлось меньше двух профилей. Выберите два вуза в меню.",
        "Екі профильден аз табылды. Мәзірден екі университет таңдаңыз.",
      ],
      openerChoices.slice(1, 2),
    );
  const emphasizedFields =
    focusRule?.[3] ??
    (subject
      ? ["program"]
      : result.intent === "compare"
        ? ["program", "sat", "tuition", "admissionDeadline"]
        : []);
  return {
    result,
    dialogue: {
      kind: "answer",
      focus,
      message: answerText(result, focus, language),
      suggestions: result.cards.length
        ? [
            label(
              language,
              result.intent === "timeline"
                ? [
                    "What documents do they need?",
                    "Какие документы им нужны?",
                    "Оларға қандай құжаттар қажет?",
                  ]
                : [
                    "What are their deadlines?",
                    "Какие у них дедлайны?",
                    "Олардың мерзімдері қандай?",
                  ],
            ),
            label(
              language,
              focus === "aid"
                ? [
                    "How much does it cost?",
                    "Сколько стоит обучение?",
                    "Оқу ақысы қанша?",
                  ]
                : [
                    "Do they offer financial aid?",
                    "Есть ли у них стипендии?",
                    "Олар шәкіртақы ұсына ма?",
                  ],
            ),
          ]
        : [],
      emphasizedFields,
    },
  };
}

const policyNames: Record<string, [string, string, string]> = {
  required: ["required", "обязателен", "міндетті"],
  optional: ["optional", "необязателен", "міндетті емес"],
  flexible: [
    "one of several options",
    "один из вариантов",
    "бірнеше нұсқаның бірі",
  ],
  "not-accepted": ["not accepted", "не принимается", "қабылданбайды"],
};

function concise(fact: AdvisorFact | undefined, l: Language) {
  if (fact?.value == null) return null;
  const policy = policyNames[fact.value];
  const value = policy
    ? label(l, policy)
    : fact.value
        .replace(/\s+/g, " ")
        .split("; ")
        .slice(0, 2)
        .join("; ")
        .slice(0, 132);
  const context =
    fact.status === "verified_previous_cycle"
      ? label(l, ["previous cycle", "предыдущий цикл", "өткен цикл"])
      : fact.cycle;
  return value + (context ? " · " + context : "");
}

function answerText(result: AdvisorResult, focus: FocusArea, l: Language) {
  const t = (en: string, ru: string, kk: string) => label(l, [en, ru, kk]);
  if (!result.cards.length)
    return t(
      "Your filters did not match any verified options in the catalogue. Try another destination, subject or funding requirement.",
      "По этим фильтрам в каталоге нет подтверждённых вариантов. Попробуйте другую страну, направление или вид финансирования.",
      "Бұл сүзгілерге сай расталған нұсқа табылмады. Басқа елді, бағытты немесе қаржыландыру түрін таңдаңыз.",
    );
  const card = result.cards[0];
  const name = card.name;
  const from = (field: string, entry: AdvisorCard = card) =>
    entry.facts.find((f) => f.field === field && f.value !== null);
  const value = (field: string, entry?: AdvisorCard) =>
    concise(from(field, entry), l);
  const cardNames = result.cards.map((s) => s.name).join(", ");
  if (
    focus === "toefl" ||
    focus === "duolingo" ||
    focus === "act" ||
    focus === "english"
  ) {
    return result.cards
      .map((school) => {
        if (focus === "act") {
          const policy = from("act", school);
          const alternative =
            /\b(?:SAT\s*(?:\/|or)\s*ACT|ACT\s*(?:\/|or)\s*SAT)\b/i.test(
              policy?.note ?? "",
            );
          const requirement =
            policy?.value === "required" && alternative
              ? t(
                  "SAT or ACT required",
                  "требуется SAT или ACT",
                  "SAT немесе ACT қажет",
                )
              : value("act", school);
          return (
            school.name +
            " — " +
            (requirement
              ? "ACT · " + requirement
              : t(
                  "ACT policy unavailable for this route.",
                  "Правила ACT для этого маршрута пока неизвестны.",
                  "Бұл бағыт үшін ACT ережелері әзірге белгісіз.",
                ))
          );
        }
        const accepted = from("englishTests", school)?.value;
        if (focus === "english")
          return (
            school.name +
            " — " +
            (accepted ??
              from("english", school)?.value ??
              t(
                "English testing policy unavailable.",
                "Требования к английскому пока неизвестны.",
                "Ағылшын тілі талаптары әзірге белгісіз.",
              ))
          );
        const test = focus === "toefl" ? "TOEFL" : "Duolingo";
        const scores = from(focus, school);
        const isListed = accepted?.toLowerCase().includes(test.toLowerCase());
        return (
          school.name +
          " — " +
          test +
          "\n" +
          (scores
            ? scores.value + (scores.cycle ? "\n" + scores.cycle : "")
            : isListed
              ? t(
                  "Listed as accepted. A numeric minimum is unavailable in the catalogue.",
                  "Тест принимается. Числовой минимум в каталоге не указан.",
                  "Тест қабылданады. Каталогта ең төменгі балл көрсетілмеген.",
                )
              : t(
                  "Check the official English policy for acceptance and minimum scores.",
                  "Проверьте на сайте вуза, принимается ли этот тест и какой у него порог.",
                  "Тесттің қабылдануы мен ең төменгі балын ресми ережеден тексеріңіз.",
                ))
        );
      })
      .join("\n\n");
  }
  if (focus === "acceptance" || result.intent === "acceptance") {
    const rates = result.cards.map((school) => {
      const fact = from("acceptance", school);
      return (
        school.name +
        " — " +
        (fact
          ? `${fact.value} (${fact.cycle})`
          : t("rate unavailable", "доля не подтверждена", "үлесі расталмаған"))
      );
    });
    return (
      rates.join("\n") +
      "\n\n" +
      t(
        "Open the details for each figure’s applicant group.",
        "В деталях указано, какие заявления учтены для каждого показателя.",
        "Әр көрсеткішке қандай өтінімдер кіретіні мәліметтерде көрсетілген.",
      )
    );
  }
  if (focus === "readiness") {
    return t(
      `For ${cardNames}, I can check your scores and qualifications against published requirements. Open University fit for a checklist based on your profile.`,
      `Для ${cardNames} можно сверить баллы и аттестат с опубликованными требованиями. В разделе «Готовность к вузу» есть чек-лист по вашему профилю.`,
      `${cardNames} үшін балдарыңыз бен біліміңізді жарияланған талаптармен салыстыра аламын. Профиль бойынша тізім «Оқуға дайындық» бөлімінде.`,
    );
  }
  if (result.intent === "compare")
    return t(
      "I’ve put " +
        cardNames +
        " side by side. Open the comparison to see the relevant requirements, source dates and gaps.",
      "Сопоставила " +
        cardNames +
        ". В сравнении видны требования, даты источников и данные, которые нужно уточнить.",
      cardNames +
        " деректерін салыстырдым. Кестеден талаптар, дереккөз мерзімдері және нақтылауды қажет ететін ақпарат көрінеді.",
    );
  if (result.intent === "shortlist")
    return t(
      "Start with " +
        cardNames +
        ". Open each profile to see why it matches and which requirements still need checking.",
      "Для начала посмотрите " +
        cardNames +
        ". В карточках указано, почему вуз попал в подборку и какие требования ещё нужно проверить.",
      "Алдымен " +
        cardNames +
        " университеттерін қараңыз. Карточкаларда олардың неліктен сәйкес келгені және тексерілетін талаптар көрсетілген.",
    );
  if (result.intent === "roadmap") {
    const date = value("admissionDeadline");
    return date
      ? t(
          "For " +
            name +
            ", first check the listed application round (" +
            date +
            "). Then work through your documents and funding requirements below.",
          "Для " +
            name +
            " сначала сверьте раунд подачи (" +
            date +
            "). Затем пройдите список материалов и требований к финансированию ниже.",
          name +
            " үшін алдымен қабылдау раундын тексеріңіз (" +
            date +
            "). Содан кейін төмендегі құжаттар мен қаржыландыру талаптарын қараңыз.",
        )
      : t(
          "Start by confirming the application round for " +
            name +
            ". Then use the steps below to prepare your materials.",
          "Сначала уточните раунд подачи в " +
            name +
            ". Затем подготовьте материалы по шагам ниже.",
          "Алдымен " +
            name +
            " қабылдау раундын нақтылаңыз. Содан кейін төмендегі қадамдармен материалдарыңызды дайындаңыз.",
        );
  }
  if (focus === "ielts" && result.cards.length === 1) {
    const raw = findUniversity(card.id)?.ielts.value;
    const applicable = from("ielts");
    const score =
      applicable &&
      raw?.scores.find(
        (item) => item.kind === "minimum" && item.high === undefined,
      );
    if (applicable && score) {
      const mark = (score.comparison === "above" ? "> " : "≥ ") + score.score;
      const qualifier =
        applicable.status === "verified_previous_cycle"
          ? t(" (previous-cycle data)", " (прошлый цикл)", " (өткен цикл)")
          : "";
      const comparison = from("ieltsComparison")?.value?.split(" · ")[0];
      const compareMessage = comparison
        ? t(
            " Your overall score against that threshold: " + comparison + ".",
            " Сравнение вашего общего балла с порогом: " + comparison + ".",
            " Жалпы балыңызды осы шекпен салыстыру: " + comparison + ".",
          )
        : "";
      return (
        t(
          name +
            " lists an IELTS overall threshold of " +
            mark +
            qualifier +
            " for the route in the source. Check section scores and waivers in the details.",
          name +
            " указывает порог IELTS " +
            mark +
            qualifier +
            " для описанного в источнике маршрута. Сверьте минимумы по секциям и условия освобождения.",
          name +
            " дереккөзде сипатталған бағыт үшін жалпы IELTS шегін " +
            mark +
            qualifier +
            " деп көрсетеді. Бөлім балдары мен босату шарттарын тексеріңіз.",
        ) + compareMessage
      );
    }
    const policy = value("ielts");
    return policy
      ? t(
          "I found an IELTS policy for " +
            name +
            " and no comparable verified minimum. Open the details for the conditions.",
          "Нашла правила IELTS для " +
            name +
            ". Сопоставимый минимум пока не подтверждён. Условия есть в деталях.",
          name +
            " бойынша IELTS ережесі бар. Салыстырмалы минимум расталмаған. Шарттарды ашып қараңыз.",
        )
      : t(
          "I couldn’t verify an IELTS requirement for " +
            name +
            " in the catalogue. Open the university profile to check its English policy.",
          "Требования IELTS для " +
            name +
            " пока не подтверждены в каталоге. Сверьте правила английского на странице вуза.",
          name +
            " үшін IELTS талабы каталогта әзірге расталмаған. Ағылшын тілі ережесін университет профилінен тексеріңіз.",
        );
  }
  if (focus === "sat" && result.cards.length === 1) {
    const sat = value("sat");
    return sat
      ? t(
          "For " +
            name +
            ", the catalogue lists SAT as " +
            sat +
            ". Check the scope and any alternative routes.",
          "По SAT для " +
            name +
            " в каталоге указано: " +
            sat +
            ". Сверьте, к кому применяется требование и какие есть альтернативы.",
          name +
            " бойынша SAT дерегі: " +
            sat +
            ". Талаптың қолданылу аясын және балама жолдарды тексеріңіз.",
        )
      : t(
          "A comparable SAT requirement for " +
            name +
            " is missing. Check the official test policy for your application route.",
          "Сопоставимое требование SAT для " +
            name +
            " пока неизвестно. Проверьте правила тестов для вашего маршрута подачи.",
          name +
            " бойынша салыстырмалы SAT талабы белгісіз. Өтінім жолыңызға арналған тест ережесін тексеріңіз.",
        );
  }
  if (focus === "tuition") {
    const amount = value("cost") ?? value("tuition");
    const budget =
      card.checks.includes("tuitionOver") || card.checks.includes("overBudget");
    if (amount)
      return (
        (value("cost")
          ? t(
              name + " has a published annual cost of ",
              "Опубликованные годовые расходы в " + name + " — ",
              name + " бойынша жарияланған жылдық шығын — ",
            )
          : t(
              name + " lists tuition of ",
              "Опубликованная стоимость обучения в " + name + " — ",
              name + " бойынша жарияланған оқу ақысы — ",
            )) +
        amount +
        ". " +
        (budget
          ? t(
              "The checked amount exceeds your annual budget.",
              "Подтверждённая сумма выше вашего годового бюджета.",
              "Салыстырылған сома жылдық бюджетіңізден жоғары.",
            )
          : t(
              "Open the costs to check the cycle, fees and living expenses.",
              "Откройте детали, чтобы сверить цикл, сборы и расходы на проживание.",
              "Цикл, алымдар және тұру шығынын мәліметтерден тексеріңіз.",
            ))
      );
    return t(
      "The catalogue has no usable annual cost or tuition for " +
        name +
        ". Check the costs on the official profile before budgeting.",
      "В каталоге пока нет пригодных данных о стоимости обучения или полных расходах в " +
        name +
        ". Для бюджета проверьте официальные данные в профиле вуза.",
      name +
        " бойынша оқу ақысы мен толық шығын дерегі әзірге жоқ. Бюджет құрмас бұрын ресми деректі тексеріңіз.",
    );
  }
  if (focus === "deadlines") {
    const dates = result.cards
      .map((s) => {
        const date = value("admissionDeadline", s) ?? value("aidDeadline", s);
        return date && s.name + " — " + date;
      })
      .filter(Boolean);
    return dates.length
      ? dates.join("\n") +
          "\n" +
          t(
            "Open the details for the round and separate funding deadlines.",
            "В деталях указан раунд и отдельные сроки финансирования.",
            "Раунд пен бөлек қаржыландыру мерзімдерін мәліметтерден қараңыз.",
          )
      : t(
          "I couldn’t verify a date for this selection. Check the official application page for your intake and round.",
          "Подтверждённой даты для этой выборки нет. Проверьте официальный сайт для вашего набора и раунда.",
          "Бұл таңдауда расталған күн жоқ. Қабылдау циклі мен раундты ресми сайттан тексеріңіз.",
        );
  }
  if (focus === "aid") {
    const award = card.funding[0];
    return award
      ? t(
          "A documented option at " +
            name +
            " is " +
            award.name +
            ". Open it to check coverage, eligibility and whether it needs a separate application.",
          "Один из подтверждённых вариантов в " +
            name +
            " — " +
            award.name +
            ". В карточке есть покрытие, условия участия и порядок подачи.",
          name +
            " бойынша расталған нұсқалардың бірі — " +
            award.name +
            ". Карточкадан өтелетін шығынды, шарттарды және өтінім беру тәртібін қараңыз.",
        )
      : t(
          "I found no verified award for the requested criteria at " +
            name +
            ". Check its financial aid policy and current eligibility rules.",
          "Для заданных условий в " +
            name +
            " подтверждённой стипендии пока нет. Проверьте политику финансовой помощи и актуальные условия.",
          name +
            " бойынша сұралған шарттарға сай расталған шәкіртақы жоқ. Ресми қаржылай көмек ережесін тексеріңіз.",
        );
  }
  if (focus === "documents" || focus === "reports") {
    const field = focus === "reports" ? "scoreReports" : "documents";
    const available = from(field);
    return available
      ? t(
          "I found published " +
            (focus === "reports"
              ? "score submission rules"
              : "application documents") +
            " for " +
            name +
            ". Open the checklist to see what you submit and what your school or testing agency sends.",
          "Нашла официальные " +
            (focus === "reports"
              ? "правила отправки результатов"
              : "требования к документам") +
            " для " +
            name +
            ". Откройте список, чтобы сверить, что отправляете вы, школа или тестовый центр.",
          name +
            " бойынша " +
            (focus === "reports"
              ? "тест нәтижесін жіберу ережелері"
              : "құжат талаптары") +
            " бар. Қай құжатты өзіңіз, мектеп немесе тест орталығы жіберетінін тексеріңіз.",
        )
      : t(
          "The catalogue has no verified details for this part of the application at " +
            name +
            ". Open its official requirements to confirm.",
          "Для этой части заявки в " +
            name +
            " подтверждённых деталей пока нет. Сверьте официальные требования.",
          name +
            " бойынша өтінімнің осы бөлігіне расталған дерек жоқ. Ресми талаптарды тексеріңіз.",
        );
  }
  if (focus === "eligibility") {
    const remaining = card.checks.includes("satBelow")
      ? t(
          "Your SAT is below the minimum shown. Check the exact application route and alternatives.",
          "Ваш SAT ниже указанного минимума. Сверьте маршрут подачи и возможные альтернативы.",
          "SAT балыңыз көрсетілген минимумнан төмен. Нақты өтінім жолын және баламаларды тексеріңіз.",
        )
      : t(
          "Start by checking your school qualification, subject prerequisites and testing route.",
          "Для начала проверьте аттестат, требования к предметам и правила тестирования.",
          "Алдымен аттестатты, пән талаптарын және тестілеу жолын тексеріңіз.",
        );
    return (
      t(
        "For " +
          name +
          ", I can check readiness using your profile and published requirements. ",
        "Для " +
          name +
          " можно сверить готовность по вашему профилю и опубликованным требованиям. ",
        name +
          " үшін профиль мен жарияланған талаптарға сүйеніп дайындықты тексеруге болады. ",
      ) + remaining
    );
  }
  if (focus === "programme" && result.cards.length === 1) {
    const listed = value("program");
    if (listed)
      return t(
        "The published subject list for " +
          name +
          " includes " +
          listed +
          ". Check the official page for the exact degree and curriculum.",
        "Среди направлений " +
          name +
          " указаны " +
          listed +
          ". Точную программу и учебный план можно сверить по ссылке.",
        name +
          " бағыттарының тізімінде " +
          listed +
          " бар. Нақты бағдарлама мен оқу жоспарын ресми сілтемеден тексеріңіз.",
      );
  }
  return t(
    "I found " +
      cardNames +
      " in the undergraduate catalogue. Open the details to look at programmes, requirements and the next steps.",
    "Нашла в каталоге бакалавриата " +
      cardNames +
      ". Откройте детали, чтобы посмотреть программы, требования и следующие шаги.",
    "Бакалавриат каталогынан " +
      cardNames +
      " табылды. Бағдарлама, талап және келесі қадамдарды мәліметтерден қараңыз.",
  );
}
