"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import {
  ArrowUpRight,
  BookmarkMinus,
  Check,
  ChevronRight,
  Columns2,
  Plus,
  Search,
  X,
} from "lucide-react";
import { useApp } from "@/components/providers";
import { Button } from "@/components/ui/button";
import { ApplicationWorkspaceLink } from "@/components/universities/application-workspace-link";
import { UniversityMark } from "@/components/universities/university-mark";
import {
  formatAdmissionCycle,
  formatAdmissionRate,
} from "@/lib/admission-rates";
import type { Language } from "@/lib/advisor/contracts";
import { toggleCompare, toggleSaved, updateSaved } from "@/lib/storage/state";
import { tr, type Copy } from "@/lib/studio/reviews";
import {
  shortlistFit,
  type ShortlistFitSchool,
} from "@/lib/studio/shortlist-fit";
import {
  shortlistGroups,
  type SavedUniversity,
  type ShortlistGroup,
  type University,
} from "@/types/domain";
import styles from "./my-list.module.css";

type School = Pick<
  University,
  "id" | "name" | "city" | "country" | "initials" | "color"
> & {
  fit: ShortlistFitSchool;
};
const names: Record<ShortlistGroup, Copy> = {
  reach: ["Reach", "Амбициозные", "Бәсекесі жоғары"],
  target: ["Target", "Целевые", "Мақсатты"],
  safety: ["Safety", "Запасные", "Қосалқы"],
  unsure: ["Unsure", "Уточнить", "Нақтылау"],
};

type CardProps = {
  school: School;
  saved: SavedUniversity;
  fit: ReturnType<typeof shortlistFit>;
  language: Language;
  canEdit: boolean;
  compared: boolean;
  onGroup: (group: ShortlistGroup | undefined) => void;
  onCompare: () => void;
  onRemove: () => void;
};

function SchoolCard({
  school,
  saved,
  fit,
  language,
  canEdit,
  compared,
  onGroup,
  onCompare,
  onRemove,
}: CardProps) {
  const t = (en: string, ru: string, kk: string) => tr(language, [en, ru, kk]);
  const { rate } = fit;
  const rateLabel =
    rate?.metric === "offer"
      ? t("Offer rate", "Доля офферов", "Ұсыныс үлесі")
      : rate?.scope === "undergraduate · all entry years"
        ? t(
            "Undergrad admit rate",
            "Приём в бакалавриат",
            "Бакалавриатқа қабылдау",
          )
        : t("Admit rate", "Доля приёма", "Қабылдау үлесі");
  const compareLabel = compared
    ? t("Remove from comparison", "Убрать из сравнения", "Салыстырудан алу")
    : t("Add to comparison", "Сравнить", "Салыстыруға қосу");
  const removeLabel = t(
    "Remove from My List",
    "Убрать из списка",
    "Тізімнен алу",
  );
  const label = (group: ShortlistGroup) => tr(language, names[group]);
  const fitUrl = "/studio?view=fit&school=" + school.id;
  const listGroupId = "my-list-group-" + school.id;

  return (
    <article className={styles.card}>
      <header className={styles.school}>
        <UniversityMark university={school} />
        <div>
          <h3>
            <Link href={"/universities/" + school.id} prefetch={false}>
              {school.name}
            </Link>
          </h3>
          <p>{[school.city, school.country].filter(Boolean).join(", ")}</p>
        </div>
      </header>
      <dl className={styles.stats}>
        <div>
          <dt>{rateLabel}</dt>
          <dd>
            {rate ? formatAdmissionRate(rate, language) : "—"}
            {rate && (
              <small>
                {formatAdmissionCycle(rate, language)}
                {rate.stage === "decision-release"
                  ? " · " +
                    t("Initial decisions", "Первые решения", "Алғашқы шешімдер")
                  : ""}
              </small>
            )}
          </dd>
        </div>
        <div>
          <dt>{t("Profile checks", "Сверка профиля", "Профильді тексеру")}</dt>
          <dd>
            {fit.checked ? `${fit.aligned}/${fit.checked}` : "—"}
            {fit.checked > 0 && <small>{t("Met", "Совпало", "Сәйкес")}</small>}
          </dd>
        </div>
      </dl>
      <div className={styles.controls}>
        <select
          id={listGroupId}
          value={saved.shortlistGroup ?? ""}
          disabled={!canEdit}
          aria-label={
            t("List group for", "Категория вуза", "Тізімдегі санаты") +
            " " +
            school.name
          }
          onChange={(event) => {
            onGroup(
              (event.target.value || undefined) as ShortlistGroup | undefined,
            );
            requestAnimationFrame(() =>
              document
                .getElementById(listGroupId)
                ?.focus({ preventScroll: true }),
            );
          }}
        >
          <option value="">
            {t("Automatic", "Автоматически", "Автоматты")} ·{" "}
            {label(fit.suggestedBand)}
          </option>
          {shortlistGroups.map((group) => (
            <option key={group} value={group}>
              {label(group)}
            </option>
          ))}
        </select>
        <button
          type="button"
          className={styles.iconButton}
          aria-label={compareLabel + " · " + school.name}
          title={compareLabel}
          aria-pressed={compared}
          disabled={!canEdit}
          onClick={onCompare}
        >
          {compared ? <Check size={16} /> : <Columns2 size={16} />}
        </button>
        <button
          type="button"
          className={styles.iconButton}
          aria-label={removeLabel + " · " + school.name}
          title={removeLabel}
          disabled={!canEdit}
          onClick={onRemove}
        >
          <BookmarkMinus size={16} />
        </button>
      </div>
      <details className={styles.evidence}>
        <summary>
          {t("Basis & source", "Данные и источник", "Дерек пен негіз")}
        </summary>
        <p>{tr(language, fit.reason)}</p>
        {rate?.scopeNote && <p>{rate.scopeNote}</p>}
        {rate && (
          <a href={rate.sourceUrl} target="_blank" rel="noopener noreferrer">
            {t(
              "Official admission data",
              "Официальная статистика",
              "Ресми қабылдау дерегі",
            )}
            <ArrowUpRight size={13} />
          </a>
        )}
      </details>
      <div className={styles.cardFooter}>
        <Link className={styles.review} href={fitUrl} prefetch={false}>
          {t("Review fit", "Проверить соответствие", "Сәйкестігін тексеру")}{" "}
          <ChevronRight size={14} />
        </Link>
        <ApplicationWorkspaceLink id={school.id} compact />
      </div>
    </article>
  );
}

export function MyList({ schools }: { schools: School[] }) {
  const { state, ready, blocked, update, toast } = useApp();
  const language = state.studio?.language ?? "en";
  const t = (en: string, ru: string, kk: string) => tr(language, [en, ru, kk]);
  const [query, setQuery] = useState("");
  const [addGroup, setAddGroup] = useState<ShortlistGroup>();
  const dialog = useRef<HTMLDialogElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const selected = new Set(state.saved.map(({ universityId }) => universityId));
  const savedById = new Map(
    state.saved.map((saved) => [saved.universityId, saved]),
  );
  const grouped = Map.groupBy(
    schools.flatMap((school) => {
      const saved = savedById.get(school.id);
      if (!saved) return [];
      return [{ school, saved, fit: shortlistFit(school.fit, state.profile) }];
    }),
    ({ saved, fit }) => saved.shortlistGroup ?? fit.suggestedBand,
  );
  const needle = query.trim().toLowerCase();
  const options = schools.filter(
    (school) =>
      !selected.has(school.id) &&
      [school.name, school.country, school.city, school.initials]
        .join(" ")
        .toLowerCase()
        .includes(needle),
  );
  const title = addGroup
    ? t("Add to", "Добавить в", "Топқа қосу") +
      " · " +
      tr(language, names[addGroup])
    : t("Add universities", "Добавить вузы", "Университет қосу");

  function openPicker(group?: ShortlistGroup) {
    setAddGroup(group);
    setQuery("");
    dialog.current?.showModal();
    search.current?.focus();
  }

  function addSchool(school: School) {
    const success = update((current) => {
      if (current.saved.some(({ universityId }) => universityId === school.id))
        return current;
      const added = toggleSaved(current, school.id);
      return addGroup
        ? updateSaved(added, school.id, { shortlistGroup: addGroup })
        : added;
    });
    if (success) {
      toast(
        t("University added", "Вуз добавлен", "Университет қосылды") +
          " · " +
          school.name,
      );
      search.current?.focus();
    }
  }

  function removeSchool(saved: SavedUniversity) {
    const hasApplicationData =
      saved.status !== "Interested" ||
      saved.notes ||
      saved.tasks.length ||
      saved.deadline ||
      saved.applicationType ||
      Object.keys(saved.requirementProgress ?? {}).length ||
      Object.keys(saved.triggerDates ?? {}).length;
    if (
      hasApplicationData &&
      !window.confirm(
        t(
          "Remove this university and its application notes and tasks?",
          "Убрать вуз вместе с заметками и задачами по заявке?",
          "Университетті өтінім жазбаларымен және тапсырмаларымен бірге жою керек пе?",
        ),
      )
    )
      return;
    update((current) =>
      current.saved.some(
        ({ universityId }) => universityId === saved.universityId,
      )
        ? toggleSaved(current, saved.universityId)
        : current,
    );
  }

  return (
    <div className={`page-container ${styles.page}`} lang={language}>
      <header className={styles.header}>
        <div>
          <h1>{t("My List", "Мой список", "Менің тізімім")}</h1>
          <p>
            {ready
              ? t(
                  `${selected.size} saved universities`,
                  `Сохранено вузов: ${selected.size}`,
                  `Сақталған университеттер: ${selected.size}`,
                )
              : t(
                  "Loading your list…",
                  "Загружаем список…",
                  "Тізім жүктелуде…",
                )}
          </p>
        </div>
        <div className={styles.toolbar}>
          <Button asChild variant="outline" size="sm">
            <Link href="/compare" prefetch={false}>
              <Columns2 size={16} />
              {t("Compare", "Сравнить", "Салыстыру")}
              {state.compare.length ? ` (${state.compare.length})` : ""}
            </Link>
          </Button>
          <Button
            size="sm"
            type="button"
            disabled={!ready || blocked}
            onClick={() => openPicker()}
          >
            <Plus size={16} />
            {t("Add universities", "Добавить вузы", "Университет қосу")}
          </Button>
        </div>
      </header>
      <div
        className={styles.board}
        aria-label={t(
          "University list groups",
          "Группы вузов",
          "Университет топтары",
        )}
      >
        {shortlistGroups.map((group) => {
          const entries = grouped.get(group) ?? [];
          const name = tr(language, names[group]);
          return (
            <section key={group} data-group={group} className={styles.lane}>
              <header className={styles.laneHeader}>
                <h2>
                  <span aria-hidden="true" />
                  {name}
                  <small>{entries.length}</small>
                </h2>
                {entries.length > 0 && (
                  <button
                    className={styles.iconButton}
                    type="button"
                    disabled={!ready || blocked}
                    aria-label={
                      t("Add to", "Добавить в", "Топқа қосу") + " " + name
                    }
                    onClick={() => openPicker(group)}
                  >
                    <Plus size={16} />
                  </button>
                )}
              </header>
              <div className={styles.cards}>
                {entries.map(({ school, saved, fit }) => (
                  <SchoolCard
                    key={school.id}
                    school={school}
                    saved={saved}
                    fit={fit}
                    language={language}
                    canEdit={ready && !blocked}
                    compared={state.compare.includes(school.id)}
                    onCompare={() =>
                      update((current) => toggleCompare(current, school.id))
                    }
                    onRemove={() => removeSchool(saved)}
                    onGroup={(shortlistGroup) =>
                      update((current) =>
                        updateSaved(current, school.id, { shortlistGroup }),
                      )
                    }
                  />
                ))}
                {!entries.length && ready && (
                  <button
                    className={styles.empty}
                    type="button"
                    disabled={blocked}
                    onClick={() => openPicker(group)}
                    aria-label={
                      t("Add to", "Добавить в", "Топқа қосу") + " " + name
                    }
                  >
                    <Plus size={16} />
                    {t("Add university", "Добавить вуз", "Университет қосу")}
                  </button>
                )}
              </div>
            </section>
          );
        })}
      </div>
      <footer className={styles.footnote}>
        <p>
          {t(
            "Admission rates describe the published cohort. Profile checks count only the requirements we could compare.",
            "Доля приёма относится к указанному набору. Сверка профиля учитывает требования, которые удалось сопоставить.",
            "Қабылдау үлесі көрсетілген кезеңге қатысты. Профиль тексерісі салыстыруға болатын талаптарды қамтиды.",
          )}
        </p>
        <Link href="/studio?view=profile" prefetch={false}>
          {state.profile
            ? t("Edit profile", "Изменить профиль", "Профильді өңдеу")
            : t("Set up my profile", "Заполнить профиль", "Профилімді толтыру")}
          <ArrowUpRight size={14} />
        </Link>
      </footer>
      <dialog
        className={styles.picker}
        ref={dialog}
        aria-labelledby="my-list-picker"
      >
        <div className={styles.pickerHeading}>
          <h2 id="my-list-picker">{title}</h2>
          <button
            type="button"
            className={styles.iconButton}
            aria-label={t("Close", "Закрыть", "Жабу")}
            onClick={() => dialog.current?.close()}
          >
            <X size={19} />
          </button>
        </div>
        <label className={styles.search}>
          <Search size={17} aria-hidden="true" />
          <input
            ref={search}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label={t(
              "Find a university to add",
              "Найти вуз для добавления",
              "Қосатын университетті іздеу",
            )}
            placeholder={t(
              "University, city or country",
              "Вуз, город или страна",
              "Университет, қала немесе ел",
            )}
          />
        </label>
        {options.length ? (
          <ul className={styles.options}>
            {options.slice(0, 12).map((school) => (
              <li key={school.id}>
                <UniversityMark university={school} />
                <div>
                  <strong>{school.name}</strong>
                  <small>{school.country}</small>
                </div>
                <button
                  type="button"
                  className={styles.iconButton}
                  disabled={!ready || blocked}
                  aria-label={t("Add", "Добавить", "Қосу") + " " + school.name}
                  onClick={() => addSchool(school)}
                >
                  <Plus size={18} />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.pickerEmpty}>
            {t(
              "No universities match your search.",
              "Ничего не найдено.",
              "Университет табылмады.",
            )}
          </p>
        )}
        <Link
          href="/explore"
          prefetch={false}
          onClick={() => dialog.current?.close()}
          className={styles.review}
        >
          {t("Browse the catalogue", "Открыть каталог", "Каталогты ашу")}{" "}
          <ChevronRight size={14} />
        </Link>
      </dialog>
    </div>
  );
}
