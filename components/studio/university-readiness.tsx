"use client";

import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CircleCheck,
  CircleHelp,
  ClipboardCheck,
  Info,
  School,
} from "lucide-react";
import { useApp } from "@/components/providers";
import { researchedSATContext, cdsSAT2025 } from "@/data/cds-sat-2025";
import { checkReadiness, tr } from "@/lib/studio/reviews";
import { readinessTitles } from "@/lib/studio/copy";
import type { University } from "@/types/domain";
import type { SchoolOption, StudioProps } from "./types";
import style from "./studio.module.css";

export function UniversityReadiness({
  language,
  studio,
  save,
  schools,
  school,
}: StudioProps & { schools: SchoolOption[]; school?: University }) {
  const t = (en: string, ru: string, kk: string) => tr(language, [en, ru, kk]);
  const { state, ready } = useApp();
  const saved = new Set(state.saved.map(({ universityId }) => universityId));
  const ranked = [...schools].sort(
    (a, b) => Number(saved.has(b.id)) - Number(saved.has(a.id)),
  );
  const assessment =
    school && ready
      ? checkReadiness(school, state.profile, {
          activities: studio.activities.length,
          essays: studio.essays.filter(
            (item) =>
              item.text.trim().length &&
              (!item.schoolId || item.schoolId === school.id),
          ).length,
        })
      : undefined;
  const statuses = {
    aligned: t("Supported", "Есть подтверждение", "Дәлелі бар"),
    review: t("Needs work", "Нужно доработать", "Дамыту керек"),
    unknown: t("Check details", "Уточните условия", "Шарттарды тексеріңіз"),
  };
  const satContext = school ? researchedSATContext(school) : null;
  const range =
    school &&
    satContext &&
    (cdsSAT2025[school.id] ||
      school.sources.some(
        (source) =>
          source.url === satContext.source &&
          source.status === "verified" &&
          school.satMiddle50.sourceIds.includes(source.id),
      ))
      ? satContext
      : null;
  const sat = state.profile?.sat;
  const mark = (score: number) =>
    Math.max(0, Math.min(100, ((score - 400) / 1200) * 100)) + "%";
  const history = (studio.recentSchools ?? []).flatMap(({ id, checkedAt }) => {
    const item = schools.find((option) => option.id === id);
    return item ? [{ ...item, checkedAt }] : [];
  });

  return (
    <div className={style.stack}>
      <section className={style.panel}>
        <form
          action="/studio"
          method="get"
          className={style.schoolForm}
          onSubmit={(event) => {
            const target = new FormData(event.currentTarget).get("school");
            if (
              typeof target === "string" &&
              schools.some((item) => item.id === target)
            ) {
              const checkedAt = new Date().toISOString();
              save((old) => ({
                ...old,
                recentSchools: [
                  { id: target, checkedAt },
                  ...(old.recentSchools ?? []).filter(
                    (item) => item.id !== target,
                  ),
                ].slice(0, 8),
              }));
            }
          }}
        >
          <input type="hidden" name="view" value="fit" />
          <label>
            {t(
              "Choose a university",
              "Выберите университет",
              "Университетті таңдаңыз",
            )}
            <select name="school" defaultValue={school?.id ?? ""} required>
              <option value="">
                {t(
                  "Select from the AidMap catalogue",
                  "Выбрать из каталога AidMap",
                  "AidMap каталогынан таңдау",
                )}
              </option>
              {ranked.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name} · {option.country}
                </option>
              ))}
            </select>
          </label>
          <button className={style.primary} type="submit" disabled={!ready}>
            <ClipboardCheck size={17} />
            {t("Check readiness", "Проверить готовность", "Дайындықты тексеру")}
          </button>
        </form>
      </section>
      {school && assessment ? (
        <>
          <section className={style.fitSummary}>
            <div className={style.featureIcon} data-tint="mint">
              <School size={23} />
            </div>
            <div>
              <h2>{school.name}</h2>
              <p>
                {school.city ? school.city + ", " : ""}
                {school.country} · Fall {state.profile?.entryYear ?? 2027}
              </p>
              <p>
                {t(
                  "Readiness checks cover your application and available evidence. Admission decisions depend on the university’s full review.",
                  "Проверка опирается на вашу заявку и доступные данные. Решение зависит от полного рассмотрения заявки университетом.",
                  "Тексеру өтініміңіз бен қолжетімді деректерге сүйенеді. Қабылдау шешімін университет толық қараудан кейін қабылдайды.",
                )}
              </p>
            </div>
            <div className={style.fitCount}>
              <strong>
                {assessment.filter((item) => item.state === "aligned").length}/
                {assessment.length}
              </strong>
              <small>
                {t(
                  "checks supported",
                  "пунктов подтверждено",
                  "тармақ расталды",
                )}
              </small>
              <Link href={"/universities/" + school.id}>
                {t("University profile", "Профиль вуза", "Университет профилі")}
                <ArrowUpRight size={14} />
              </Link>
            </div>
          </section>
          {!state.profile && (
            <p className={style.callout}>
              <Info size={17} />
              {t(
                "Add your profile for tailored checks.",
                "Заполните профиль для персональной проверки.",
                "Жеке тексеру үшін профильді толтырыңыз.",
              )}{" "}
              <Link href="/studio?view=profile">
                {t("Open profile", "Открыть профиль", "Профильді ашу")}
                <ArrowRight size={14} />
              </Link>
            </p>
          )}
          <div className={style.readinessGrid}>
            {assessment.map((item) => {
              const Icon =
                item.state === "aligned"
                  ? CircleCheck
                  : item.state === "review"
                    ? Info
                    : CircleHelp;
              return (
                <article
                  className={style.panel + " " + style.readinessItem}
                  key={item.key}
                  data-state={item.state}
                >
                  <div>
                    <h3>{tr(language, readinessTitles[item.key])}</h3>
                    <span>
                      <Icon size={14} />
                      {statuses[item.state]}
                    </span>
                  </div>
                  <p>{tr(language, item.message)}</p>
                  {!!item.sources?.length && (
                    <div className={style.sources}>
                      {item.sources.map((source) => (
                        <a
                          key={source.id}
                          href={source.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {source.title}
                          <ArrowUpRight size={13} />
                        </a>
                      ))}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
          {range && (
            <section className={style.panel}>
              <div className={style.listHeading}>
                <h2>
                  {t(
                    "Published SAT context",
                    "Данные SAT прошлых наборов",
                    "Алдыңғы кезеңдердің SAT деректері",
                  )}
                </h2>
                <a
                  className={style.textButton}
                  href={range.source}
                  target="_blank"
                  rel="noreferrer"
                >
                  {t(
                    "Official source",
                    "Официальный источник",
                    "Ресми дереккөз",
                  )}
                  <ArrowUpRight size={14} />
                </a>
              </div>
              <p className={style.quiet}>
                {t(
                  "Reported middle half",
                  "Опубликованный диапазон для средних 50%",
                  "Ортаңғы 50% үшін жарияланған аралық",
                )}{" "}
                ·{" "}
                <strong>
                  {range.p25}–{range.p75}
                </strong>{" "}
                · {range.cohort}
              </p>
              <div className={style.satScale} aria-hidden="true">
                <span
                  style={{
                    left: mark(range.p25),
                    right: "calc(100% - " + mark(range.p75) + ")",
                  }}
                />
                {sat != null && <i style={{ left: mark(sat) }} />}
              </div>
              <div className={style.scaleLabels} aria-hidden="true">
                <span>400</span>
                <span>1600</span>
              </div>
              <p className={style.quiet}>
                {sat == null
                  ? t(
                      "Add your SAT in your profile to compare it with the published range.",
                      "Добавьте SAT в профиль для сравнения с опубликованным диапазоном.",
                      "Жарияланған аралықпен салыстыру үшін SAT балын профиліңізге қосыңыз.",
                    )
                  : t("Your SAT", "Ваш SAT", "SAT нәтижеңіз") +
                    " " +
                    sat +
                    " · " +
                    (sat < range.p25
                      ? t(
                          "below the reported range",
                          "ниже опубликованного диапазона",
                          "жарияланған аралықтан төмен",
                        )
                      : sat > range.p75
                        ? t(
                            "above the reported range",
                            "выше опубликованного диапазона",
                            "жарияланған аралықтан жоғары",
                          )
                        : t(
                            "within the reported range",
                            "внутри опубликованного диапазона",
                            "жарияланған аралық ішінде",
                          ))}
              </p>
            </section>
          )}
          <div className={style.inlineActions}>
            <Link
              className={style.secondary}
              href={"/advisor?university=" + school.id}
            >
              {t(
                "Ask about this university",
                "Спросить об этом вузе",
                "Университет туралы сұрау",
              )}
              <ArrowRight size={15} />
            </Link>
          </div>
        </>
      ) : (
        !school && (
          <section className={style.panel + " " + style.empty}>
            <School size={25} />
            <p>
              {t(
                "Choose a university to see programme, test, budget and application checks.",
                "Выберите вуз, чтобы сверить программы, тесты, бюджет и материалы заявки.",
                "Бағдарлама, тест, бюджет және өтінім материалдарын тексеру үшін университет таңдаңыз.",
              )}
            </p>
          </section>
        )
      )}
      {!!history.length && (
        <section className={style.panel}>
          <h2>
            {t(
              "Recently checked",
              "Недавно проверенные вузы",
              "Жуырда тексерілген университеттер",
            )}
          </h2>
          <ul className={style.savedSchools}>
            {history.slice(0, 4).map((item) => (
              <li key={item.id}>
                <Link
                  href={"/studio?view=fit&school=" + item.id}
                  prefetch={false}
                >
                  <strong>{item.name}</strong>
                  <small>
                    {new Intl.DateTimeFormat(language, {
                      dateStyle: "medium",
                    }).format(new Date(item.checkedAt))}
                  </small>
                  <ArrowRight size={15} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
