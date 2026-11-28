"use client";

import {
  ArrowLeft,
  Check,
  Code2,
  Dumbbell,
  FlaskConical,
  HandHeart,
  Medal,
  Music2,
  Pencil,
  Plus,
  Trash2,
  UsersRound,
  BriefcaseBusiness,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import {
  activitySchema,
  activityCategories,
  activityReach,
  maxActivities,
  type Activity,
} from "@/types/studio";
import {
  activityNames,
  activityReachNames,
  activityTierGuide,
  activityTierReasons,
} from "@/lib/studio/copy";
import {
  activityTiers,
  reviewActivity,
  tr,
  type ActivityTier,
} from "@/lib/studio/reviews";
import type { StudioProps } from "./types";
import styles from "./studio.module.css";

const activityIcon = {
  club: UsersRound,
  project: Code2,
  research: FlaskConical,
  competition: Medal,
  service: HandHeart,
  sport: Dumbbell,
  art: Music2,
  work: BriefcaseBusiness,
};

function TierBadge({
  tier,
  language,
}: {
  tier: ActivityTier;
  language: StudioProps["language"];
}) {
  return (
    <span className={styles.activityTier} data-tier={tier}>
      {tr(language, [`${tier} tier`, `Уровень ${tier}`, `${tier} деңгейі`])}
    </span>
  );
}

export function ActivitiesEditor({ language, studio, save }: StudioProps) {
  const t = (en: string, ru: string, kk: string) => tr(language, [en, ru, kk]);
  const [draft, setDraft] = useState<Activity | null>(null);
  const review = draft ? reviewActivity(draft) : null;
  const existing =
    draft && studio.activities.some((entry) => entry.id === draft.id);
  const set = <K extends keyof Activity>(key: K, value: Activity[K]) =>
    setDraft((old) => (old ? { ...old, [key]: value } : null));
  function persist(event: FormEvent) {
    event.preventDefault();
    const validated = activitySchema.safeParse(draft);
    if (
      !validated.success ||
      (!existing && studio.activities.length >= maxActivities)
    )
      return;
    if (
      save((old) => ({
        ...old,
        activities: [
          validated.data,
          ...old.activities.filter((item) => item.id !== validated.data.id),
        ],
      }))
    )
      setDraft(null);
  }

  return (
    <div className={styles.stack}>
      {draft ? (
        <form
          onSubmit={persist}
          className={`${styles.panel} ${styles.activityEditor}`}
        >
          <div className={styles.activityToolbar}>
            <button
              type="button"
              className={styles.textButton}
              onClick={() => setDraft(null)}
            >
              <ArrowLeft size={16} />
              {t("All activities", "Все активности", "Барлық іс-шаралар")}
            </button>
            <output
              aria-label={t(
                "Estimated tier",
                "Примерный уровень",
                "Шамаланған деңгей",
              )}
              aria-describedby={review ? "activity-tier-reason" : undefined}
            >
              {review && <TierBadge tier={review.tier} language={language} />}
            </output>
          </div>
          {review && (
            <p id="activity-tier-reason" className={styles.activityReason}>
              {tr(language, activityTierReasons[review.reason])}
            </p>
          )}
          <div className={styles.fields}>
            <label>
              {t("Activity name", "Название активности", "Іс-шара атауы")}
              <input
                required
                maxLength={120}
                value={draft.title}
                onChange={(e) => set("title", e.target.value)}
              />
            </label>
            <label>
              {t("Category", "Категория", "Санат")}
              <select
                value={draft.category}
                onChange={(e) =>
                  set("category", e.target.value as Activity["category"])
                }
              >
                {activityCategories.map((kind) => (
                  <option value={kind} key={kind}>
                    {tr(language, activityNames[kind])}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.wide}>
              {t("Your role", "Ваша роль", "Рөліңіз")}
              <input
                maxLength={120}
                value={draft.role}
                onChange={(e) => set("role", e.target.value)}
              />
            </label>
            <label>
              {t("Months involved", "Месяцев участия", "Қатысу айлары")}
              <input
                type="number"
                min={0}
                max={120}
                step={1}
                value={draft.months || ""}
                onChange={(e) => set("months", Number(e.target.value))}
              />
            </label>
            <label>
              {t("Hours per week", "Часов в неделю", "Апталық сағат")}
              <input
                type="number"
                min={0}
                max={112}
                step={0.5}
                value={draft.hours || ""}
                onChange={(e) => set("hours", Number(e.target.value))}
              />
            </label>
            <label className={styles.wide}>
              {t("What did you do?", "Что вы сделали?", "Не істедіңіз?")}
              <textarea
                rows={3}
                maxLength={1000}
                value={draft.action}
                onChange={(e) => set("action", e.target.value)}
              />
            </label>
            <label className={styles.wide}>
              {t(
                "What changed as a result?",
                "Какой получился результат?",
                "Нәтижесінде не өзгерді?",
              )}
              <textarea
                rows={2}
                maxLength={1000}
                value={draft.impact}
                onChange={(e) => set("impact", e.target.value)}
              />
            </label>
            <label>
              {t("Reach", "Масштаб", "Ауқым")}
              <select
                value={draft.reach ?? ""}
                onChange={(e) =>
                  set(
                    "reach",
                    activityReach.find((kind) => kind === e.target.value),
                  )
                }
              >
                <option value="">
                  {t(
                    "Select if known",
                    "Выберите, если знаете",
                    "Белгілі болса, таңдаңыз",
                  )}
                </option>
                {activityReach.map((kind) => (
                  <option value={kind} key={kind}>
                    {tr(language, activityReachNames[kind])}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t(
                "Evidence or recognition",
                "Подтверждение или награда",
                "Дәлел немесе марапат",
              )}
              <input
                maxLength={400}
                value={draft.evidence}
                onChange={(e) => set("evidence", e.target.value)}
              />
            </label>
          </div>
          <div className={styles.inlineActions}>
            <button type="submit" className={styles.primary}>
              <Check size={16} />
              {t("Save activity", "Сохранить активность", "Іс-шараны сақтау")}
            </button>
            {existing && (
              <button
                type="button"
                className={styles.textButton}
                onClick={() => {
                  if (
                    save((old) => ({
                      ...old,
                      activities: old.activities.filter(
                        (item) => item.id !== draft.id,
                      ),
                    }))
                  )
                    setDraft(null);
                }}
              >
                <Trash2 size={16} />
                {t("Delete", "Удалить", "Өшіру")}
              </button>
            )}
          </div>
        </form>
      ) : (
        <section>
          <div className={styles.activityToolbar}>
            {!!studio.activities.length && (
              <span className={styles.activityCaption}>
                {t(
                  "Estimated tiers",
                  "Примерные уровни",
                  "Шамаланған деңгейлер",
                )}
              </span>
            )}
            <button
              type="button"
              className={styles.primary}
              disabled={studio.activities.length >= maxActivities}
              onClick={() => {
                setDraft({
                  id: crypto.randomUUID(),
                  title: "",
                  role: "",
                  category: "project",
                  months: 0,
                  hours: 0,
                  action: "",
                  impact: "",
                  evidence: "",
                });
              }}
            >
              <Plus size={17} />
              {t("Add activity", "Добавить активность", "Іс-шара қосу")}
            </button>
          </div>
          {studio.activities.length ? (
            <div className={styles.activityList}>
              {studio.activities.map((item) => {
                const Icon = activityIcon[item.category];
                const tier = reviewActivity(item)?.tier;
                const summary = item.impact || item.action;
                return (
                  <button
                    type="button"
                    className={styles.activityRow}
                    key={item.id}
                    onClick={() => setDraft(item)}
                  >
                    <span
                      className={styles.activityIcon}
                      data-kind={item.category}
                    >
                      <Icon size={18} aria-hidden="true" />
                    </span>
                    <span className={styles.activityContent}>
                      <strong>{item.title}</strong>
                      <small>
                        {[
                          tr(language, activityNames[item.category]),
                          item.role,
                          item.reach &&
                            tr(language, activityReachNames[item.reach]),
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </small>
                      {summary && (
                        <span className={styles.activitySummary}>
                          {summary}
                        </span>
                      )}
                    </span>
                    <span className={styles.activityActions}>
                      {tier && <TierBadge tier={tier} language={language} />}
                      <Pencil size={15} aria-hidden="true" />
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className={styles.empty}>
              <Medal size={25} />
              <p>
                {t(
                  "Add a project, club, job or other activity.",
                  "Добавьте проект, клуб, работу или другую активность.",
                  "Жобаны, үйірмені, жұмысты немесе басқа іс-шараны қосыңыз.",
                )}
              </p>
            </div>
          )}
        </section>
      )}
      {(draft || studio.activities.length > 0) && (
        <details className={styles.activityGuide}>
          <summary>{t("How tiers work", "Как определяются уровни", "Деңгей қалай анықталады")}</summary>
          <dl>
            {activityTiers.map((tier) => (
              <div key={tier}>
                <dt><TierBadge tier={tier} language={language} /></dt>
                <dd>{tr(language, activityTierGuide[tier])}</dd>
              </div>
            ))}
          </dl>
        </details>
      )}
    </div>
  );
}
