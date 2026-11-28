"use client";

import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  CircleCheck,
  CircleHelp,
  ClipboardList,
  FilePenLine,
  ListChecks,
  TriangleAlert,
} from "lucide-react";
import { useState } from "react";
import { useApp } from "@/components/providers";
import {
  admissionsSource,
  officialEssaySource,
} from "@/lib/studio/application-plan";
import { readinessTitles } from "@/lib/studio/copy";
import { checkReadiness, tr, type Copy } from "@/lib/studio/reviews";
import type { AdmissionsDossier } from "@/types/admissions";
import type { Scholarship, University } from "@/types/domain";
import { emptyStudio } from "@/types/studio";
import { ApplicationChecklist } from "./application-checklist";
import { ApplicationFunding } from "./application-funding";
import { ApplicationHeading } from "./application-lock";
import { EssayWorkbench } from "./essay-workbench";
import styles from "./university-application.module.css";

const tabs = {
  fit: {
    Icon: ListChecks,
    label: ["Fit review", "Сверка профиля", "Профиль тексерісі"],
  },
  checklist: {
    Icon: ClipboardList,
    label: ["Checklist", "Документы", "Құжаттар"],
  },
  funding: {
    Icon: CalendarDays,
    label: ["Funding & dates", "Бюджет и сроки", "Қаржы мен мерзім"],
  },
  essays: { Icon: FilePenLine, label: ["Essays", "Эссе", "Эссе"] },
} satisfies Record<string, { Icon: typeof ListChecks; label: Copy }>;
type Tab = keyof typeof tabs;

export function UniversityApplication({
  school,
  dossier,
  awards,
  writingSource,
}: {
  school: University;
  dossier?: AdmissionsDossier;
  awards: Scholarship[];
  writingSource: ReturnType<typeof officialEssaySource>;
}) {
  const { state, ready, update } = useApp();
  const studio = state.studio ?? emptyStudio;
  const language = studio.language ?? "en";
  const t = (en: string, ru: string, kk: string) => tr(language, [en, ru, kk]);
  const [tab, setTab] = useState<Tab>("fit");
  const profile = state.profile?.isDemo ? null : state.profile;
  const entryYear = profile?.entryYear ?? 2027;
  const intake = `Fall ${entryYear}`;
  const essays = studio.essays.filter(
    (draft) => draft.schoolId === school.id && draft.text.trim().length > 0,
  );
  const assessment = ready
    ? checkReadiness(school, profile, {
        activities: studio.activities.length,
        essays: essays.length,
      })
    : [];
  const results = {
    aligned: {
      Icon: CircleCheck,
      label: t("Supported", "Есть подтверждение", "Расталған"),
    },
    review: {
      Icon: TriangleAlert,
      label: t("Needs work", "Требует подготовки", "Дайындық керек"),
    },
    unknown: {
      Icon: CircleHelp,
      label: t("Check details", "Уточнить", "Нақтылау"),
    },
  };
  const writingUrl = writingSource?.url ?? school.website;
  const admissionUrl = admissionsSource(school)?.url ?? school.website;

  return (
    <div className={styles.workspace} lang={language}>
      <ApplicationHeading school={school} plan="pro" />
      <div className={styles.workspaceTitle}>
        <h2>
          {t("Application workspace", "Кабинет для подачи", "Өтінім кабинеті")}
        </h2>
        <span>
          <CalendarDays size={16} /> {t("Fall", "Осень", "Күз")} {entryYear}
        </span>
      </div>
      <div
        className={styles.tabs}
        role="group"
        aria-label={t(
          "Application sections",
          "Разделы заявки",
          "Өтінім бөлімдері",
        )}
      >
        {(Object.keys(tabs) as Tab[]).map((key) => {
          const { Icon, label } = tabs[key];
          return (
            <button
              key={key}
              type="button"
              aria-pressed={tab === key}
              aria-controls={`application-${key}`}
              disabled={!ready}
              onClick={() => setTab(key)}
            >
              <Icon size={17} /> {tr(language, label)}
            </button>
          );
        })}
      </div>
      <div
        id="application-fit"
        hidden={tab !== "fit"}
        className={styles.tabContent}
      >
        <section className={styles.panel}>
          <header className={styles.panelHeader}>
            <div>
              <h2>
                <ListChecks size={20} />{" "}
                {t("Profile fit review", "Сверка профиля", "Профильді тексеру")}
              </h2>
              <p>
                {t(
                  "See which requirements you can check now and what needs confirmation.",
                  "Посмотрите, какие требования можно сверить сейчас и что ещё уточнить.",
                  "Қазір қай талаптарды тексеруге болатынын және нені нақтылау керегін көріңіз.",
                )}
              </p>
            </div>
            <Link href="/studio?view=profile" className={styles.secondary}>
              {profile
                ? t("Edit profile", "Изменить профиль", "Профильді өзгерту")
                : t(
                    "Set up profile",
                    "Заполнить профиль",
                    "Профильді толтыру",
                  )}{" "}
              <ArrowRight size={15} />
            </Link>
          </header>
          {!ready ? (
            <p className={styles.empty}>
              {t(
                "Loading your workspace…",
                "Загружаем кабинет…",
                "Кабинет жүктелуде…",
              )}
            </p>
          ) : (
            <>
              <div className={styles.fitStats}>
                {Object.entries(results).map(([key, { Icon, label }]) => (
                  <div key={key} data-state={key}>
                    <span>
                      <Icon size={16} /> {label}
                    </span>
                    <strong>
                      {assessment.filter((item) => item.state === key).length}
                    </strong>
                  </div>
                ))}
              </div>
              <ul className={styles.fitList}>
                {assessment.map((item) => {
                  const { Icon, label } = results[item.state];
                  const source = item.sources?.[0];
                  return (
                    <li key={item.key}>
                      <div>
                        <h3>{tr(language, readinessTitles[item.key])}</h3>
                        <p>{tr(language, item.message)}</p>
                        {source && (
                          <details className={styles.source}>
                            <summary>
                              {t("Source", "Источник", "Дереккөз")}
                            </summary>
                            <a
                              href={source.url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {source.title} <ArrowUpRight size={13} />
                            </a>
                          </details>
                        )}
                      </div>
                      <span
                        className={styles.stateChip}
                        data-state={item.state}
                      >
                        <Icon size={15} /> {label}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </section>
      </div>
      <div
        id="application-checklist"
        hidden={tab !== "checklist"}
        className={styles.tabContent}
      >
        <ApplicationChecklist
          school={school}
          dossier={dossier}
          language={language}
          intake={intake}
        />
      </div>
      <div
        id="application-funding"
        hidden={tab !== "funding"}
        className={styles.tabContent}
      >
        <ApplicationFunding
          school={school}
          awards={awards}
          language={language}
          intake={intake}
        />
      </div>
      <div
        id="application-essays"
        hidden={tab !== "essays"}
        className={styles.tabContent}
      >
        <div className={styles.stack}>
          <section className={styles.panel}>
            <header className={styles.panelHeader}>
              <div>
                <h2>
                  <BookOpen size={20} />{" "}
                  {t(
                    "University essays",
                    "Эссе для вуза",
                    "Университетке арналған эсселер",
                  )}
                </h2>
                <p>
                  {t(
                    "Copy the prompt and word limit from your application before you create a draft.",
                    "Перед созданием черновика скопируйте задание и лимит слов из вашей заявки.",
                    "Жоба жасамас бұрын өтінімдегі тапсырма мен сөз шегін көшіріңіз.",
                  )}
                </p>
              </div>
              <a
                href={writingUrl}
                className={styles.secondary}
                target="_blank"
                rel="noreferrer"
              >
                {t(
                  "Official instructions",
                  "Официальные инструкции",
                  "Ресми нұсқаулар",
                )}{" "}
                <ArrowUpRight size={15} />
              </a>
            </header>
          </section>
          {ready && (
            <EssayWorkbench
              key={school.id}
              language={language}
              studio={studio}
              schools={[school]}
              fixedSchoolId={school.id}
              save={(apply) =>
                update((current) => ({
                  ...current,
                  studio: apply(current.studio ?? emptyStudio),
                }))
              }
            />
          )}
        </div>
      </div>
      <a
        className={styles.footerLink}
        href={admissionUrl}
        target="_blank"
        rel="noreferrer"
      >
        {t(
          "Official university admissions",
          "Приёмная комиссия вуза",
          "Университеттің қабылдау комиссиясы",
        )}{" "}
        <ArrowUpRight size={14} />
      </a>
    </div>
  );
}
