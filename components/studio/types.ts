import type { ApplicantStudio } from "@/types/studio";
import type { Language } from "@/lib/advisor/contracts";
import type { Copy } from "@/lib/studio/reviews";

export const studioViews = [
  "overview",
  "profile",
  "essays",
  "activities",
  "honors",
  "fit",
  "final",
] as const;
export type StudioView = (typeof studioViews)[number] | "chat";
export type SchoolOption = { id: string; name: string; country: string };
export type StudioProps = {
  language: Language;
  studio: ApplicantStudio;
  save: (apply: (studio: ApplicantStudio) => ApplicantStudio) => boolean;
};
export const viewTitles: Record<StudioView, Copy> = {
  overview: ["Overview", "Обзор", "Шолу"],
  profile: ["My profile", "Мой профиль", "Менің профилім"],
  essays: ["Essays", "Эссе", "Эссе"],
  activities: ["Activities", "Активности", "Іс-шаралар"],
  honors: [
    "Honors & achievements",
    "Награды и достижения",
    "Марапаттар мен жетістіктер",
  ],
  fit: ["University fit", "Готовность к вузу", "Оқуға дайындық"],
  final: ["Final review", "Финальная проверка", "Соңғы тексеріс"],
  chat: ["Ask Maple", "Чат с Мэйпл", "Мейплмен чат"],
};
export function studioHref(view: StudioView) {
  if (view === "chat") return "/advisor";
  return view === "overview" ? "/studio" : "/studio?view=" + view;
}
