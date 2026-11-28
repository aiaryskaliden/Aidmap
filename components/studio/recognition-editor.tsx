"use client";

import { Award, Check, Pencil, Plus, Target, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import {
  maxRecognitions,
  recognitionGrades,
  recognitionLevels,
  recognitionSchema,
  type Recognition,
} from "@/types/studio";
import { tr } from "@/lib/studio/reviews";
import type { StudioProps } from "./types";
import styles from "./studio.module.css";

function RecognitionChoices<Option extends string>({
  title,
  options,
  selected = [],
  label,
  onChange,
}: {
  title: string;
  options: readonly Option[];
  selected?: Option[];
  label: (option: Option) => string;
  onChange: (options: Option[]) => void;
}) {
  return (
    <fieldset className={styles.recognitionChoices}>
      <legend>{title}</legend>
      <div>
        {options.map((option) => (
          <label key={option}>
            <input
              type="checkbox"
              checked={selected.includes(option)}
              onChange={(event) => {
                const checked = event.currentTarget.checked;
                onChange(
                  options.filter((value) =>
                    value === option ? checked : selected.includes(value),
                  ),
                );
              }}
            />
            {label(option)}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function RecognitionEditor({
  kind,
  studio,
  language,
  save,
}: StudioProps & { kind: "honors" | "achievements" }) {
  const honors = kind === "honors";
  const records = studio[kind] ?? [];
  const t = (en: string, ru: string, kk: string) => tr(language, [en, ru, kk]);
  const Icon = honors ? Award : Target;
  const [draft, setDraft] = useState<Recognition | null>(null);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [invalid, setInvalid] = useState(false);
  const patch = (value: Partial<Recognition>) => {
    setInvalid(false);
    setDraft((current) => current && { ...current, ...value });
  };
  const addLabel = honors
    ? t("Add honor", "Добавить награду", "Марапат қосу")
    : t("Add achievement", "Добавить достижение", "Жетістік қосу");
  const levelLabels = {
    school: t("School", "Школьный", "Мектептік"),
    city: t("City", "Городской", "Қалалық"),
    regional: t("Regional", "Региональный", "Өңірлік"),
    national: t("National", "Республиканский", "Республикалық"),
    international: t("International", "Международный", "Халықаралық"),
  };
  const gradeLabel = (grade: (typeof recognitionGrades)[number]) =>
    grade === "postgraduate"
      ? t("After high school", "После школы", "Мектептен кейін")
      : grade;
  const gradesTitle = t("Grades", "Классы", "Сыныптар");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = recognitionSchema.safeParse(draft);
    if (!parsed.success) {
      setInvalid(true);
      return;
    }
    const saved = save((current) => {
      const remaining = (current[kind] ?? []).filter(
        ({ id }) => id !== parsed.data.id,
      );
      if (remaining.length >= maxRecognitions) return current;
      return { ...current, [kind]: [parsed.data, ...remaining] };
    });
    if (saved) setDraft(null);
  }

  return (
    <section className={styles.panel}>
      {draft ? (
        <form className={styles.stack} onSubmit={submit}>
          <div className={styles.fields}>
            <label className={styles.wide}>
              {honors
                ? t("Honor name", "Название награды", "Марапат атауы")
                : t(
                    "Achievement name",
                    "Название достижения",
                    "Жетістік атауы",
                  )}
              <input
                value={draft.title}
                required
                maxLength={120}
                onChange={(e) => patch({ title: e.target.value })}
              />
            </label>
            <label>
              {honors
                ? t("Awarded by", "Кто наградил", "Марапаттаған ұйым")
                : t(
                    "Project or organisation",
                    "Проект или организация",
                    "Жоба немесе ұйым",
                  )}
              <input
                value={draft.context}
                maxLength={140}
                onChange={(e) => patch({ context: e.target.value })}
              />
            </label>
            <label>
              {t("Date", "Дата", "Күні")}
              <input
                type="month"
                min="1990-01"
                max="2100-12"
                value={draft.date}
                onChange={(e) => patch({ date: e.target.value })}
              />
            </label>
            <RecognitionChoices
              title={t(
                "Recognition level",
                "Уровень признания",
                "Марапат деңгейі",
              )}
              options={recognitionLevels}
              selected={draft.levels}
              label={(level) => levelLabels[level]}
              onChange={(levels) => patch({ levels })}
            />
            <RecognitionChoices
              title={gradesTitle}
              options={recognitionGrades}
              selected={draft.grades}
              label={gradeLabel}
              onChange={(grades) => patch({ grades })}
            />
            <label className={styles.wide}>
              {honors
                ? t(
                    "Award details",
                    "За что присудили награду",
                    "Марапат не үшін берілді",
                  )
                : t(
                    "What did you accomplish?",
                    "Какой результат получили?",
                    "Қандай нәтижеге жеттіңіз?",
                  )}
              <textarea
                value={draft.description}
                rows={4}
                maxLength={1000}
                onChange={(e) => patch({ description: e.target.value })}
              />
            </label>
          </div>
          {invalid && (
            <p className={styles.formError} role="alert">
              {t(
                "Enter a valid name and date.",
                "Укажите корректное название и дату.",
                "Дұрыс атау мен күнді енгізіңіз.",
              )}
            </p>
          )}
          <div className={styles.inlineActions}>
            <button type="submit" className={styles.primary}>
              <Check size={16} />
              {t("Save entry", "Сохранить запись", "Жазбаны сақтау")}
            </button>
            <button
              className={styles.textButton}
              type="button"
              onClick={() => setDraft(null)}
            >
              {t("Cancel", "Отмена", "Бас тарту")}
            </button>
          </div>
        </form>
      ) : (
        <div className={styles.stack}>
          <div className={styles.listHeading}>
            <div className={styles.sectionHeading}>
              <Icon size={19} />
              <h2>
                {honors
                  ? t("My honors", "Мои награды", "Марапаттарым")
                  : t("My achievements", "Мои достижения", "Жетістіктерім")}
              </h2>
            </div>
            <button
              className={styles.primary}
              type="button"
              disabled={records.length >= maxRecognitions}
              onClick={() =>
                setDraft({
                  id: crypto.randomUUID(),
                  title: "",
                  context: "",
                  date: "",
                  description: "",
                })
              }
            >
              <Plus size={16} />
              {addLabel}
            </button>
          </div>
          {records.length ? (
            <ul className={styles.recognitionList}>
              {records.map((entry) => (
                <li key={entry.id}>
                  <span
                    className={styles.featureIcon}
                    data-tint={honors ? "butter" : "mint"}
                  >
                    <Icon size={18} />
                  </span>
                  <div>
                    <h3>{entry.title}</h3>
                    {(entry.context || entry.date) && (
                      <small>
                        {[entry.context, entry.date]
                          .filter(Boolean)
                          .join(" · ")}
                      </small>
                    )}
                    {entry.description && <p>{entry.description}</p>}
                    {Boolean(entry.levels?.length || entry.grades?.length) && (
                      <div className={styles.recognitionMetadata}>
                        {recognitionLevels
                          .filter((level) => entry.levels?.includes(level))
                          .map((level) => (
                            <span key={level}>{levelLabels[level]}</span>
                          ))}
                        {Boolean(entry.grades?.length) && (
                          <span>
                            {gradesTitle} ·{" "}
                            {recognitionGrades
                              .filter((grade) => entry.grades?.includes(grade))
                              .map(gradeLabel)
                              .join(", ")}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className={styles.recognitionActions}>
                    {removeId === entry.id ? (
                      <>
                        <button
                          className={styles.textButton}
                          type="button"
                          onClick={() => {
                            if (
                              save((current) => ({
                                ...current,
                                [kind]: (current[kind] ?? []).filter(
                                  ({ id }) => id !== entry.id,
                                ),
                              }))
                            )
                              setRemoveId(null);
                          }}
                        >
                          {t("Delete entry", "Удалить запись", "Жазбаны өшіру")}
                        </button>
                        <button
                          className={styles.textButton}
                          type="button"
                          onClick={() => setRemoveId(null)}
                        >
                          {t("Cancel", "Отмена", "Бас тарту")}
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className={styles.textButton}
                          type="button"
                          aria-label={
                            t("Edit ", "Изменить ", "Өңдеу ") + entry.title
                          }
                          onClick={() => {
                            setInvalid(false);
                            setRemoveId(null);
                            setDraft(entry);
                          }}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          className={styles.textButton}
                          type="button"
                          aria-label={
                            t("Remove ", "Удалить ", "Өшіру ") + entry.title
                          }
                          onClick={() => setRemoveId(entry.id)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.quiet}>
              {honors
                ? t(
                    "Add a prize, distinction or formal recognition.",
                    "Добавьте приз, диплом или другое официальное признание.",
                    "Жүлде, диплом немесе басқа ресми марапат қосыңыз.",
                  )
                : t(
                    "Add results you can describe, such as a product you shipped or a milestone you reached.",
                    "Добавьте конкретный результат, например запуск продукта или завершённый проект.",
                    "Іске қосылған өнім не аяқталған жоба сияқты нақты нәтиже қосыңыз.",
                  )}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
