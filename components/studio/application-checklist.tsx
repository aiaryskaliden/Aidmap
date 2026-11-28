"use client";

import Link from "next/link";
import { ArrowUpRight, ClipboardList } from "lucide-react";
import { useApp } from "@/components/providers";
import type { Language } from "@/lib/advisor/contracts";
import {
  applicationDocuments,
  admissionsSource,
} from "@/lib/studio/application-plan";
import { progressStates } from "@/lib/requirements";
import { toggleSaved, updateSaved } from "@/lib/storage/state";
import { tr, type Copy } from "@/lib/studio/reviews";
import type { AdmissionsDossier } from "@/types/admissions";
import type { LocalState, University } from "@/types/domain";
import styles from "./university-application.module.css";

const labels = {
  Required: ["Required", "Обязательно", "Міндетті"],
  Recommended: ["Recommended", "Рекомендуется", "Ұсынылады"],
  Conditional: [
    "If applicable",
    "При определённых условиях",
    "Шартқа байланысты",
  ],
  Optional: ["Optional", "Необязательно", "Қалауыңызша"],
  "Not started": ["Not started", "Не начато", "Басталған жоқ"],
  "In progress": ["In progress", "В процессе", "Орындалуда"],
  Prepared: ["Prepared", "Готово", "Дайын"],
  "Self-reported sent or completed": [
    "Marked sent or completed",
    "Отмечено как отправленное или завершённое",
    "Жіберілді немесе орындалды деп белгіленді",
  ],
  "Not applicable": ["Not applicable", "Не применимо", "Қолданылмайды"],
} satisfies Record<string, Copy>;

const researchTasks = [
  {
    id: "pro-research:entry",
    label: [
      "Confirm the entry route and deadline",
      "Уточнить способ подачи и срок",
      "Өтінім жолы мен мерзімін анықтау",
    ],
  },
  {
    id: "pro-research:documents",
    label: [
      "Check transcripts and translations",
      "Проверить требования к аттестату и переводам",
      "Аттестат пен аударма талаптарын тексеру",
    ],
  },
  {
    id: "pro-research:tests",
    label: [
      "Check tests and official score delivery",
      "Проверить тесты и отправку официальных результатов",
      "Тестілеу және ресми нәтижелерді жіберу шарттарын тексеру",
    ],
  },
] satisfies { id: string; label: Copy }[];

function putSchool(state: LocalState, id: string) {
  return state.saved.some((school) => school.universityId === id)
    ? state
    : toggleSaved(state, id);
}

export function ApplicationChecklist({
  school,
  dossier,
  language,
  intake,
}: {
  school: University;
  dossier?: AdmissionsDossier;
  language: Language;
  intake: string;
}) {
  const { state, update, ready, blocked } = useApp();
  const t = (en: string, ru: string, kk: string) => tr(language, [en, ru, kk]);
  const saved = state.saved.find((item) => item.universityId === school.id);
  const round = saved?.applicationType ?? "";
  const rounds = dossier?.rounds.map((item) => item.name) ?? [];
  const allDocuments = applicationDocuments(school, dossier, intake);
  const documents = allDocuments.filter(
    (doc) => !round || !doc.rounds?.length || doc.rounds.includes(round),
  );
  const planning = !allDocuments.length;
  const tasks = planning
    ? researchTasks.map(({ id, label }) => ({
        id,
        label: tr(language, label),
        level: null,
        condition: null,
        owner: undefined,
        submission: undefined,
        source: admissionsSource(school),
      }))
    : documents;
  const canEdit = ready && !blocked;
  const readProgress = (id: string) => saved?.requirementProgress?.[id]?.status;
  const useRequirementProgress = !!dossier && !planning;
  const doneCount = tasks.filter((task) =>
    useRequirementProgress
      ? [
          "Prepared",
          "Self-reported sent or completed",
          "Not applicable",
        ].includes(readProgress(task.id) ?? "")
      : saved?.tasks.some((stored) => stored.id === task.id && stored.done),
  ).length;

  function updateTask(
    id: string,
    label: string,
    done: boolean,
    sourceUrl?: string,
  ) {
    update((current) => {
      const next = putSchool(current, school.id);
      const item = next.saved.find(
        (candidate) => candidate.universityId === school.id,
      )!;
      const task = item.tasks.find((candidate) => candidate.id === id);
      return updateSaved(next, school.id, {
        tasks: task
          ? item.tasks.map((candidate) =>
              candidate.id === id ? { ...candidate, done } : candidate,
            )
          : [
              ...item.tasks,
              {
                id,
                text: label.slice(0, 500),
                done,
                sourceUrl,
                kind: planning ? "research" : "official",
              },
            ],
      });
    });
  }

  return (
    <section className={styles.panel}>
      <header className={styles.panelHeader}>
        <div>
          <h2>
            <ClipboardList size={20} />{" "}
            {t("Document checklist", "Документы", "Құжаттар тізімі")}
          </h2>
          <p>
            {planning
              ? t(
                  "Research tasks for this university. Confirm the current document list on its official site.",
                  "Задачи для проверки. Уточните актуальный комплект документов на сайте вуза.",
                  "Осы университетке арналған тексеру қадамдары. Құжаттардың қазіргі тізімін ресми сайттан қараңыз.",
                )
              : t(
                  "Review who sends each item and track your progress in the planner.",
                  "Проверьте, кто отправляет каждый документ, и отслеживайте готовность в планировщике.",
                  "Әр құжатты кім жіберетінін қарап, дайындықты жоспарлағышта бақылаңыз.",
                )}
          </p>
        </div>
        <Link className={styles.secondary} href="/planner">
          {t("Open planner", "Открыть планировщик", "Жоспарлағышты ашу")}
        </Link>
      </header>
      <div className={styles.checklistTools}>
        <div aria-live="polite" className={styles.progress}>
          <strong>
            {doneCount} / {tasks.length}
          </strong>
          <span>{t("ready", "готово", "дайын")}</span>
          <progress
            aria-label={t(
              "Checklist progress",
              "Готовность документов",
              "Құжаттардың дайындық барысы",
            )}
            value={doneCount}
            max={tasks.length || 1}
          />
        </div>
        {!!rounds.length && (
          <label className={styles.roundInput}>
            {t("Application round", "Раунд подачи", "Өтінім кезеңі")}
            <select
              disabled={!canEdit}
              value={round}
              onChange={(event) => {
                const applicationType = event.target.value;
                update((current) =>
                  updateSaved(putSchool(current, school.id), school.id, {
                    applicationType,
                  }),
                );
              }}
            >
              <option value="">
                {t("All rounds", "Все раунды", "Барлық кезеңдер")}
              </option>
              {rounds.map((name) => (
                <option key={name}>{name}</option>
              ))}
              {round && !rounds.includes(round) && <option>{round}</option>}
            </select>
          </label>
        )}
      </div>
      {!!tasks.length ? (
        <ul className={styles.checklist}>
          {tasks.map(
            ({ id, label, level, source, condition, owner, submission }) => (
              <li key={id}>
                <div>
                  <h3>{label}</h3>
                  {(level || owner) && (
                    <p>
                      {[level && tr(language, labels[level]), owner]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  )}
                  {(condition || submission) && (
                    <p>{[condition, submission].filter(Boolean).join(" ")}</p>
                  )}
                  {source && (
                    <details className={styles.source}>
                      <summary>{t("Source", "Источник", "Дереккөз")}</summary>
                      <a href={source.url} target="_blank" rel="noreferrer">
                        {source.title} <ArrowUpRight size={13} />
                      </a>
                      {source.cycle && <p>{source.cycle}</p>}
                    </details>
                  )}
                </div>
                {useRequirementProgress ? (
                  <select
                    aria-label={label}
                    value={readProgress(id) ?? "Not started"}
                    disabled={!canEdit}
                    onChange={(event) => {
                      const status = progressStates.find(
                        (value) => value === event.target.value,
                      );
                      if (!status) return;
                      update((current) => {
                        const next = putSchool(current, school.id);
                        const item = next.saved.find(
                          (candidate) => candidate.universityId === school.id,
                        )!;
                        return updateSaved(next, school.id, {
                          requirementProgress: {
                            ...item.requirementProgress,
                            [id]: { status },
                          },
                        });
                      });
                    }}
                  >
                    {progressStates.map((value) => (
                      <option key={value} value={value}>
                        {tr(language, labels[value])}
                      </option>
                    ))}
                    {readProgress(id) === "Not applicable" && (
                      <option value="Not applicable">
                        {tr(language, labels["Not applicable"])}
                      </option>
                    )}
                  </select>
                ) : (
                  <label className={styles.taskCheck}>
                    <input
                      type="checkbox"
                      aria-label={label}
                      checked={
                        !!saved?.tasks.some(
                          (task) => task.id === id && task.done,
                        )
                      }
                      disabled={!canEdit}
                      onChange={(event) =>
                        updateTask(id, label, event.target.checked, source?.url)
                      }
                    />
                    {t("Done", "Готово", "Дайын")}
                  </label>
                )}
              </li>
            ),
          )}
        </ul>
      ) : (
        <p className={styles.empty}>
          {t(
            "Check this application round’s documents on the official site.",
            "Уточните список документов для этого раунда на сайте вуза.",
            "Осы өтінім кезеңінің құжаттарын ресми сайттан тексеріңіз.",
          )}
        </p>
      )}
    </section>
  );
}
