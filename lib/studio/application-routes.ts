import type { Copy } from "@/lib/studio/reviews";
import { blankProfile, type LocalState } from "@/types/domain";

export const commonAppCatalogueHref = "/explore?platform=Common+App";
export const mitApplicationPortal =
  "https://apply.mitadmissions.org/portal/apply";

type Step = { id: string; label: Copy };
type RouteId = "ucas" | "university-of-california" | "common-app" | "mit";
export type ApplicationRoute = {
  id: RouteId;
  art: "ucas" | "uc" | "common-app" | "mit";
  name: string;
  href: string;
  portal: string;
  guide: string;
  steps: Step[];
};

const step = (id: string, ...label: Copy): Step => ({ id, label });

export const applicationRoutes: ApplicationRoute[] = [
  {
    id: "ucas",
    art: "ucas",
    name: "UCAS",
    href: "/applications/ucas",
    portal: "https://www.ucas.com/dashboard",
    guide:
      "https://www.ucas.com/applying/applying-to-university/filling-in-your-ucas-application",
    steps: [
      step(
        "account",
        "Set up your UCAS Hub account",
        "Создать аккаунт в UCAS Hub",
        "UCAS Hub аккаунтын ашу",
      ),
      step(
        "choices",
        "Choose courses and universities",
        "Выбрать программы и вузы",
        "Бағдарламалар мен университеттерді таңдау",
      ),
      step(
        "qualifications",
        "Gather your qualifications and grades",
        "Собрать сведения о квалификациях и оценках",
        "Біліктілік пен бағалар туралы деректерді жинау",
      ),
      step(
        "statement",
        "Draft your personal statement answers",
        "Подготовить ответы для personal statement",
        "Personal statement жауаптарын дайындау",
      ),
      step(
        "reference",
        "Arrange your academic reference",
        "Договориться об академической рекомендации",
        "Академиялық ұсыным туралы келісу",
      ),
      step(
        "review",
        "Review the application in UCAS Hub",
        "Проверить заявку в UCAS Hub",
        "UCAS Hub ішіндегі өтінімді тексеру",
      ),
    ],
  },
  {
    id: "university-of-california",
    art: "uc",
    name: "University of California",
    href: "/applications/university-of-california",
    portal: "https://apply.universityofcalifornia.edu/my-application/login",
    guide:
      "https://admission.universityofcalifornia.edu/how-to-apply/applying-as-a-first-year/filling-out-the-application.html",
    steps: [
      step(
        "account",
        "Create your UC application account",
        "Создать аккаунт для подачи в UC",
        "UC өтінімі үшін аккаунт ашу",
      ),
      step(
        "campuses",
        "Select campuses and majors",
        "Выбрать кампусы и специальности",
        "Кампустар мен мамандықтарды таңдау",
      ),
      step(
        "academics",
        "Compile your courses and grades",
        "Собрать список предметов и оценок",
        "Пәндер мен бағалар тізімін жинау",
      ),
      step(
        "activities",
        "Prepare your activities and awards list",
        "Подготовить список активностей и наград",
        "Іс-шаралар мен марапаттар тізімін дайындау",
      ),
      step(
        "insight",
        "Draft your personal insight responses",
        "Подготовить ответы на personal insight questions",
        "Personal insight сұрақтарына жауап дайындау",
      ),
      step(
        "review",
        "Check scholarship options and review the application",
        "Проверить варианты стипендий и заявку",
        "Шәкіртақы мүмкіндіктері мен өтінімді тексеру",
      ),
    ],
  },
  {
    id: "common-app",
    art: "common-app",
    name: "Common App",
    href: "/applications/common-app",
    portal: "https://apply.commonapp.org/login",
    guide: "https://www.commonapp.org/apply/first-year-students/",
    steps: [
      step(
        "account",
        "Create your first-year account",
        "Создать аккаунт для поступления на первый курс",
        "Бірінші курсқа өтінім беру аккаунтын ашу",
      ),
      step(
        "colleges",
        "Add colleges and check their requirements",
        "Добавить вузы и проверить их требования",
        "Университеттерді қосып, талаптарын тексеру",
      ),
      step(
        "academics",
        "Gather your school and testing information",
        "Собрать школьные данные и сведения о тестах",
        "Мектеп пен тест туралы деректерді жинау",
      ),
      step(
        "activities",
        "Prepare your activities and honors",
        "Подготовить сведения об активностях и наградах",
        "Іс-шаралар мен марапаттар туралы мәлімет дайындау",
      ),
      step(
        "writing",
        "Review each college’s writing and reference requests",
        "Проверить эссе и рекомендации для каждого вуза",
        "Әр университет сұрайтын эсселер мен ұсынымдарды тексеру",
      ),
      step(
        "review",
        "Review each college’s application",
        "Проверить заявку в каждый вуз",
        "Әр университетке арналған өтінімді тексеру",
      ),
    ],
  },
  {
    id: "mit",
    art: "mit",
    name: "MIT",
    href: "/applications/mit",
    portal: mitApplicationPortal,
    guide: "https://mitadmissions.org/apply/firstyear/deadlines-requirements/",
    steps: [
      step(
        "account",
        "Open your MIT application account",
        "Создать аккаунт для подачи в MIT",
        "MIT өтінімі үшін аккаунт ашу",
      ),
      step(
        "testing",
        "Prepare your SAT or ACT information",
        "Подготовить сведения о SAT или ACT",
        "SAT немесе ACT мәліметтерін дайындау",
      ),
      step(
        "activities",
        "Choose the activities you want to share",
        "Выбрать активности для заявки",
        "Өтінімге енгізетін іс-шараларды таңдау",
      ),
      step(
        "writing",
        "Draft your MIT short responses",
        "Подготовить короткие ответы MIT",
        "MIT қысқа жауаптарын дайындау",
      ),
      step(
        "references",
        "Request teacher letters and school records",
        "Запросить рекомендации учителей и школьные документы",
        "Мұғалімдердің ұсынымдары мен мектеп құжаттарын сұрату",
      ),
      step(
        "review",
        "Review the application in MIT’s portal",
        "Проверить заявку в портале MIT",
        "MIT порталындағы өтінімді тексеру",
      ),
    ],
  },
];

type PreparationState = Pick<LocalState, "profile" | "preparation">;

function stepKey(route: ApplicationRoute, state: PreparationState, id: string) {
  const year = state.profile?.entryYear ?? blankProfile.entryYear;
  return `application:${year}:${route.id}:${id}`;
}

export function routeStepDone(
  route: ApplicationRoute,
  state: PreparationState,
  id: string,
) {
  return state.preparation?.[stepKey(route, state, id)] === true;
}

export function routePreparationProgress(
  route: ApplicationRoute,
  state: PreparationState,
) {
  const done = route.steps.filter(({ id }) =>
    routeStepDone(route, state, id),
  ).length;
  const total = route.steps.length;
  return { done, total, percent: Math.round((done / total) * 100) };
}

export function setRouteStep(
  state: LocalState,
  route: ApplicationRoute,
  id: string,
  done: boolean,
): LocalState {
  if (!route.steps.some((step) => step.id === id)) return state;
  const key = stepKey(route, state, id);
  const preparation = { ...state.preparation };
  if (done) preparation[key] = true;
  else delete preparation[key];
  return { ...state, preparation };
}
