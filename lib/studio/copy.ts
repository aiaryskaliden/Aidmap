import type { ActivityReason, ActivityTier, Copy } from "./reviews";
import type { Activity } from "@/types/studio";

export const activityNames: Record<Activity["category"], Copy> = {
  club: ["School club", "Школьный клуб", "Мектеп үйірмесі"],
  project: ["Project", "Проект", "Жоба"],
  research: ["Research", "Исследование", "Зерттеу"],
  competition: [
    "Competition",
    "Конкурс или олимпиада",
    "Байқау немесе олимпиада",
  ],
  service: ["Community service", "Волонтёрство", "Еріктілік"],
  sport: ["Sport", "Спорт", "Спорт"],
  art: ["Arts", "Творчество", "Өнер"],
  work: [
    "Work or internship",
    "Работа или стажировка",
    "Жұмыс немесе тағылымдама",
  ],
};

export const activityReachNames: Record<
  NonNullable<Activity["reach"]>,
  Copy
> = {
  school: ["School or team", "Школа или команда", "Мектеп немесе команда"],
  community: [
    "Local community",
    "Город или сообщество",
    "Жергілікті қауымдастық",
  ],
  regional: ["Regional", "Регион", "Өңірлік"],
  national: ["National", "Страна", "Ұлттық"],
  international: ["International", "Международный", "Халықаралық"],
};

export const activityTierGuide: Record<ActivityTier, Copy> = {
  S: [
    "International impact with a stated role, result and evidence.",
    "Международный масштаб, личный вклад, результат и подтверждение.",
    "Халықаралық ауқым, жеке үлес, нәтиже және растау.",
  ],
  "S−": [
    "National impact with a stated role, result and evidence.",
    "Масштаб страны, личный вклад, результат и подтверждение.",
    "Ел ауқымы, жеке үлес, нәтиже және растау.",
  ],
  A: [
    "Regional impact with a stated role, result and evidence.",
    "Региональный масштаб, личный вклад, результат и подтверждение.",
    "Өңірлік ауқым, жеке үлес, нәтиже және растау.",
  ],
  "A−": [
    "A supported result or sustained work with regional or wider reach.",
    "Результат с подтверждением или регулярная работа регионального масштаба и выше.",
    "Растайтын дерегі бар нәтиже немесе өңірлік не кеңірек ауқымдағы тұрақты жұмыс.",
  ],
  B: [
    "A result with a stated role, regular work or supporting evidence.",
    "Результат с указанной ролью, регулярным участием или подтверждением.",
    "Рөлі, тұрақты қатысуы немесе растайтын дерегі көрсетілген нәтиже.",
  ],
  "B−": [
    "An initial description of a contribution and result.",
    "Краткое описание личного вклада и результата.",
    "Жеке үлес пен нәтиженің қысқаша сипаттамасы.",
  ],
  C: [
    "A stated contribution or a result.",
    "Указан личный вклад или результат.",
    "Жеке үлес немесе нәтиже көрсетілген.",
  ],
  "C−": [
    "An activity with a stated role.",
    "Активность с указанной ролью.",
    "Рөлі көрсетілген іс-шара.",
  ],
};

export const activityTierReasons: Record<ActivityReason, Copy> = {
  international: [
    "You reported international reach and included your role, result and supporting evidence.",
    "Вы указали международный масштаб, свою роль, результат и подтверждение.",
    "Халықаралық ауқымды, өз рөліңізді, нәтиже мен растайтын деректі көрсеттіңіз.",
  ],
  national: [
    "You reported national reach and included your role, result and supporting evidence.",
    "Вы указали масштаб страны, свою роль, результат и подтверждение.",
    "Ел ауқымын, өз рөліңізді, нәтиже мен растайтын деректі көрсеттіңіз.",
  ],
  regional: [
    "You reported regional reach and included your role, result and supporting evidence.",
    "Вы указали региональный масштаб, свою роль, результат и подтверждение.",
    "Өңірлік ауқымды, өз рөліңізді, нәтиже мен растайтын деректі көрсеттіңіз.",
  ],
  documented: [
    "You described your role and included evidence of the result.",
    "Вы описали свою роль и добавили подтверждение результата.",
    "Өз рөліңізді сипаттап, нәтижені растайтын дерек қостыңыз.",
  ],
  sustainedReach: [
    "You reported at least three months of regular work and a result at regional or wider reach.",
    "Вы указали не менее трёх месяцев регулярной работы и результат на уровне региона или шире.",
    "Кемінде үш ай тұрақты жұмысты және өңірлік не кеңірек ауқымдағы нәтижені көрсеттіңіз.",
  ],
  namedRole: [
    "You described your role and what changed as a result.",
    "Вы описали свою роль и то, что изменилось в результате.",
    "Өз рөліңізді және нәтижесінде не өзгергенін сипаттадыңыз.",
  ],
  regularWork: [
    "You described a result from at least three months of regular work.",
    "Вы описали результат не менее чем трёх месяцев регулярной работы.",
    "Кемінде үш ай тұрақты жұмыстың нәтижесін сипаттадыңыз.",
  ],
  supportingRecord: [
    "You included evidence of the result. Naming your role would clarify your contribution.",
    "Вы добавили подтверждение результата. Уточните свою роль, чтобы был понятен личный вклад.",
    "Нәтижені растайтын дерек қостыңыз. Жеке үлесіңізді нақтылау үшін рөліңізді атаңыз.",
  ],
  basic: [
    "You described a contribution and a result. Naming your role would add context.",
    "Вы описали вклад и результат. Уточните, за что именно отвечали.",
    "Үлес пен нәтижені сипаттадыңыз. Нақты неге жауапты болғаныңызды көрсетіңіз.",
  ],
  missingOutcome: [
    "You described what you did. Adding a result would show its impact.",
    "Вы описали, что сделали. Укажите результат, чтобы был виден эффект.",
    "Не істегеніңізді сипаттадыңыз. Әсерін көрсету үшін нәтижені қосыңыз.",
  ],
  missingContribution: [
    "You reported a result. Describing your own actions would show your contribution.",
    "Вы указали результат. Опишите свои действия, чтобы был виден ваш вклад.",
    "Нәтижені көрсеттіңіз. Жеке үлесіңізді көрсету үшін өз әрекетіңізді сипаттаңыз.",
  ],
  roleOnly: [
    "You entered your role. Add what you did and what changed.",
    "Вы указали роль. Добавьте, что сделали и что изменилось.",
    "Өз рөліңізді көрсеттіңіз. Не істегеніңізді және не өзгергенін жазыңыз.",
  ],
};

export const essayRubric = {
  prompt: {
    label: [
      "Prompt coverage",
      "Связь с заданием",
      "Тапсырмаға сәйкестік",
    ] as Copy,
    tip: [
      "Underline the part that directly answers the prompt. Check whether it covers the main question.",
      "Найдите в эссе прямой ответ на задание и проверьте, отвечает ли он на главный вопрос.",
      "Тапсырмаға тікелей жауап беретін бөлікті тауып, оның негізгі сұрақты қамтитынын тексеріңіз.",
    ] as Copy,
  },
  detail: {
    label: ["Concrete detail", "Конкретика", "Нақты деталь"] as Copy,
    tip: [
      "Anchor one paragraph in a specific moment and show what you did.",
      "Начните один абзац с конкретного момента и покажите, что сделали именно вы.",
      "Бір абзацты нақты оқиғадан бастап, өз әрекетіңізді көрсетіңіз.",
    ] as Copy,
  },
  reflection: {
    label: ["Reflection", "Осмысление", "Ой қорыту"] as Copy,
    tip: [
      "Explain what changed in how you think or what you did next.",
      "Расскажите, как изменился ваш взгляд или что вы сделали дальше.",
      "Көзқарасыңыз қалай өзгергенін немесе одан кейін не істегеніңізді түсіндіріңіз.",
    ] as Copy,
  },
  flow: {
    label: ["Structure", "Структура", "Құрылым"] as Copy,
    tip: [
      "Give each paragraph one job. Split sentences that combine several ideas.",
      "Оставьте в каждом абзаце одну задачу. Разделите предложения, в которых несколько мыслей.",
      "Әр абзацқа бір міндет беріңіз. Бірнеше ой араласқан сөйлемдерді бөліңіз.",
    ] as Copy,
  },
  length: {
    label: ["Word limit", "Лимит слов", "Сөз шегі"] as Copy,
    tip: [
      "Use the available space for important details. If you’re over the limit, trim repetition first.",
      "Отдайте место важным деталям. При превышении лимита сначала уберите повторы.",
      "Маңызды детальдарға орын қалдырыңыз. Шектен ассаңыз, алдымен қайталауларды қысқартыңыз.",
    ] as Copy,
  },
};

export const readinessTitles = {
  program: ["Intended programme", "Направление", "Оқу бағыты"],
  scores: ["Admission tests", "Вступительные тесты", "Қабылдау тесттері"],
  english: ["English evidence", "Знание английского", "Ағылшын тілі"],
  annual: ["Budget", "Бюджет", "Бюджет"],
  deadline: ["Application timing", "Срок подачи", "Өтінім мерзімі"],
  portfolio: [
    "Application material",
    "Материалы заявки",
    "Өтінім материалдары",
  ],
} satisfies Record<string, Copy>;
