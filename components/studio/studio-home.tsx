"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  CalendarDays,
  Check,
  ChevronRight,
  FilePenLine,
  GraduationCap,
  ListChecks,
  Medal,
  Plus,
  School,
} from "lucide-react";
import { useApp } from "@/components/providers";
import { UniversityMark } from "@/components/universities/university-mark";
import type { Language } from "@/lib/advisor/contracts";
import {
  applicationRoutes,
  routePreparationProgress,
} from "@/lib/studio/application-routes";
import type { StudioHomeSchoolInfo } from "@/lib/studio/catalogue";
import { tr, type Copy } from "@/lib/studio/reviews";
import { statuses, type SavedUniversity } from "@/types/domain";
import { studioHref, type SchoolOption, type StudioProps } from "./types";
import styles from "./studio-home.module.css";

export function StudioHome({
  language,
  studio,
  schools,
  homeSchools,
}: Pick<StudioProps, "language" | "studio"> & {
  schools: SchoolOption[];
  homeSchools?: StudioHomeSchoolInfo;
}) {
  const { state, ready } = useApp();
  const t = (en: string, ru: string, kk: string) => tr(language, [en, ru, kk]);
  const profile = state.profile?.isDemo ? null : state.profile;
  const firstName = studio.name.trim().split(/\s+/)[0];
  const catalogue = new Map(schools.map((school) => [school.id, school]));
  const saved = state.saved.flatMap((entry) => {
    const school = catalogue.get(entry.universityId);
    return school ? [{ school, entry }] : [];
  });
  const active = saved.filter(
    ({ entry }) =>
      statuses.indexOf(entry.status) < statuses.indexOf("Submitted"),
  );
  const entryYear = profile?.entryYear ?? 2027;
  const now = new Date();
  const today = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
  const dates = saved
    .flatMap(({ school, entry }) =>
      entry.deadline &&
      entry.status !== "Decision received" &&
      (!entry.deadlineSource ||
        entry.deadlineSource.cycle === `Fall ${entryYear}`)
        ? [{ school, date: entry.deadline, source: entry.deadlineSource }]
        : [],
    )
    .sort((a, b) => a.date.localeCompare(b.date));
  const upcoming = dates.filter(({ date }) => date >= today).slice(0, 5);
  const overdue = dates.filter(
    ({ date, school }) =>
      date < today && active.some((item) => item.school.id === school.id),
  );
  const routes = applicationRoutes.map((route) => ({
    route,
    progress: routePreparationProgress(route, state),
  }));
  const resume = routes
    .filter(
      ({ progress }) => progress.done > 0 && progress.done < progress.total,
    )
    .sort((a, b) => b.progress.percent - a.progress.percent)[0];
  const checklist = [
    {
      label: t(
        "Add applicant details",
        "Добавить данные абитуриента",
        "Талапкер деректерін қосу",
      ),
      done: !!studio.name.trim() && !!studio.school.trim(),
      href: studioHref("profile"),
    },
    {
      label: t(
        "Save a university",
        "Сохранить университет",
        "Университетті сақтау",
      ),
      done: saved.length > 0,
      href: saved.length ? "/my-list" : "/explore",
    },
    {
      label: t(
        "Choose an intended major",
        "Указать специальность",
        "Мамандықты таңдау",
      ),
      done: !!profile?.major.trim(),
      href: studioHref("profile"),
    },
    {
      label: t("Add your grades", "Добавить оценки", "Бағаларды қосу"),
      done: !!profile?.grades.trim(),
      href: studioHref("profile"),
    },
    {
      label: t("Record an activity", "Добавить активность", "Іс-шара қосу"),
      done: studio.activities.length > 0,
      href: studioHref("activities"),
    },
    {
      label: t(
        "Start an essay draft",
        "Начать черновик эссе",
        "Эссе жобасын бастау",
      ),
      done: studio.essays.some((essay) => essay.text.trim()),
      href: studioHref("essays"),
    },
  ];
  const completed = checklist.filter((item) => item.done).length;

  return (
    <div className={styles.dashboard}>
      <header className={styles.welcome}>
        <h1>
          {firstName ? (
            <>
              {t("Welcome back, ", "С возвращением, ", "Қош келдіңіз, ")}
              <span>{firstName}</span>
            </>
          ) : (
            t(
              "Your application studio",
              "Ваш кабинет поступления",
              "Сіздің талапкер кабинетіңіз",
            )
          )}
        </h1>
        <div className={styles.actions}>
          <Link
            className={styles.primary}
            href={resume?.route.href ?? "#studio-applications"}
            prefetch={false}
          >
            {resume
              ? t(
                  "Resume application",
                  "Продолжить заявку",
                  "Өтінімді жалғастыру",
                )
              : t(
                  "Choose an application",
                  "Выбрать заявку",
                  "Өтінімді таңдау",
                )}{" "}
            <ArrowRight size={14} />
          </Link>
          <Link
            className={styles.quietLink}
            href={studioHref("profile")}
            prefetch={false}
          >
            {profile || firstName
              ? t("Open my profile", "Мой профиль", "Профилім")
              : t(
                  "Build my profile",
                  "Заполнить профиль",
                  "Профильді толтыру",
                )}{" "}
            <ArrowUpRight size={14} />
          </Link>
        </div>
      </header>

      <section
        className={styles.applications}
        aria-labelledby="studio-applications"
      >
        <div className={styles.heading}>
          <h2 id="studio-applications">
            <GraduationCap />
            {t("My applications", "Мои заявки", "Менің өтінімдерім")}
          </h2>
          <Link className={styles.smallLink} href="/explore" prefetch={false} aria-label={t("Explore universities", "Смотреть вузы", "Университеттерді көру")}>
            <Plus size={13} />
            {t("Add university", "Добавить вуз", "Университет қосу")}
          </Link>
        </div>
        <div className={styles.cards}>
          {routes.map(({ route, progress }) => (
            <article
              className={styles.card}
              key={route.id}
              data-route={route.art}
            >
              <Image
                className={styles.cardArt}
                src={`/applications/art/${route.art}.webp`}
                width={190}
                height={184}
                alt=""
                sizes="(max-width: 760px) 32vw, 155px"
                unoptimized
              />
              <h3>
                <Link href={route.href} prefetch={false}>
                  {route.name}
                </Link>
              </h3>
              <div className={styles.cardProgress}>
                <div>
                  <span>{t("Preparation", "Готовность", "Дайындық")}</span>
                  <strong>{progress.percent}%</strong>
                </div>
                <progress
                  value={progress.percent}
                  max={100}
                  aria-label={`${route.name} · ${t("Preparation", "Готовность", "Дайындық")}`}
                />
              </div>
              <Link
                className={styles.openCard}
                href={route.href}
                prefetch={false}
                aria-label={`${t("Open", "Открыть", "Ашу")} · ${route.name}`}
              >
                {t("Open", "Открыть", "Ашу")} <ChevronRight size={13} />
              </Link>
            </article>
          ))}
        </div>
      </section>

      <aside className={styles.rail}>
        <section className={styles.setup} aria-labelledby="studio-setup">
          <div className={styles.setupHeading}>
            <span
              className={styles.ring}
              style={{
                background: `conic-gradient(var(--home-blue) ${(completed / checklist.length) * 100}%, var(--home-subtle) 0)`,
              }}
              aria-hidden="true"
            />
            <h2 id="studio-setup">
              {t("Getting started", "Первые шаги", "Алғашқы қадамдар")}
            </h2>
            <span>
              {completed}/{checklist.length}
            </span>
          </div>
          <progress
            className="sr-only"
            value={completed}
            max={checklist.length}
            aria-label={t(
              "Setup progress",
              "Прогресс заполнения",
              "Толтыру барысы",
            )}
          />
          <ul>
            {checklist.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  prefetch={false}
                  data-done={item.done}
                  aria-label={
                    item.done
                      ? `${item.label} · ${t("Complete", "Готово", "Аяқталды")}`
                      : item.label
                  }
                >
                  <i aria-hidden="true">
                    {item.done && <Check size={12} strokeWidth={3} />}
                  </i>
                  <span>{item.label}</span>
                  <ChevronRight size={13} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <nav
          className={styles.tools}
          aria-label={t(
            "Application tools",
            "Инструменты заявки",
            "Өтінім құралдары",
          )}
        >
          {[
            {
              href: studioHref("essays"),
              title: t("Essay review", "Разбор эссе", "Эссені талдау"),
              Icon: FilePenLine,
            },
            {
              href: studioHref("activities"),
              title: t(
                "Activity review",
                "Разбор активностей",
                "Іс-шараларды талдау",
              ),
              Icon: Medal,
            },
            {
              href: studioHref("fit"),
              title: t("University fit", "Готовность к вузу", "Оқуға дайындық"),
              Icon: School,
            },
          ].map(({ href, title, Icon }) => (
            <Link key={href} href={href} prefetch={false}>
              <Icon size={16} />
              {title}
              <ChevronRight size={13} />
            </Link>
          ))}
        </nav>
      </aside>

      <section className={styles.planner} aria-labelledby="studio-upcoming">
        <div className={styles.heading}>
          <h2 id="studio-upcoming">
            <CalendarDays />
            {t("Upcoming deadlines", "Ближайшие сроки", "Алдағы мерзімдер")}
          </h2>
          <Link className={styles.smallLink} href="/planner" prefetch={false}>
            {t("Open planner", "Планировщик", "Жоспарлағыш")}
            <ChevronRight size={13} />
          </Link>
        </div>
        {upcoming.length ? (
          <ul className={styles.dates}>
            {upcoming.map(({ school, date, source }) => (
              <li key={school.id}>
                <SchoolMark school={school} info={homeSchools?.[school.id]} />
                <div>
                  <Link href={`/universities/${school.id}`} prefetch={false}>
                    {school.name}
                  </Link>
                  <small>
                    {source?.label ??
                      t(
                        "Your planner date",
                        "Срок из планировщика",
                        "Жоспардағы мерзім",
                      )}
                  </small>
                </div>
                <time dateTime={date}>
                  {new Intl.DateTimeFormat(language, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    timeZone: "UTC",
                  }).format(new Date(date))}
                </time>
              </li>
            ))}
          </ul>
        ) : (
          <Link className={styles.empty} href="/planner" prefetch={false}>
            <CalendarDays size={18} />
            <span>
              {t(
                "Track your first deadline",
                "Добавить первый срок",
                "Алғашқы мерзімді қосу",
              )}
            </span>
            <Plus size={15} />
          </Link>
        )}
        {overdue.length > 0 && (
          <details className={styles.overdue}>
            <summary>
              {t("Past due", "Срок прошёл", "Мерзімі өтті")}{" "}
              <span>{overdue.length}</span>
            </summary>
            {overdue.map(({ school, date }) => (
              <Link
                key={school.id}
                href={`/planner#status-${school.id}`}
                prefetch={false}
              >
                {school.name}
                <time dateTime={date}>{date}</time>
              </Link>
            ))}
          </details>
        )}
      </section>

      <section className={styles.saved} aria-labelledby="studio-saved">
        <div className={styles.heading}>
          <h2 id="studio-saved">
            <ListChecks />
            {t(
              "Saved universities",
              "Сохранённые вузы",
              "Сақталған университеттер",
            )}
          </h2>
          <Link className={styles.smallLink} href="/my-list" prefetch={false}>
            {t("View my list", "Мой список", "Тізімім")}
            <ChevronRight size={13} />
          </Link>
        </div>
        {active.length > 0 ? (
          <div className={styles.schoolList}>
            {active.map(({ school, entry }) => (
              <SchoolProgress
                key={school.id}
                school={school}
                entry={entry}
                info={homeSchools?.[school.id]}
                language={language}
                entryYear={entryYear}
              />
            ))}
          </div>
        ) : (
          <Link
            className={styles.empty}
            href={saved.length ? "/my-list" : "/explore"}
            prefetch={false}
          >
            <Bookmark size={18} />
            <span>
              {!ready
                ? t("Loading…", "Загрузка…", "Жүктелуде…")
                : saved.length
                  ? t(
                      "View submitted applications",
                      "Посмотреть отправленные заявки",
                      "Жіберілген өтінімдерді көру",
                    )
                  : t(
                      "Find a university to save",
                      "Выбрать вуз для списка",
                      "Тізімге университет таңдау",
                    )}
            </span>
            <ChevronRight size={15} />
          </Link>
        )}
      </section>
    </div>
  );
}

const statusLabels = {
  Interested: ["Interested", "В списке", "Тізімде"],
  Researching: ["Researching", "Изучаю", "Зерттелуде"],
  Preparing: ["Preparing", "Готовлю заявку", "Дайындалуда"],
  "Ready to apply": [
    "Ready to apply",
    "Готово к подаче",
    "Өтінім беруге дайын",
  ],
  Submitted: ["Submitted", "Отправлено", "Жіберілді"],
  "Decision received": [
    "Decision received",
    "Решение получено",
    "Шешім алынды",
  ],
} satisfies Record<SavedUniversity["status"], Copy>;

type SchoolProps = {
  school: SchoolOption;
  info?: StudioHomeSchoolInfo[string];
};

function SchoolMark({ school, info }: SchoolProps) {
  return (
    <UniversityMark
      university={{
        id: school.id,
        initials:
          info?.initials ??
          school.name
            .split(/\s+/)
            .map((word) => word[0])
            .join("")
            .slice(0, 3),
        color: info?.color ?? "#455981",
      }}
    />
  );
}

function SchoolProgress({
  school,
  entry,
  info,
  language,
  entryYear,
}: SchoolProps & {
  entry: SavedUniversity;
  language: Language;
  entryYear: number;
}) {
  const documents = Object.values(entry.requirementProgress ?? {}).filter(
    ({ status, reason }) => !(status === "Not applicable" && reason?.trim()),
  );
  const total = entry.tasks.length + documents.length;
  const done =
    entry.tasks.filter((task) => task.done).length +
    documents.filter(
      ({ status }) =>
        status === "Prepared" || status === "Self-reported sent or completed",
    ).length;
  const platform = info?.platform;
  const platformYear = platform?.cycle?.match(/\b20\d{2}\b/)?.[0];
  const t = (en: string, ru: string, kk: string) => tr(language, [en, ru, kk]);
  return (
    <article className={styles.schoolRow}>
      <SchoolMark school={school} info={info} />
      <div className={styles.schoolTitle}>
        <h3>
          <Link href={`/universities/${school.id}`} prefetch={false}>
            {school.name}
          </Link>
        </h3>
        <small>{tr(language, statusLabels[entry.status])}</small>
        {platform && (!platformYear || Number(platformYear) === entryYear) && (
          <a
            className={styles.source}
            href={platform.url}
            target="_blank"
            rel="noreferrer"
          >
            {platform.label}
            <ArrowUpRight size={11} />
          </a>
        )}
      </div>
      <div className={styles.schoolEnd}>
        {total > 0 && (
          <div className={styles.schoolProgress}>
            <span>
              {done}/{total}
            </span>
            <progress
              value={done}
              max={total}
              aria-label={t(
                "Items ready or complete",
                "Готовые и выполненные пункты",
                "Дайын және аяқталған тармақтар",
              )}
            />
          </div>
        )}
        <Link
          href={`/planner#status-${school.id}`}
          prefetch={false}
          aria-label={`${t("Open plan", "Открыть план", "Жоспарды ашу")} · ${school.name}`}
        >
          {t("Open plan", "Открыть план", "Жоспарды ашу")}
          <ChevronRight size={12} />
        </Link>
      </div>
    </article>
  );
}
