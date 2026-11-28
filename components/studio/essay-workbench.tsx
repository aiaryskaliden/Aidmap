"use client";

import {
  ArrowLeft,
  BookOpen,
  Check,
  FileText,
  PenLine,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import {
  essaySchema,
  maxDocumentText,
  maxDrafts,
  maxWordLimit,
  type EssayDraft,
} from "@/types/studio";
import { essayRubric } from "@/lib/studio/copy";
import { reviewEssay, textWords, tr } from "@/lib/studio/reviews";
import type { EssayExercise } from "@/lib/studio/practice";
import { DocumentPicker } from "./document-picker";
import type { SchoolOption, StudioProps } from "./types";
import styles from "./studio.module.css";

export function EssayWorkbench({
  language,
  studio,
  save,
  schools,
  exercise,
  fixedSchoolId,
}: StudioProps & {
  schools: SchoolOption[];
  exercise?: EssayExercise;
  fixedSchoolId?: string;
}) {
  const t = (en: string, ru: string, kk: string) => tr(language, [en, ru, kk]);
  const [draft, setDraft] = useState<EssayDraft | null>(null);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState<
    "saved" | "short" | "title" | "full" | null
  >(null);
  const schoolName = (id: string) =>
    schools.find((item) => item.id === id)?.name ??
    t("General application", "Общая заявка", "Жалпы өтінім");
  const patch = (part: Partial<EssayDraft>) => {
    setMessage(null);
    setDraft((old) => (old ? { ...old, ...part, reviewedAt: undefined } : old));
  };
  function create() {
    if (studio.essays.length >= maxDrafts) {
      setMessage("full");
      return;
    }
    setMessage(null);
    setDraft({
      id: crypto.randomUUID(),
      title: exercise?.title ?? "",
      schoolId: fixedSchoolId ?? "",
      prompt: exercise?.prompt ?? "",
      wordLimit: exercise?.wordLimit ?? 650,
      text: "",
    });
  }
  function persist(withReview: boolean) {
    if (!draft) return;
    if (!draft.title.trim()) {
      setMessage("title");
      return;
    }
    if (withReview && !reviewEssay(draft)) {
      setMessage("short");
      return;
    }
    const next = essaySchema.safeParse({
      ...draft,
      reviewedAt: withReview ? new Date().toISOString() : draft.reviewedAt,
    });
    if (!next.success) return;
    if (
      !studio.essays.some((item) => item.id === next.data.id) &&
      studio.essays.length >= maxDrafts
    ) {
      setMessage("full");
      return;
    }
    if (
      save((old) => ({
        ...old,
        essays: [
          next.data,
          ...old.essays.filter((item) => item.id !== next.data.id),
        ],
      }))
    ) {
      setDraft(next.data);
      setMessage(withReview ? null : "saved");
    }
  }

  if (!draft) {
    const filtered = studio.essays.filter(
      (item) =>
        (!fixedSchoolId || item.schoolId === fixedSchoolId) &&
        (item.title + " " + schoolName(item.schoolId) + " " + item.prompt)
          .toLowerCase()
          .includes(search.trim().toLowerCase()),
    );
    return (
      <section className={styles.panel}>
        <div className={styles.listHeading}>
          <label className={styles.search}>
            {t("Find a draft", "Найти черновик", "Жобаны табу")}
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <button className={styles.primary} type="button" onClick={create}>
            <Plus size={17} />
            {exercise
              ? t("Start practice draft", "Начать черновик по заданию", "Жаттығу жобасын бастау")
              : t("New essay", "Новое эссе", "Жаңа эссе")}
          </button>
        </div>
        {exercise && <p className={styles.quiet}>{exercise.prompt}</p>}
        {message === "full" && (
          <p className={styles.formError} role="alert">
            {t(
              "This workspace can hold up to 12 essays.",
              "В кабинете можно хранить до 12 эссе.",
              "Кабинетте 12 эссеге дейін сақтауға болады.",
            )}
          </p>
        )}
        {filtered.length ? (
          <div className={styles.tiles}>
            {filtered.map((item) => {
              const review = item.reviewedAt ? reviewEssay(item) : null;
              return (
                <button
                  className={styles.essayTile}
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setMessage(null);
                    setDraft(item);
                  }}
                >
                  <span className={styles.tilePaper}>
                    <FileText size={24} />
                    <i />
                    <i />
                    <i />
                  </span>
                  <strong>{item.title}</strong>
                  <small>{schoolName(item.schoolId)}</small>
                  <span>
                    {textWords(item.text).length} / {item.wordLimit}{" "}
                    {t("words", "слов", "сөз")}
                    {review ? " · " + review.score + "/10" : ""}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className={styles.empty}>
            <PenLine size={25} />
            <p>
              {studio.essays.length
                ? t(
                    "No drafts match this search.",
                    "Черновики не найдены.",
                    "Іздеуге сай жобалар табылмады.",
                  )
                : t(
                    "Start an essay or bring in a draft you already have.",
                    "Создайте эссе или загрузите готовый черновик.",
                    "Жаңа эссе бастаңыз немесе дайын жобаны жүктеңіз.",
                  )}
            </p>
          </div>
        )}
      </section>
    );
  }

  const words = textWords(draft.text).length;
  const validLimit =
    Number.isInteger(draft.wordLimit) &&
    draft.wordLimit >= 20 &&
    draft.wordLimit <= maxWordLimit;
  const existing = studio.essays.some((item) => item.id === draft.id);
  const report = draft.reviewedAt ? reviewEssay(draft) : null;
  const messages = {
    saved: t(
      "Draft saved on this device.",
      "Черновик сохранён на устройстве.",
      "Жоба осы құрылғыда сақталды.",
    ),
    short: t(
      "Add at least 30 words to review your draft.",
      "Для разбора добавьте хотя бы 30 слов.",
      "Талдау үшін кемінде 30 сөз қосыңыз.",
    ),
    title: t(
      "Give this draft a title first.",
      "Сначала назовите черновик.",
      "Алдымен жобаға атау беріңіз.",
    ),
    full: t(
      "This workspace can hold up to 12 essays.",
      "В кабинете можно хранить до 12 эссе.",
      "Кабинетте 12 эссеге дейін сақтауға болады.",
    ),
  };
  return (
    <div className={styles.stack}>
      <div className={styles.listHeading}>
        <button
          type="button"
          className={styles.textButton}
          onClick={() => {
            setDraft(null);
            setMessage(null);
          }}
        >
          <ArrowLeft size={16} />
          {t("All drafts", "Все черновики", "Барлық жобалар")}
        </button>
        {existing && (
          <button
            type="button"
            className={styles.textButton}
            onClick={() => {
              if (
                save((old) => ({
                  ...old,
                  essays: old.essays.filter((item) => item.id !== draft.id),
                }))
              ) {
                setDraft(null);
                setMessage(null);
              }
            }}
          >
            <Trash2 size={16} />
            {t("Delete draft", "Удалить черновик", "Жобаны өшіру")}
          </button>
        )}
      </div>

      <div className={styles.essayLayout}>
        <section className={styles.panel}>
          <div className={styles.fields}>
            <label className={styles.wide}>
              {t("Draft title", "Название черновика", "Жоба атауы")}
              <input
                maxLength={120}
                value={draft.title}
                onChange={(e) => patch({ title: e.target.value })}
              />
            </label>
            <label>
              {t("University", "Университет", "Университет")}
              {fixedSchoolId ? (
                <input readOnly value={schoolName(fixedSchoolId)} />
              ) : (
                <select
                  value={draft.schoolId}
                  onChange={(e) => patch({ schoolId: e.target.value })}
                >
                  <option value="">{schoolName("")}</option>
                  {schools.map((school) => (
                    <option value={school.id} key={school.id}>
                      {school.name}
                    </option>
                  ))}
                </select>
              )}
            </label>
            <label>
              {t("Word limit", "Лимит слов", "Сөз шегі")}
              <input
                type="number"
                min={20}
                max={maxWordLimit}
                value={draft.wordLimit}
                onChange={(e) => patch({ wordLimit: Number(e.target.value) })}
              />
            </label>
            <label className={styles.wide}>
              {t(
                "Essay prompt (optional)",
                "Задание к эссе (необязательно)",
                "Эссе тапсырмасы (міндетті емес)",
              )}
              <textarea
                rows={2}
                maxLength={2000}
                value={draft.prompt}
                onChange={(e) => patch({ prompt: e.target.value })}
              />
            </label>
            <label className={styles.wide}>
              <span className={styles.labelRow}>
                {t("Your draft", "Ваш черновик", "Сіздің жобаңыз")}{" "}
                <span data-over={words > draft.wordLimit || undefined}>
                  {words} / {draft.wordLimit}
                </span>
              </span>
              <textarea
                rows={12}
                maxLength={maxDocumentText}
                value={draft.text}
                onChange={(e) => patch({ text: e.target.value })}
                placeholder={t(
                  "Start writing here, paste a draft or import a file below.",
                  "Начните писать, вставьте текст или загрузите файл ниже.",
                  "Осы жерде жазыңыз, мәтін қойыңыз немесе төменнен файл жүктеңіз.",
                )}
              />
            </label>
          </div>
          <DocumentPicker
            compact
            language={language}
            title={t(
              "Import a draft file",
              "Загрузить черновик",
              "Жоба файлын жүктеу",
            )}
            onRead={(value) =>
              patch({
                text: value.text,
                fileName: value.fileName,
                title:
                  draft.title ||
                  value.fileName.replace(/\.[^.]+$/, "").slice(0, 120),
              })
            }
          />
          {draft.fileName && (
            <p className={styles.fileNote}>
              <FileText size={14} />
              {draft.fileName}
            </p>
          )}
          <div className={styles.inlineActions}>
            <button
              type="button"
              className={styles.primary}
              disabled={!validLimit}
              onClick={() => persist(true)}
            >
              <BookOpen size={17} />
              {t("Review essay", "Разобрать эссе", "Эссені талдау")}
            </button>
            <button
              type="button"
              className={styles.secondary}
              disabled={!validLimit}
              onClick={() => persist(false)}
            >
              <Check size={16} />
              {t("Save draft", "Сохранить черновик", "Жобаны сақтау")}
            </button>
          </div>
          {message && (
            <p
              role={message === "saved" ? "status" : "alert"}
              className={message === "saved" ? styles.quiet : styles.formError}
            >
              {messages[message]}
            </p>
          )}
        </section>

        <aside
          className={styles.panel + " " + styles.feedback}
          aria-live="polite"
        >
          <div className={styles.sectionHeading}>
            <BookOpen size={19} />
            <h2>{t("Draft feedback", "Разбор черновика", "Жобаны талдау")}</h2>
          </div>
          {report ? (
            <>
              <div className={styles.rating}>
                <strong>
                  {report.score}
                  <small>/10</small>
                </strong>
                <div>
                  {t(
                    "Preliminary score",
                    "Предварительная оценка",
                    "Алдын ала баға",
                  )}
                  <small>
                    {report.words} {t("words", "слов", "сөз")}
                  </small>
                </div>
              </div>
              <ul className={styles.rubric}>
                {Object.entries(report.metrics).map(([key, value]) => {
                  const criterion =
                    essayRubric[key as keyof typeof essayRubric];
                  return (
                    <li key={key}>
                      <div>
                        <strong>{tr(language, criterion.label)}</strong>
                        <span>{value === null ? "—" : value + "/2"}</span>
                      </div>
                      <progress
                        max={2}
                        value={value ?? 0}
                        aria-label={tr(language, criterion.label)}
                      />
                      <small>
                        {value === null
                          ? t(
                              "Add the essay prompt for a coverage check.",
                              "Добавьте задание, чтобы проверить связь с ним.",
                              "Сәйкестікті тексеру үшін тапсырманы енгізіңіз.",
                            )
                          : tr(language, criterion.tip)}
                      </small>
                    </li>
                  );
                })}
              </ul>
              {(report.moment || report.insight) && (
                <div className={styles.quoteBox}>
                  <h3>
                    {t(
                      "Passages to build on",
                      "Фрагменты для доработки",
                      "Дамытуға болатын үзінділер",
                    )}
                  </h3>
                  {[
                    ...new Set([report.moment, report.insight].filter(Boolean)),
                  ].map((quote) => (
                    <blockquote key={quote}>{quote}</blockquote>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className={styles.empty}>
              <PenLine size={25} />
              <p>
                {t(
                  "Review a draft to see feedback on detail, reflection, structure and length.",
                  "Запустите разбор, чтобы оценить конкретику, осмысление, структуру и объём.",
                  "Нақты деталь, ой қорыту, құрылым және көлем бойынша пікір алу үшін жобаны талдаңыз.",
                )}
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
