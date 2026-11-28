"use client";

import Link from "next/link";
import { ArrowUpRight, CalendarDays, Wallet } from "lucide-react";
import { useApp } from "@/components/providers";
import { verifiedDeadline } from "@/lib/admissions";
import type { Language } from "@/lib/advisor/contracts";
import { importOfficialDeadline } from "@/lib/planning";
import {
  admissionsSource,
  officialSource,
} from "@/lib/studio/application-plan";
import { tr } from "@/lib/studio/reviews";
import { dateLabel, money } from "@/lib/utils";
import type { Scholarship, University } from "@/types/domain";
import styles from "./university-application.module.css";

export function ApplicationFunding({
  school,
  awards,
  language,
  intake,
}: {
  school: University;
  awards: Scholarship[];
  language: Language;
  intake: string;
}) {
  const { state, ready, blocked, update } = useApp();
  const t = (en: string, ru: string, kk: string) => tr(language, [en, ru, kk]);
  const today = new Date().toISOString().slice(0, 10);
  const allDeadlines = school.deadlines.value ?? [];
  const upcoming = allDeadlines
    .filter(
      (item) => verifiedDeadline(school, item, intake) && item.date! >= today,
    )
    .sort((a, b) => a.date!.localeCompare(b.date!));
  const references = allDeadlines.filter((item) => !upcoming.includes(item));
  const saved = state.saved.find((item) => item.universityId === school.id);
  const cost = school.annualCost.value;
  const costEvidence = officialSource(school, school.annualCost.sourceIds);
  const form = school.aidForms.value;
  const formEvidence = officialSource(school, school.aidForms.sourceIds);
  const official = admissionsSource(school)?.url ?? school.website;

  return (
    <div className={styles.stack}>
      <section className={styles.panel}>
        <header className={styles.panelHeader}>
          <div>
            <h2>
              <CalendarDays size={20} />{" "}
              {t(
                "Application and aid deadlines",
                "Сроки подачи и финансирования",
                "Өтінім мен қаржыландыру мерзімдері",
              )}
            </h2>
            <p>
              {t(
                "Upcoming dates verified for",
                "Подтверждённые ближайшие сроки для цикла",
                "Осы қабылдау үшін расталған алдағы мерзімдер",
              )}{" "}
              {intake}
            </p>
          </div>
          <a
            href={official}
            className={styles.secondary}
            target="_blank"
            rel="noreferrer"
          >
            {t("Official admissions", "Официальный приём", "Ресми қабылдау")}{" "}
            <ArrowUpRight size={15} />
          </a>
        </header>
        {upcoming.length ? (
          <ul className={styles.deadlines}>
            {upcoming.map((item, index) => {
              const source = officialSource(
                school,
                item.sourceIds ?? school.deadlines.sourceIds,
              );
              const tracked =
                saved?.deadline === item.date &&
                saved.deadlineSource?.label === item.label;
              return (
                <li key={`${item.label}-${index}`}>
                  <div>
                    <h3>{item.label}</h3>
                    {item.note && <p>{item.note}</p>}
                    {source && (
                      <a
                        className={styles.sourceLink}
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {t("Source", "Источник", "Дереккөз")}{" "}
                        <ArrowUpRight size={13} />
                      </a>
                    )}
                  </div>
                  <div className={styles.deadlineDate}>
                    <time dateTime={item.date!}>{dateLabel(item.date)}</time>
                    <button
                      className={styles.secondary}
                      type="button"
                      disabled={!ready || blocked || tracked}
                      onClick={() => {
                        if (
                          saved?.deadline &&
                          !window.confirm(
                            t(
                              "Replace this university’s saved planner deadline?",
                              "Заменить сохранённый срок для этого вуза?",
                              "Осы университеттің сақталған мерзімін ауыстыру керек пе?",
                            ),
                          )
                        )
                          return;
                        update((current) =>
                          importOfficialDeadline(
                            current,
                            school,
                            item,
                            intake,
                            today,
                          ),
                        );
                      }}
                    >
                      {tracked
                        ? t("Tracked", "Добавлено", "Қосылды")
                        : t("Track date", "Добавить срок", "Мерзімді қосу")}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className={styles.empty}>
            {t(
              "No upcoming dates are verified for this intake. Confirm your round and funding dates at the university.",
              "На этот цикл ближайшие сроки не подтверждены. Сверьте сроки своего раунда и финансирования на сайте вуза.",
              "Осы кезеңнің алдағы мерзімдері әлі расталмаған. Раунд пен қаржыландыру мерзімдерін университет сайтынан қараңыз.",
            )}
          </p>
        )}
        {!!references.length && (
          <details className={styles.referenceDates}>
            <summary>
              {t(
                "Past dates and dates to confirm",
                "Прошедшие сроки и даты для проверки",
                "Өткен және тексерілетін мерзімдер",
              )}
            </summary>
            <ul className={styles.deadlines}>
              {references.map((item, index) => {
                const source = officialSource(
                  school,
                  item.sourceIds ?? school.deadlines.sourceIds,
                );
                return (
                  <li key={`${item.label}-${index}`}>
                    <div>
                      <h3>{item.label}</h3>
                      {item.note && <p>{item.note}</p>}
                      {source && (
                        <a
                          className={styles.sourceLink}
                          href={source.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {t("Source", "Источник", "Дереккөз")}{" "}
                          <ArrowUpRight size={13} />
                        </a>
                      )}
                    </div>
                    <div className={styles.deadlineDate}>
                      {item.date && (
                        <time dateTime={item.date}>{dateLabel(item.date)}</time>
                      )}
                      <span>
                        {item.cycle ??
                          t(
                            "Intake unconfirmed",
                            "Цикл не подтверждён",
                            "Кезең расталмаған",
                          )}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </details>
        )}
      </section>

      <section className={styles.panel}>
        <header className={styles.panelHeader}>
          <div>
            <h2>
              <Wallet size={20} />{" "}
              {t(
                "Cost and funding",
                "Стоимость и финансирование",
                "Оқу құны мен қаржыландыру",
              )}
            </h2>
            <p>
              {t(
                "Review the published budget and which forms to submit.",
                "Сверьте опубликованную стоимость и необходимые формы.",
                "Жарияланған құн мен тапсыратын формаларды тексеріңіз.",
              )}
            </p>
          </div>
          <Link
            href={`/calculator?university=${school.id}`}
            className={styles.secondary}
          >
            {t(
              "Budget calculator",
              "Калькулятор бюджета",
              "Бюджет калькуляторы",
            )}
          </Link>
        </header>
        <div className={styles.fundingFacts}>
          <div>
            <h3>
              {t(
                "Published annual cost",
                "Опубликованная стоимость за год",
                "Жарияланған жылдық оқу құны",
              )}
            </h3>
            {cost !== null && costEvidence ? (
              <>
                <strong>{money(cost, school.costCurrency)}</strong>
                <p>
                  {school.annualCost.cycle ??
                    school.costCycle ??
                    t(
                      "Academic year unspecified",
                      "Учебный год не указан",
                      "Оқу жылы көрсетілмеген",
                    )}
                </p>
                {school.annualCost.scope && (
                  <p>{school.annualCost.scope.program}</p>
                )}
                <a
                  className={styles.sourceLink}
                  href={costEvidence.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {t(
                    "Cost details",
                    "Подробности о стоимости",
                    "Құн туралы мәліметтер",
                  )}{" "}
                  <ArrowUpRight size={13} />
                </a>
              </>
            ) : (
              <p>
                {t(
                  "Confirm the full budget with the university.",
                  "Уточните полную стоимость в вузе.",
                  "Толық бюджетті университеттен анықтаңыз.",
                )}
              </p>
            )}
          </div>
          <div>
            <h3>
              {t(
                "Aid forms",
                "Формы финансовой помощи",
                "Қаржылық көмек формалары",
              )}
            </h3>
            <p>
              {form && formEvidence
                ? form
                : t(
                    "Check which forms international applicants need.",
                    "Уточните формы для иностранных абитуриентов.",
                    "Шетелдік талапкерлерге қажетті формаларды тексеріңіз.",
                  )}
            </p>
            {form && formEvidence && (
              <a
                className={styles.sourceLink}
                href={formEvidence.url}
                target="_blank"
                rel="noreferrer"
              >
                {t(
                  "Forms and instructions",
                  "Формы и инструкции",
                  "Формалар мен нұсқаулар",
                )}{" "}
                <ArrowUpRight size={13} />
              </a>
            )}
          </div>
        </div>
        {!!awards.length && (
          <div className={styles.awards}>
            <h3>
              {t(
                "Funding options",
                "Варианты финансирования",
                "Қаржыландыру нұсқалары",
              )}
            </h3>
            {awards.map((award) => (
              <details className={styles.award} key={award.id}>
                <summary>{award.name}</summary>
                <p>{award.coverage}</p>
                <dl>
                  {award.separateApplication && (
                    <div>
                      <dt>{t("Application", "Заявка", "Өтінім")}</dt>
                      <dd>{award.separateApplication}</dd>
                    </div>
                  )}
                  {award.renewal && (
                    <div>
                      <dt>{t("Renewal", "Продление", "Ұзарту")}</dt>
                      <dd>{award.renewal}</dd>
                    </div>
                  )}
                </dl>
                <a
                  className={styles.sourceLink}
                  href={award.source.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {t(
                    "Eligibility and deadlines",
                    "Право на участие и сроки",
                    "Қатысу талаптары мен мерзімдері",
                  )}{" "}
                  <ArrowUpRight size={13} />
                </a>
              </details>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
