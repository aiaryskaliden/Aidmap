"use client";

import Link from "next/link";
import {
  Award,
  ArrowUpRight,
  CalendarDays,
  Check,
  ClipboardCheck,
  FileText,
  Medal,
  UserRound,
} from "lucide-react";
import { useApp } from "@/components/providers";
import { currentDeadlines } from "@/lib/admissions";
import { textWords, tr } from "@/lib/studio/reviews";
import type { University } from "@/types/domain";
import { studioHref, type SchoolOption, type StudioProps } from "./types";
import style from "./studio.module.css";

export function FinalReview({
  language,
  studio,
  schools,
  school,
}: Omit<StudioProps, "save"> & {
  schools: SchoolOption[];
  school?: University;
}) {
  const { state, ready } = useApp();
  const t = (en: string, ru: string, kk: string) => tr(language, [en, ru, kk]);
  const year = state.profile?.entryYear ?? 2027;
  const intake = `Fall ${year}`;
  const locale = { en: "en", ru: "ru", kk: "kk" }[language];
  const format = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeZone: "UTC",
  });
  const essays = studio.essays.filter(
    (draft) => draft.schoolId === "" || draft.schoolId === school?.id,
  );
  const pendingEssays = essays.filter(
    (draft) =>
      !draft.reviewedAt || textWords(draft.text).length > draft.wordLimit,
  ).length;
  const academic = Boolean(state.profile?.major && studio.school);
  const honors = studio.honors?.length ?? 0;
  const achievements = studio.achievements?.length ?? 0;
  const deadlines = school ? currentDeadlines(school, intake) : [];
  const rows = [
    {
      title: t("Academic profile", "Учебный профиль", "Оқу профилі"),
      icon: UserRound,
      link: studioHref("profile"),
      done: academic,
      summary: academic
        ? t(
            "School and intended subject are filled in.",
            "Заполнены школа и направление.",
            "Мектеп пен мамандық көрсетілген.",
          )
        : t(
            "Add your school and intended subject.",
            "Укажите школу и направление.",
            "Мектеп пен мамандықты көрсетіңіз.",
          ),
    },
    {
      title: t(
        "Essays in this workspace",
        "Эссе в кабинете",
        "Кабинеттегі эсселер",
      ),
      icon: FileText,
      link: studioHref("essays"),
      done: essays.length > 0 && pendingEssays === 0,
      summary: essays.length
        ? t(
            `${essays.length} saved · ${pendingEssays} need review or shortening`,
            `Сохранено: ${essays.length} · Проверить или сократить: ${pendingEssays}`,
            `Сақталғаны: ${essays.length} · Тексеру не қысқарту: ${pendingEssays}`,
          )
        : t(
            "Add a general or school-specific draft if required.",
            "Добавьте общий черновик или эссе для вуза, если оно требуется.",
            "Қажет болса, жалпы не университетке арналған жоба қосыңыз.",
          ),
    },
    {
      title: t("Activities", "Активности", "Іс-шаралар"),
      icon: Medal,
      link: studioHref("activities"),
      done:
        studio.activities.length > 0 &&
        studio.activities.every((activity) => activity.role && activity.action),
      summary: t(
        `${studio.activities.length} saved. Include your role and contribution in each.`,
        `Сохранено: ${studio.activities.length}. Для каждой укажите роль и вклад.`,
        `Сақталғаны: ${studio.activities.length}. Әрқайсында рөліңіз бен үлесіңізді көрсетіңіз.`,
      ),
    },
    {
      title: t(
        "Honors & achievements",
        "Награды и достижения",
        "Марапаттар мен жетістіктер",
      ),
      icon: Award,
      link: studioHref("honors"),
      done: honors + achievements > 0,
      summary: t(
        `Honors: ${honors} · Achievements: ${achievements}`,
        `Награды: ${honors} · Достижения: ${achievements}`,
        `Марапаттар: ${honors} · Жетістіктер: ${achievements}`,
      ),
    },
  ];
  return (
    <div className={style.stack}>
      <section className={style.panel}>
        <form action="/studio" method="get" className={style.schoolForm}>
          <input type="hidden" name="view" value="final" />
          <label>
            {t(
              "Choose a university",
              "Выберите университет",
              "Университетті таңдаңыз",
            )}
            <select name="school" defaultValue={school?.id ?? ""} required>
              <option value="">
                {t(
                  "Select a university",
                  "Выбрать вуз",
                  "Университетті таңдау",
                )}
              </option>
              {schools.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} · {item.country}
                </option>
              ))}
            </select>
          </label>
          <button className={style.primary} type="submit" disabled={!ready}>
            <ClipboardCheck size={17} />
            {t("Review application", "Проверить заявку", "Өтінімді тексеру")}
          </button>
        </form>
      </section>
      {ready && school && (
        <>
          <section className={style.panel}>
            <div className={style.listHeading}>
              <div className={style.sectionHeading}>
                <ClipboardCheck size={19} />
                <h2>{school.name}</h2>
              </div>
              <Link
                className={style.textButton}
                href={`${studioHref("fit")}&school=${school.id}`}
                prefetch={false}
              >
                {t(
                  "Check requirements",
                  "Проверить требования",
                  "Талаптарды тексеру",
                )}{" "}
                <ArrowUpRight size={14} />
              </Link>
            </div>
            <ul className={style.finalList}>
              {rows.map(({ title, icon: Icon, link, done, summary }) => (
                <li key={link}>
                  <Icon size={18} />
                  <div>
                    <h3>{title}</h3>
                    <p>{summary}</p>
                  </div>
                  <Link
                    href={link}
                    prefetch={false}
                    className={style.textButton}
                  >
                    {done ? (
                      <Check size={15} aria-hidden />
                    ) : (
                      <ArrowUpRight size={14} aria-hidden />
                    )}
                    {done
                      ? t("Review", "Посмотреть", "Қарау")
                      : t("Open", "Открыть", "Ашу")}
                    <span className="sr-only"> {title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
          <section className={style.panel}>
            <div className={style.listHeading}>
              <div className={style.sectionHeading}>
                <CalendarDays size={19} />
                <h2>
                  {t(
                    "Published deadlines",
                    "Опубликованные сроки",
                    "Жарияланған мерзімдер",
                  )}{" "}
                  · {year}
                </h2>
              </div>
              <Link
                className={style.textButton}
                href={`/universities/${school.id}#deadlines`}
                prefetch={false}
              >
                {t("University details", "Профиль вуза", "Университет профилі")}{" "}
                <ArrowUpRight size={14} />
              </Link>
            </div>
            {deadlines.length ? (
              <ul className={style.finalDates}>
                {[...deadlines]
                  .sort((a, b) => a.date!.localeCompare(b.date!))
                  .map((item) => (
                    <li key={item.label + item.date}>
                      <span>{item.label}</span>
                      <time dateTime={item.date!}>
                        {format.format(new Date(item.date!))}
                      </time>
                    </li>
                  ))}
              </ul>
            ) : (
              <p className={style.quiet}>
                {t(
                  "No verified dates for this intake. Confirm your round and funding deadlines with the university.",
                  "Для этого набора нет подтверждённых дат. Уточните сроки заявки и финансирования в вузе.",
                  "Бұл қабылдау кезеңінің расталған күндері жоқ. Өтінім мен қаржыландыру мерзімін университеттен нақтылаңыз.",
                )}
              </p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
