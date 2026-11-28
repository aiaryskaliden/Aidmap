import type { Action, Check, Intent, Language } from "./contracts";

type Text = [string, string, string];
export const label = (language: Language, text: Text) =>
  text[language === "en" ? 0 : language === "ru" ? 1 : 2];

export const intentNames: Record<Intent, Text> = {
  acceptance: ["Acceptance rates", "Доля принятых", "Қабылдау үлесі"],
  search: ["Catalogue results", "Результаты каталога", "Каталог нәтижелері"],
  shortlist: [
    "Your university shortlist",
    "Ваша подборка вузов",
    "Университеттер тізіміңіз",
  ],
  funding: [
    "Funding options",
    "Варианты финансирования",
    "Қаржыландыру нұсқалары",
  ],
  compare: [
    "University comparison",
    "Сравнение вузов",
    "Университеттерді салыстыру",
  ],
  eligibility: [
    "Application requirements",
    "Условия поступления",
    "Оқуға түсу талаптары",
  ],
  timeline: ["Application deadlines", "Сроки подачи", "Өтінім беру мерзімдері"],
  documents: ["Document checklist", "Список документов", "Құжаттар тізімі"],
  cost: ["Cost of study", "Стоимость обучения", "Оқу құны"],
  roadmap: ["Application roadmap", "План поступления", "Оқуға түсу жоспары"],
};
export const prompts: Text[] = [
  [
    "Find universities offering full scholarships",
    "Найди университеты со стипендиями на полную оплату обучения",
    "Оқу ақысын толық өтейтін шәкіртақысы бар университеттерді тап",
  ],
  [
    "Build my personalized university shortlist",
    "Подбери университеты под мой профиль",
    "Профиліме сай университеттерді ірікте",
  ],
  [
    "Compare MIT and Princeton based on my profile",
    "Сравни MIT и Princeton по моему профилю",
    "MIT пен Princeton университеттерін профиліме сай салыстыр",
  ],
  [
    "Find affordable Computer Science programmes",
    "Найди недорогие программы по информатике",
    "Компьютерлік ғылым бойынша бағасы қолжетімді бағдарламаларды тап",
  ],
  [
    "Create my application roadmap",
    "Составь план подачи документов",
    "Өтінім беру жоспарын құрастыр",
  ],
];
export const checks: Record<Check, Text> = {
  programMatch: [
    "Listed in your subject area",
    "Есть программа по вашему направлению",
    "Сіздің бағытыңыз бойынша бағдарлама бар",
  ],
  withinBudget: [
    "Verified annual cost fits your budget before aid",
    "Подтверждённые годовые расходы укладываются в бюджет до учёта помощи",
    "Расталған жылдық шығын көмекке дейін бюджетіңізге сай",
  ],
  overBudget: [
    "Verified annual cost is above your budget before aid",
    "Подтверждённые годовые расходы превышают бюджет до учёта помощи",
    "Расталған жылдық шығын көмекке дейін бюджетіңізден асады",
  ],
  tuitionOver: [
    "Published tuition alone exceeds your budget",
    "Даже стоимость обучения превышает ваш бюджет",
    "Оқу ақысының өзі бюджетіңізден асады",
  ],
  tuitionOnly: [
    "Tuition fits your budget. Confirm living costs and fees.",
    "Оплата обучения укладывается в бюджет. Уточните расходы на проживание и сборы.",
    "Оқу ақысы бюджетіңізге сай. Тұру шығыны мен алымдарды нақтылаңыз.",
  ],
  historicalBudget: [
    "Only prior-cycle prices are available in your currency",
    "В вашей валюте есть только цены предыдущего цикла",
    "Сіздің валютаңызда тек алдыңғы кезеңнің бағасы бар",
  ],
  budgetUnknown: [
    "Comparable annual cost for this intake is missing",
    "Нет сопоставимой годовой стоимости для этого набора",
    "Осы қабылдау кезеңінің салыстырмалы жылдық құны жоқ",
  ],
  satAbove: [
    "Your SAT meets the published minimum shown",
    "Ваш SAT достигает опубликованного минимума",
    "SAT нәтижеңіз жарияланған минимумға жетеді",
  ],
  satBelow: [
    "Your SAT is below the published minimum shown",
    "Ваш SAT ниже опубликованного минимума",
    "SAT нәтижеңіз жарияланған минимумнан төмен",
  ],
  satConditional: [
    "Check the scope and conditions of the SAT minimum",
    "Проверьте, на кого распространяется минимум SAT",
    "SAT минимумы кімге және қандай шартпен қолданылатынын тексеріңіз",
  ],
  screeningMet: [
    "Your SAT scores meet the numerical criteria for a possible screening exam waiver. The university reviews proof.",
    "Ваши баллы SAT достигают порогов для возможного освобождения от вступительного теста. Вуз проверяет подтверждение.",
    "SAT баллдарыңыз іріктеу емтиханынан ықтимал босату шегіне жетеді. Растайтын құжатты университет тексереді.",
  ],
  screeningReview: [
    "The SAT waiver route requires both thresholds. Check other waiver routes or prepare for the screening exam.",
    "Для освобождения по SAT нужны оба порога. Проверьте другие основания или готовьтесь к вступительному тесту.",
    "SAT арқылы босату үшін екі шекке де жету керек. Басқа босату жолдарын тексеріңіз немесе іріктеу емтиханына дайындалыңыз.",
  ],
  ieltsCondition: [
    "Check IELTS component scores, format and exemptions",
    "Проверьте баллы по секциям IELTS, формат и исключения",
    "IELTS бөлімдерінің балдарын, форматын және босату шарттарын тексеріңіз",
  ],
  gpaUnassessed: [
    "GPA needs review on the university’s accepted scale",
    "GPA нужно сверить со шкалой университета",
    "GPA көрсеткішін университет қабылдайтын шкаламен салыстырыңыз",
  ],
  qualificationPending: [
    "Verify your school qualification and any subject prerequisites",
    "Сверьте аттестат и требования к школьным предметам",
    "Аттестатты және пәндерге қойылатын талаптарды тексеріңіз",
  ],
  citizenshipPending: [
    "Confirm citizenship and residency rules with the institution",
    "Сверьте требования к гражданству и резидентству",
    "Азаматтық және резиденттік талаптарын оқу орнынан тексеріңіз",
  ],
  activitiesContext: [
    "Document your role and outcomes for your selected activities",
    "Укажите свою роль и результаты в выбранных занятиях",
    "Таңдаған іс-шаралардағы рөліңіз бен нәтижелеріңізді көрсетіңіз",
  ],
};
export const stepCopy: Record<Action, Text> = {
  program: [
    "Confirm that your intended degree and prerequisite subjects match the programme.",
    "Сверьте направление и требования к школьным предметам со страницей программы.",
    "Бағытыңыз бен пәндерге қойылатын талаптарды бағдарлама бетінен тексеріңіз.",
  ],
  qualification: [
    "Check your secondary-school qualification and any country-specific entry requirements.",
    "Сверьте требования к аттестату и условия для вашей страны.",
    "Мектеп аттестатына және еліңізге қойылатын талаптарды тексеріңіз.",
  ],
  tests: [
    "Compare your scores with the applicable policy. Check the official score-report method and accepted test versions.",
    "Сверьте баллы с применимыми требованиями. Проверьте допустимые версии тестов и способ отправки официальных результатов.",
    "Баллдарыңызды қолданылатын талаптармен салыстырыңыз. Тест нұсқалары мен ресми нәтиже жіберу тәртібін тексеріңіз.",
  ],
  documents: [
    "Confirm the required documents, translations and who must submit each item.",
    "Уточните перечень документов, требования к переводам и кто отправляет каждый документ.",
    "Құжаттар тізімін, аударма шарттарын және оларды кім жіберетінін анықтаңыз.",
  ],
  cost: [
    "Compare annual costs in the same currency and cycle. Leave missing costs open in your budget.",
    "Сравните годовые расходы в одной валюте и за один цикл. Оставьте резерв на расходы без опубликованной оценки.",
    "Жылдық шығындарды бір валютада және бір кезеңде салыстырыңыз. Жарияланбаған шығындарға қор қалдырыңыз.",
  ],
  funding: [
    "Check which expenses each award covers, who qualifies and whether it needs a separate application or annual renewal.",
    "Проверьте покрытие, условия участия, отдельную заявку и правила продления стипендии.",
    "Шәкіртақы нені өтейтінін, кім қатыса алатынын, бөлек өтінім мен ұзарту шарттарын тексеріңіз.",
  ],
  timeline: [
    "Record confirmed admissions and funding dates separately and verify pending dates with the institution.",
    "Запишите подтверждённые даты поступления и финансирования отдельно. Остальные даты уточните в вузе.",
    "Қабылдау мен қаржыландырудың расталған мерзімдерін бөлек белгілеңіз. Қалған мерзімдерді оқу орнынан нақтылаңыз.",
  ],
  apply: [
    "Open the official application portal and confirm submission and receipt instructions.",
    "Откройте официальный портал подачи и проверьте, как отправить заявку и подтвердить её получение.",
    "Ресми өтінім порталын ашып, өтінім жіберу мен қабылдануын растау тәртібін тексеріңіз.",
  ],
};
export const fieldCopy: Record<string, Text> = {
  acceptance: ["Acceptance rate", "Доля принятых", "Қабылдау үлесі"],
  program: ["Programmes", "Программы", "Бағдарламалар"],
  eligibility: [
    "Entry qualifications",
    "Требования к образованию",
    "Білімге қойылатын талаптар",
  ],
  sat: [
    "SAT policy or minimum",
    "Правила или минимум SAT",
    "SAT ережесі немесе минимумы",
  ],
  satRange: [
    "Previously reported SAT middle 50%",
    "Опубликованный диапазон SAT для средних 50%",
    "Жарияланған ортаңғы 50% SAT аралығы",
  ],
  screening: [
    "Possible screening exam waiver",
    "Возможное освобождение от вступительного теста",
    "Іріктеу емтиханынан ықтимал босату",
  ],
  ielts: ["IELTS", "IELTS", "IELTS"],
  act: ["ACT policy", "Правила ACT", "ACT ережелері"],
  toefl: ["TOEFL scores", "Баллы TOEFL", "TOEFL балдары"],
  duolingo: [
    "Duolingo English Test scores",
    "Баллы Duolingo English Test",
    "Duolingo English Test балдары",
  ],
  englishTests: [
    "Accepted English tests",
    "Принимаемые тесты английского",
    "Қабылданатын ағылшын тілі тесттері",
  ],
  ieltsComparison: [
    "Your IELTS compared with a listed threshold",
    "Ваш IELTS и опубликованный порог",
    "IELTS нәтижеңіз және жарияланған шек",
  ],
  english: [
    "English testing policy",
    "Требования к английскому",
    "Ағылшын тілі талаптары",
  ],
  documents: ["Documents", "Документы", "Құжаттар"],
  scoreReports: [
    "Official score reports",
    "Отправка результатов тестов",
    "Тест нәтижелерін жіберу",
  ],
  application: ["Application portal", "Портал подачи", "Өтінім порталы"],
  admissionDeadline: [
    "Admission deadline",
    "Срок подачи в вуз",
    "Оқуға өтінім беру мерзімі",
  ],
  aidDeadline: [
    "Funding deadline",
    "Срок подачи на финансирование",
    "Қаржыландыруға өтінім мерзімі",
  ],
  awardDeadline: [
    "Award deadline",
    "Срок подачи на стипендию",
    "Шәкіртақыға өтінім мерзімі",
  ],
  cost: ["Annual cost", "Годовые расходы", "Жылдық шығын"],
  tuition: ["Published tuition", "Стоимость обучения", "Оқу ақысы"],
  aidForms: [
    "Financial aid forms",
    "Формы финансовой помощи",
    "Қаржылай көмек нысандары",
  ],
  fullCost: [
    "Full cost of attendance available",
    "Есть покрытие всех расходов",
    "Оқудың барлық шығынын өтеу бар",
  ],
  fullTuition: [
    "Full tuition available",
    "Есть полная оплата обучения",
    "Оқу ақысын толық өтеу бар",
  ],
  meetsFullNeed: [
    "Meets full demonstrated need",
    "Покрывает подтверждённую финансовую потребность",
    "Расталған қаржылық қажеттілікті толық өтейді",
  ],
  meritAid: [
    "Merit aid available",
    "Есть стипендии за достижения",
    "Жетістік үшін шәкіртақы бар",
  ],
};
export const statuses: Record<string, Text> = {
  verified_current: [
    "Verified for Fall 2027",
    "Подтверждено для Fall 2027",
    "Fall 2027 кезеңіне расталған",
  ],
  verified_previous_cycle: [
    "Previous-cycle reference",
    "Данные прошлого цикла",
    "Алдыңғы кезең дерегі",
  ],
  official_general: [
    "Official policy, intake unspecified",
    "Официальные данные, набор не указан",
    "Ресми ереже, қабылдау кезеңі көрсетілмеген",
  ],
  incomplete: ["Incomplete evidence", "Данные неполные", "Дерек толық емес"],
  unverified: ["Unavailable", "Данных нет", "Дерек жоқ"],
};
export const fundingLabels: Record<string, Text> = {
  any: ["Any funding", "Любое финансирование", "Кез келген қаржыландыру"],
  fullTuition: [
    "Full tuition",
    "Полная оплата обучения",
    "Оқу ақысын толық өтеу",
  ],
  fullCost: ["Full cost of attendance", "Все расходы", "Барлық шығынды өтеу"],
  fullNeed: [
    "Full demonstrated need",
    "Подтверждённая потребность",
    "Расталған қаржылық қажеттілік",
  ],
  merit: ["Merit award", "За достижения", "Жетістік үшін"],
};
export const activityLabels: Record<string, Text> = {
  olympiads: ["Olympiads", "Олимпиады", "Олимпиадалар"],
  research: ["Research", "Исследования", "Зерттеу"],
  projects: ["Projects", "Проекты", "Жобалар"],
  community: ["Community", "Волонтёрство", "Еріктілік"],
  arts: ["Arts", "Искусство", "Өнер"],
  sports: ["Sports", "Спорт", "Спорт"],
};
export const bands: Record<string, Text> = {
  reach: ["Reach · SAT gap", "Reach · разрыв по SAT", "Reach · SAT айырмасы"],
  target: [
    "Target · published checks matched",
    "Target · опубликованные условия совпали",
    "Target · жарияланған шарттар сәйкес",
  ],
  safetyCandidate: [
    "Safety candidate · budget and programme",
    "Кандидат в Safety · бюджет и программа",
    "Safety үміткері · бюджет пен бағдарлама",
  ],
  unclassified: [
    "Admissions band unknown",
    "Категория поступления неизвестна",
    "Түсу санаты белгісіз",
  ],
};
