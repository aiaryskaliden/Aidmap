"use client";

import {
  Check,
  FileText,
  GraduationCap,
  Trash2,
  UserRound,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { useApp } from "@/components/providers";
import {
  currencySchema,
  blankProfile,
  profileSchema,
  type ApplicantProfile,
} from "@/types/domain";
import { programTaxonomy } from "@/lib/admissions";
import { detectCvFields, tr } from "@/lib/studio/reviews";
import { DocumentPicker } from "./document-picker";
import style from "./studio.module.css";
import board from "./profile-board.module.css";
import type { StudioProps } from "./types";

const amount = (value: string) => (value === "" ? null : Number(value));

export type ProfileSection = "identity" | "academics" | "document";
type EditorOptions = {
  initialSection?: ProfileSection;
  initialDocument?: NonNullable<StudioProps["studio"]["cv"]>;
  onSaved?: () => void;
};

export function ApplicantProfileEditor(
  props: StudioProps & EditorOptions & { countries: string[] },
) {
  const { state, update, ready, blocked } = useApp();
  if (!ready)
    return (
      <p role="status" className={style.quiet}>
        {tr(props.language, [
          "Loading profile…",
          "Загружаем профиль…",
          "Профиль жүктелуде…",
        ])}
      </p>
    );
  return (
    <ProfileForm
      {...props}
      initial={state.profile ?? blankProfile}
      update={update}
      disabled={blocked}
    />
  );
}

function ProfileForm({
  language,
  studio,
  initial,
  countries,
  update,
  disabled,
  initialSection,
  initialDocument,
  onSaved,
}: StudioProps & EditorOptions & {
  initial: ApplicantProfile;
  countries: string[];
  update: ReturnType<typeof useApp>["update"];
  disabled: boolean;
}) {
  const t = (en: string, ru: string, kk: string) => tr(language, [en, ru, kk]);
  const [section, setSection] = useState(initialSection);
  const [personal, setPersonal] = useState({
    name: studio.name,
    school: studio.school,
    qualification: studio.qualification,
    graduationYear: studio.graduationYear?.toString() ?? "",
  });
  const [profile, setProfile] = useState(initial);
  const [cv, setCv] = useState(initialDocument ?? studio.cv);
  const [showText, setShowText] = useState(false);
  const [notice, setNotice] = useState<"invalid" | "saved" | null>(null);
  const detected = cv ? detectCvFields(cv.text) : {};
  const hasDetected = Object.keys(detected).length > 0;
  const set = <K extends keyof ApplicantProfile>(
    key: K,
    value: ApplicantProfile[K],
  ) => {
    setNotice(null);
    setProfile((old) => ({ ...old, [key]: value }));
  };

  function save(event: FormEvent) {
    event.preventDefault();
    const result = profileSchema.safeParse({ ...profile, isDemo: false });
    if (!result.success) {
      setNotice("invalid");
      return;
    }
    if (
      update((old) => ({
        ...old,
        profile: result.data,
        studio: {
          ...(old.studio ?? studio),
          name: personal.name.trim(),
          school: personal.school.trim(),
          qualification: personal.qualification.trim(),
          graduationYear: personal.graduationYear ? Number(personal.graduationYear) : undefined,
          cv,
        },
      }))
    ) {
      setNotice("saved");
      onSaved?.();
    }
  }

  return (
    <form className={style.stack} onSubmit={save}>
      {initialSection && (
        <div className={board.editorTabs}>
          {([
            ["identity", t("Personal details", "Личные данные", "Жеке деректер")],
            ["academics", t("Academics", "Учёба", "Оқу")],
            ["document", t("Résumé / CV", "Резюме / CV", "Түйіндеме / CV")],
          ] as const).map(([id, label]) => (
            <button key={id} type="button" aria-pressed={section === id} onClick={() => setSection(id)}>{label}</button>
          ))}
        </div>
      )}
      <div className={initialSection ? board.editorSections : style.split}>
        <section className={style.panel} hidden={!!section && section !== "identity"}>
          <div className={style.sectionHeading}>
            <UserRound size={19} />
            <h2>{t("About you", "О вас", "Өзіңіз туралы")}</h2>
          </div>
          <div className={style.fields}>
            <label>
              {t(
                "Name for this workspace",
                "Имя в кабинете",
                "Кабинеттегі атыңыз",
              )}
              <input
                autoComplete="given-name"
                maxLength={70}
                value={personal.name}
                onChange={(e) => {
                  setNotice(null);
                  setPersonal({ ...personal, name: e.target.value });
                }}
              />
            </label>
            <label>
              {t("Secondary school", "Школа", "Мектеп")}
              <input
                maxLength={120}
                value={personal.school}
                onChange={(e) => {
                  setNotice(null);
                  setPersonal({ ...personal, school: e.target.value });
                }}
              />
            </label>
            <label className={style.wide}>
              {t(
                "Qualification or curriculum",
                "Аттестат или учебная программа",
                "Аттестат немесе оқу бағдарламасы",
              )}
              <input
                maxLength={120}
                value={personal.qualification}
                onChange={(e) => {
                  setNotice(null);
                  setPersonal({ ...personal, qualification: e.target.value });
                }}
              />
            </label>
            <label>
              {t("Intended subject", "Направление", "Оқу бағыты")}
              <select
                value={profile.major}
                onChange={(e) => set("major", e.target.value)}
              >
                <option value="">
                  {t(
                    "Choose subject",
                    "Выбрать направление",
                    "Бағытты таңдаңыз",
                  )}
                </option>
                {profile.major && !programTaxonomy.includes(profile.major) && (
                  <option>{profile.major}</option>
                )}
                {programTaxonomy.map((major) => (
                  <option key={major}>{major}</option>
                ))}
              </select>
            </label>
            <label>
              {t("Graduation year", "Год окончания школы", "Мектеп бітіру жылы")}
              <input type="number" min={1950} max={2100} value={personal.graduationYear}
                onChange={(e) => {
                  setNotice(null);
                  setPersonal({ ...personal, graduationYear: e.target.value });
                }}
              />
            </label>
            <label>
              {t("Entry year", "Год поступления", "Оқуға түсу жылы")}
              <select
                value={profile.entryYear}
                onChange={(e) => set("entryYear", Number(e.target.value))}
              >
                {Array.from({ length: 9 }, (_, i) => i + 2027).map((year) => (
                  <option key={year}>{year}</option>
                ))}
              </select>
            </label>
            <label>
              {t("Citizenship", "Гражданство", "Азаматтық")}
              <input
                maxLength={100}
                value={profile.citizenship}
                onChange={(e) => set("citizenship", e.target.value)}
              />
            </label>
            <label>
              {t("Add a destination", "Добавить страну", "Ел қосу")}
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value)
                    set("targetCountries", [
                      ...profile.targetCountries,
                      e.target.value,
                    ]);
                }}
              >
                <option value="">
                  {t("Choose country", "Выбрать страну", "Елді таңдаңыз")}
                </option>
                {countries
                  .filter((c) => !profile.targetCountries.includes(c))
                  .map((c) => (
                    <option key={c}>{c}</option>
                  ))}
              </select>
            </label>
            {!!profile.targetCountries.length && (
              <div className={style.chips + " " + style.wide}>
                {profile.targetCountries.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() =>
                      set(
                        "targetCountries",
                        profile.targetCountries.filter((value) => value !== c),
                      )
                    }
                    aria-label={t("Remove ", "Убрать ", "Алып тастау ") + c}
                  >
                    {c} ×
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className={style.panel} hidden={!!section && section !== "document"}>
          <div className={style.sectionHeading}>
            <FileText size={19} />
            <h2>{t("Résumé / CV", "Резюме / CV", "Түйіндеме / CV")}</h2>
          </div>
          <p className={style.quiet}>
            {t(
              "Upload a CV to pull out the scores it contains. Review the fields before saving.",
              "Загрузите CV, чтобы извлечь указанные баллы. Сверьте поля перед сохранением.",
              "Балдарды бөліп алу үшін CV жүктеңіз. Сақтар алдында өрістерді тексеріңіз.",
            )}
          </p>
          <DocumentPicker
            language={language}
            title={t(
              "Choose or drop your CV",
              "Выбрать или перетащить CV",
              "CV таңдау немесе сүйреп әкелу",
            )}
            onRead={(value) => {
              setCv(value);
              setNotice(null);
            }}
          />
          {cv && (
            <div className={style.attached}>
              <div>
                <FileText size={17} />
                <strong title={cv.fileName}>{cv.fileName}</strong>
                <button
                  type="button"
                  className={style.iconButton}
                  aria-label={t(
                    "Remove résumé",
                    "Удалить резюме",
                    "Түйіндемені өшіру",
                  )}
                  onClick={() => {
                    setCv(null);
                    setNotice(null);
                  }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
              <div className={style.inlineActions}>
                <button
                  type="button"
                  className={style.secondary}
                  onClick={() => setShowText(!showText)}
                >
                  {showText
                    ? t("Hide text", "Скрыть текст", "Мәтінді жасыру")
                    : t(
                        "Read extracted text",
                        "Посмотреть текст",
                        "Алынған мәтінді оқу",
                      )}
                </button>
                {hasDetected && (
                  <button
                    type="button"
                    className={style.secondary}
                    onClick={() => {
                      setNotice(null);
                      setProfile((old) => ({ ...old, ...detected }));
                      if (section) setSection("academics");
                    }}
                  >
                    {t(
                      "Fill detected scores",
                      "Заполнить найденные баллы",
                      "Табылған балдарды толтыру",
                    )}
                  </button>
                )}
              </div>
              {!hasDetected && (
                <small>
                  {t(
                    "Add grades manually if the résumé uses a different format.",
                    "Если баллы записаны в другом формате, добавьте их вручную.",
                    "Балдар басқа форматта болса, қолмен енгізіңіз.",
                  )}
                </small>
              )}
              {showText && <pre className={style.extracted}>{cv.text}</pre>}
            </div>
          )}
          <small className={style.quiet}>
            {t(
              "Files are read in this browser. Saving keeps the extracted text on this device.",
              "Файлы читаются в браузере. Извлечённый текст сохраняется на этом устройстве.",
              "Файлдар браузерде оқылады. Алынған мәтін осы құрылғыда сақталады.",
            )}
          </small>
        </section>
      </div>

      <section className={style.panel} hidden={!!section && section !== "academics"}>
        <div className={style.sectionHeading}>
          <GraduationCap size={20} />
          <h2>
            {t(
              "Academics and budget",
              "Оценки, тесты и бюджет",
              "Бағалар, тесттер және бюджет",
            )}
          </h2>
        </div>
        <div className={style.fields + " " + style.academics}>
          <label>
            GPA
            <input
              inputMode="decimal"
              maxLength={100}
              value={profile.grades}
              onChange={(e) => set("grades", e.target.value)}
            />
          </label>
          <label>
            {t("Grading scale", "Шкала оценок", "Бағалау шкаласы")}
            <select
              value={profile.gradingScale}
              onChange={(e) =>
                set(
                  "gradingScale",
                  e.target.value as ApplicantProfile["gradingScale"],
                )
              }
            >
              <option value="">—</option>
              {["4.0", "5.0", "10", "100", "Other"].map((scale) => (
                <option key={scale}>{scale}</option>
              ))}
            </select>
          </label>
          <label>
            SAT
            <input
              type="number"
              min={400}
              max={1600}
              value={profile.sat ?? ""}
              onChange={(e) => set("sat", amount(e.target.value))}
            />
          </label>
          <label>
            SAT Math
            <input
              type="number"
              min={200}
              max={800}
              value={profile.satMath ?? ""}
              onChange={(e) => set("satMath", amount(e.target.value))}
            />
          </label>
          <label>
            ACT
            <input
              type="number"
              min={1}
              max={36}
              value={profile.act ?? ""}
              onChange={(e) => set("act", amount(e.target.value))}
            />
          </label>
          <label>
            {t("English test", "Тест по английскому", "Ағылшын тілі тесті")}
            <select
              value={profile.englishTest}
              onChange={(e) => {
                setNotice(null);
                setProfile((old) => ({
                  ...old,
                  englishTest: e.target
                    .value as ApplicantProfile["englishTest"],
                  englishScore: null,
                }));
              }}
            >
              <option value="">—</option>
              {["IELTS", "TOEFL", "Duolingo"].map((test) => (
                <option key={test}>{test}</option>
              ))}
            </select>
          </label>
          <label>
            {t("English score", "Балл по английскому", "Ағылшын тілі балы")}
            <input
              type="number"
              min={0}
              max={
                profile.englishTest === "IELTS"
                  ? 9
                  : profile.englishTest === "TOEFL"
                    ? profile.toeflScale === "6"
                      ? 6
                      : 120
                    : 160
              }
              step={
                profile.englishTest === "IELTS" || profile.toeflScale === "6"
                  ? 0.5
                  : 1
              }
              disabled={!profile.englishTest}
              value={profile.englishScore ?? ""}
              onChange={(e) => set("englishScore", amount(e.target.value))}
            />
          </label>
          {profile.englishTest === "TOEFL" && (
            <label>
              {t("TOEFL scale", "Шкала TOEFL", "TOEFL шкаласы")}
              <select
                value={profile.toeflScale ?? "120"}
                onChange={(e) =>
                  set("toeflScale", e.target.value as "120" | "6")
                }
              >
                <option>120</option>
                <option>6</option>
              </select>
            </label>
          )}
          <label>
            {t("Annual budget", "Годовой бюджет", "Жылдық бюджет")}
            <input
              type="number"
              min={0}
              max={10000000}
              value={profile.budget ?? ""}
              onChange={(e) => set("budget", amount(e.target.value))}
            />
          </label>
          <label>
            {t("Currency", "Валюта", "Валюта")}
            <select
              value={profile.currency}
              onChange={(e) =>
                set("currency", e.target.value as ApplicantProfile["currency"])
              }
            >
              {currencySchema.options.map((currency) => (
                <option key={currency}>{currency}</option>
              ))}
            </select>
          </label>
        </div>
      </section>
      <div className={style.inlineActions}>
        <button type="submit" className={style.primary} disabled={disabled}>
          <Check size={17} />
          {t("Save profile", "Сохранить профиль", "Профильді сақтау")}
        </button>
        {notice === "saved" && (
          <span role="status" className={style.quiet}>
            {t(
              "Saved on this device",
              "Сохранено на устройстве",
              "Осы құрылғыда сақталды",
            )}
          </span>
        )}
        {notice === "invalid" && (
          <span role="alert" className={style.formError}>
            {t(
              "Check your scores and grading scale.",
              "Проверьте баллы и выбранные шкалы.",
              "Балдар мен таңдалған шкалаларды тексеріңіз.",
            )}
          </span>
        )}
      </div>
    </form>
  );
}
