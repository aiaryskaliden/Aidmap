"use client";

import { CalendarDays, Globe2 } from "lucide-react";
import { useApp } from "@/components/providers";
import { AdvisorWorkspace } from "@/components/matching/advisor-workspace";
import { emptyStudio, type ApplicantStudio } from "@/types/studio";
import type { University } from "@/types/domain";
import type { Language } from "@/lib/advisor/contracts";
import type { StudioHomeSchoolInfo } from "@/lib/studio/catalogue";
import { tr } from "@/lib/studio/reviews";
import type { EssayExercise } from "@/lib/studio/practice";
import { ApplicantProfileEditor } from "./applicant-profile";
import { EssayWorkbench } from "./essay-workbench";
import { ActivitiesEditor } from "./activities-editor";
import { RecognitionEditor } from "./recognition-editor";
import { UniversityReadiness } from "./university-readiness";
import { StudioHome } from "./studio-home";
import { FinalReview } from "./final-review";
import { viewTitles, type SchoolOption, type StudioView } from "./types";
import homeStyle from "./studio-home.module.css";
import style from "./studio.module.css";

export function StudioWorkspace({
  view,
  schools,
  countries,
  school,
  selected,
  exercise,
  initialQuestion,
  homeSchools,
}: {
  view: StudioView;
  schools: SchoolOption[];
  countries: string[];
  school?: University;
  selected?: string;
  exercise?: EssayExercise;
  initialQuestion?: string;
  homeSchools?: StudioHomeSchoolInfo;
}) {
  const { state, update, ready, blocked } = useApp();
  const studio = state.studio ?? emptyStudio;
  const language = studio.language ?? "en";
  const t = (en: string, ru: string, kk: string) => tr(language, [en, ru, kk]);
  const save = (updater: (current: ApplicantStudio) => ApplicantStudio) =>
    update((old) => ({ ...old, studio: updater(old.studio ?? emptyStudio) }));
  const child = { language, studio, save };
  const descriptions = {
    profile: t(
      "Keep your school details, results and résumé ready to use.",
      "Сохраните сведения об учёбе, баллы и резюме в одном месте.",
      "Оқу деректерін, балдарды және түйіндемені бір жерде сақтаңыз.",
    ),
    essays: t(
      "Collect your drafts and get practical feedback before you submit.",
      "Храните черновики и разбирайте их перед подачей.",
      "Жобаларды жинап, өтінім берер алдында талдаңыз.",
    ),
    activities: t(
      "Show what you contributed and what changed as a result.",
      "Покажите свой личный вклад и результат.",
      "Жеке үлесіңіз бен нәтижеңізді көрсетіңіз.",
    ),
    honors: t(
      "Keep formal awards and other results ready for your applications.",
      "Соберите официальные награды и другие достижения для заявок.",
      "Ресми марапаттар мен басқа жетістіктерді өтінімге дайындаңыз.",
    ),
    fit: t(
      "Compare your profile with published requirements for a university.",
      "Сверьте свой профиль с опубликованными требованиями вуза.",
      "Профиліңізді университеттің жарияланған талаптарымен салыстырыңыз.",
    ),
    final: t(
      "Check your drafts, documents and deadlines before submitting.",
      "Проверьте черновики, документы и сроки перед отправкой.",
      "Жіберер алдында жобаларды, құжаттарды және мерзімдерді тексеріңіз.",
    ),
  };

  return (
    <div
      className={
        view === "overview"
          ? `${style.studio} ${homeStyle.paper}`
          : style.studio
      }
      lang={language}
    >
      <div
        className={view === "overview" ? homeStyle.workspace : style.workspace}
      >
        <div className={style.content}>
          <div
            className={
              view === "overview"
                ? `${style.topbar} ${homeStyle.topbar}`
                : style.topbar
            }
          >
            <span>
              <CalendarDays size={15} />
              {t("Fall", "Осень", "Күз")}{" "}
              {view === "chat" ? 2027 : (state.profile?.entryYear ?? 2027)}
            </span>
            <label className={style.language}>
              <Globe2 size={15} />
              <span className="sr-only">
                {t("Workspace language", "Язык кабинета", "Кабинет тілі")}
              </span>
              <select
                value={language}
                disabled={!ready || blocked}
                onChange={(event) =>
                  save((old) => ({
                    ...old,
                    language: event.target.value as Language,
                  }))
                }
              >
                <option value="en">English</option>
                <option value="ru">Русский</option>
                <option value="kk">Қазақша</option>
              </select>
            </label>
          </div>
          {view !== "overview" && view !== "chat" && (
            <header className={style.pageTitle}>
              <h1>{tr(language, viewTitles[view])}</h1>
              <p>{descriptions[view]}</p>
            </header>
          )}
          {view === "overview" && (
            <StudioHome
              {...child}
              schools={schools}
              homeSchools={homeSchools}
            />
          )}
          {view === "profile" && (
            <ApplicantProfileEditor {...child} countries={countries} />
          )}
          {view === "essays" && (
            <EssayWorkbench
              key={exercise?.id}
              {...child}
              schools={schools}
              exercise={exercise}
            />
          )}
          {view === "activities" && <ActivitiesEditor {...child} />}
          {view === "honors" && (
            <div className={style.stack}>
              <RecognitionEditor kind="honors" {...child} />
              <RecognitionEditor kind="achievements" {...child} />
            </div>
          )}
          {view === "fit" && (
            <UniversityReadiness {...child} schools={schools} school={school} />
          )}
          {view === "final" && (
            <FinalReview {...child} schools={schools} school={school} />
          )}
          {view === "chat" && (
            <AdvisorWorkspace
              key={JSON.stringify([selected, initialQuestion])}
              language={language}
              options={schools}
              selected={selected}
              initialQuestion={initialQuestion}
            />
          )}
        </div>
      </div>
    </div>
  );
}
