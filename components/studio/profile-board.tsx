"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import {
  ArrowRight, ArrowUpRight, Award, BookOpen, Compass, FileText, Globe2, GraduationCap,
  Landmark, Pencil, Plus, School, UserRound, UsersRound, Wallet, X,
} from "lucide-react";
import { useApp } from "@/components/providers";
import { emptyStudio, type ApplicantStudio } from "@/types/studio";
import type { Language } from "@/lib/advisor/contracts";
import { activityNames } from "@/lib/studio/copy";
import { reviewActivity, tr } from "@/lib/studio/reviews";
import { ApplicantProfileEditor, type ProfileSection } from "./applicant-profile";
import { DocumentPicker } from "./document-picker";
import { ProfileShortlist } from "./profile-shortlist";
import { studioHref } from "./types";
import studioCss from "./studio.module.css";
import css from "./profile-board.module.css";

function ScoreGauge({ label, value, maximum, minimum = 0, color, empty, onEdit, language }: {
  label: string; value?: string | number | null; maximum: number | null; minimum?: number;
  color: string; empty: string; onEdit: () => void; language: Language;
}) {
  const hasValue = value != null && value !== "";
  const numeric = hasValue && maximum !== null ? Number(value) : NaN;
  const measured = Number.isFinite(numeric) && maximum !== null && numeric >= minimum && numeric <= maximum;
  const progress = measured ? (numeric - minimum) / (maximum! - minimum) * 100 : 0;
  const outOf = tr(language, ["of", "из", "/"]);
  return <div className={css.score} data-color={color}>
    <h3>{label}</h3>
    {hasValue ? (
      <div className={measured ? css.gauge : css.rawGrade}
        role={measured ? "meter" : undefined}
        aria-label={measured ? label : undefined}
        aria-valuemin={measured ? minimum : undefined}
        aria-valuemax={measured ? maximum! : undefined}
        aria-valuenow={measured ? numeric : undefined}
        aria-valuetext={measured ? value + " " + outOf + " " + maximum : undefined}>
        {measured && <svg viewBox="0 0 120 69" aria-hidden="true"><path d="M8 60a52 52 0 0 1 104 0" pathLength="100"/><path className={css.arc} d="M8 60a52 52 0 0 1 104 0" pathLength="100" strokeDasharray={progress + " 100"} opacity={progress === 0 ? 0 : 1}/></svg>}
        <strong>{value}</strong>
        {measured && <small>{outOf} {maximum}</small>}
      </div>
    ) : <button className={css.addScore} type="button" onClick={onEdit} aria-label={empty + " · " + label}><Plus size={15}/>{empty}</button>}
  </div>;
}

export function ProfileBoard({ countries }: { countries: string[] }) {
  const { state, ready, blocked, update, toast } = useApp();
  const studio = state.studio ?? emptyStudio;
  const language = studio.language ?? "en";
  const t = (en: string, ru: string, kk: string) => tr(language, [en, ru, kk]);
  const profile = state.profile?.isDemo ? null : state.profile;
  const saveStudio = (fn: (old: ApplicantStudio) => ApplicantStudio) =>
    update((current) => ({ ...current, studio: fn(current.studio ?? emptyStudio) }));
  const modal = useRef<HTMLDialogElement>(null);
  const [editor, setEditor] = useState<{ section: ProfileSection; file?: NonNullable<ApplicantStudio["cv"]> }>();
  const open = (section: ProfileSection, file?: NonNullable<ApplicantStudio["cv"]>) => {
    setEditor({ section, file });
    modal.current?.showModal();
  };
  const close = () => modal.current?.close();
  const edit = t("Edit", "Изменить", "Өзгерту");
  const addScore = t("Add score", "Добавить балл", "Балл қосу");
  const english = profile?.englishTest;
  const englishMax = english === "TOEFL" ? Number(profile?.toeflScale ?? "120") : english === "IELTS" ? 9 : english === "Duolingo" ? 160 : null;
  const initials = studio.name.trim().split(/\s+/u).slice(0, 2).map((part) => Array.from(part)[0]).join("").toLocaleUpperCase();
  const recognitions = [...(studio.honors ?? []), ...(studio.achievements ?? [])];
  const editButton = (section: ProfileSection, title: string) =>
    <button type="button" className={css.textAction} aria-label={edit + " · " + title} onClick={() => open(section)} disabled={blocked}><Pencil size={13}/>{edit}</button>;
  const academics = t("Academics", "Учёба", "Оқу");
  const details = t("Personal details", "Личные данные", "Жеке деректер");
  const tools = [
    { title: t("University fit", "Готовность к вузу", "Университетке сәйкестік"), body: t("Check your results against a university’s requirements.", "Сверить баллы с требованиями вуза.", "Баллдарыңызды университет талабымен салыстырыңыз."), href: studioHref("fit"), icon: Compass, tone: "rose" },
    { title: t("College matcher", "Подбор вузов", "Университет таңдау"), body: t("Find colleges for your profile and budget.", "Найти вузы по профилю и бюджету.", "Профиль мен бюджетке сай университеттер."), href: "/match", icon: GraduationCap, tone: "sky" },
    { title: t("Explore majors", "Направления", "Мамандықтар"), body: profile?.major || t("Browse undergraduate programs.", "Посмотреть программы бакалавриата.", "Бакалавриат бағдарламаларын шолу."), href: profile?.major ? "/explore?major=" + encodeURIComponent(profile.major) : "/explore", icon: BookOpen, tone: "lilac" },
    { title: t("Scholarships", "Стипендии", "Шәкіртақылар"), body: t("Explore awards and financial aid.", "Посмотреть стипендии и финансовую помощь.", "Шәкіртақы мен қаржылай көмекті іздеңіз."), href: "/funding", icon: Wallet, tone: "mint" },
  ];

  if (!ready) return <p role="status" className={css.loading}>{t("Loading profile…","Загружаем профиль…","Профиль жүктелуде…")}</p>;
  return <div className={css.page} lang={language}><div className={css.board}>
    <header className={css.identity}>
      <div className={css.avatar} aria-hidden="true">{initials || <UserRound/>}</div>
      <div className={css.bio}>
        <div><h1>{studio.name || t("My profile", "Мой профиль", "Менің профилім")}</h1>
          <button type="button" className={css.iconAction} aria-label={edit + " · " + details} onClick={() => open("identity")} disabled={blocked}><Pencil size={14}/></button></div>
        {studio.school ? <p><School size={13}/>{studio.school}</p> : <button disabled={blocked} className={css.textAction} onClick={() => open("identity")}><Plus size={13}/>{t("Add your school","Добавить школу","Мектеп қосу")}</button>}
        {studio.qualification && <p><GraduationCap size={13}/>{studio.qualification}</p>}
      </div>
      <nav className={css.tabs} aria-label={t("Profile navigation","Разделы профиля","Профиль мәзірі")}>
        <Link href={studioHref("profile")} aria-current="page">{t("Profile","Профиль","Профиль")}</Link>
        <Link href="/my-list">{t("My List","Мой список","Тізімім")}</Link>
        <Link href="/funding?saved=1">{t("Saved funding","Мои стипендии","Шәкіртақыларым")}</Link>
      </nav>
      <label className={css.language}><Globe2 size={14}/><span className="sr-only">{t("Workspace language","Язык кабинета","Кабинет тілі")}</span>
        <select value={language} disabled={blocked} onChange={(event) => saveStudio((old) => ({ ...old, language: event.target.value as Language }))}>
          <option value="en">English</option><option value="ru">Русский</option><option value="kk">Қазақша</option>
        </select>
      </label>
    </header>
    <div className={css.layout}>
      <div className={css.column}>
        <section className={css.panel}>
          <div className={css.facts}>
            {[
              [t("Graduation year","Год выпуска","Бітіру жылы"),studio.graduationYear],
              [t("Intended major","Направление","Оқу бағыты"),profile?.major],
            ].map(([label,value]) => <div className={css.fact} key={label}><small>{label}</small>{value ? <strong>{value}</strong> :
              <button type="button" onClick={() => open("identity")} disabled={blocked}><Plus size={13}/>{t("Add","Добавить","Қосу")}</button>}</div>)}
            {editButton("identity", t("Education plans","Учебные планы","Оқу жоспарлары"))}
          </div>
          <ProfileShortlist language={language}/>
        </section>
        <section className={css.importPanel}>
          <div className={css.fileIcon}><FileText size={27} strokeWidth={1.5}/></div>
          <div><h2>{t("Import your résumé","Загрузить резюме","Түйіндеме жүктеу")}</h2>
            {studio.cv ? <button className={css.textAction} type="button" onClick={() => open("document")}>{studio.cv.fileName} <ArrowUpRight size={12}/></button> :
              <p>{t("Upload a CV to prefill your test scores.", "Загрузите CV, чтобы заполнить результаты тестов.", "Тест балдарын толтыру үшін CV жүктеңіз.")}</p>}</div>
          {!blocked && <DocumentPicker compact language={language} title={t("Choose file","Выбрать файл","Файл таңдау")} onRead={(file) => open("document", file)}/>}
        </section>
        <section className={css.panel}>
          <div className={css.sectionTitle}><h2>{academics}</h2>{editButton("academics", academics)}</div>
          {studio.school && <div className={css.school}><Landmark size={16}/><div><strong>{studio.school}</strong>{studio.qualification && <small>{studio.qualification}</small>}</div></div>}
          <div className={css.scores}>
            <ScoreGauge label="GPA" value={profile?.grades} maximum={profile?.gradingScale && profile.gradingScale !== "Other" ? Number(profile.gradingScale) : null} color="blue" language={language} empty={addScore} onEdit={() => open("academics")}/>
            <ScoreGauge label={english || t("English test","Английский","Ағылшын тілі")} value={english ? profile?.englishScore : null} maximum={englishMax} color="teal" language={language} empty={addScore} onEdit={() => open("academics")}/>
            {(profile?.sat != null || profile?.act == null) && <ScoreGauge label="SAT" value={profile?.sat} maximum={1600} minimum={400} language={language} color="blue" empty={addScore} onEdit={() => open("academics")}/>}
            {profile?.act != null && <ScoreGauge label="ACT" value={profile.act} maximum={36} minimum={1} language={language} color="lilac" empty={addScore} onEdit={() => open("academics")}/>}
          </div>
          {profile?.satMath != null && <div className={css.scoreDetail}>SAT Math <b>{profile.satMath} / 800</b></div>}
        </section>
        <section className={css.panel}>
          <div className={css.sectionTitle}><h2>{t("Activities","Активности","Іс-шаралар")} <span>{studio.activities.length}</span></h2><Link className={css.textAction} href={studioHref("activities")}>{studio.activities.length ? edit : t("Add activity","Добавить","Қосу")} <ArrowUpRight size={14}/></Link></div>
          {studio.activities.length ? <ul className={css.records}>{studio.activities.map((activity) => {
            const tier = reviewActivity(activity)?.tier;
            return <li key={activity.id}><UsersRound size={17}/><div><strong>{activity.title}</strong><small>{[activity.role, tr(language, activityNames[activity.category])].filter(Boolean).join(" · ")}</small></div>{tier && <b title={t("Estimated activity tier","Оценка активности","Іс-шара деңгейі")}>{tier}</b>}</li>;
          })}</ul> : <p className={css.dim}>{t("Add a club, project, job or volunteer role.", "Добавьте свой проект, кружок, работу или волонтёрство.", "Жобаны, үйірмені, жұмысты немесе еріктілік тәжірибесін қосыңыз.")}</p>}
        </section>
        <section className={css.panel}>
          <div className={css.sectionTitle}><h2>{t("Honors & achievements","Награды и достижения","Марапаттар мен жетістіктер")} <span>{recognitions.length}</span></h2><Link className={css.textAction} href={studioHref("honors")}>{recognitions.length ? edit : t("Add","Добавить","Қосу")} <ArrowUpRight size={14}/></Link></div>
          {recognitions.length ? <ul className={css.records}>{recognitions.map((record,index) => <li key={record.id + index}><Award size={17}/><div><strong>{record.title}</strong><small>{[record.context,record.date].filter(Boolean).join(" · ")}</small></div></li>)}</ul> : <p className={css.dim}>{t("Record an award or distinction.", "Добавьте награду или другое достижение.", "Марапатты немесе жетістікті енгізіңіз.")}</p>}
        </section>
      </div>
      <aside className={css.discovery}>
        {tools.map(({title,body,href,icon: Icon,tone}) => <Link key={href} className={css.tool} href={href} data-tone={tone} prefetch={false}><h2>{title}</h2><p>{body}</p><span>{t("Open","Открыть","Ашу")} <ArrowRight size={12}/></span><Icon aria-hidden="true" className={css.toolArt} strokeWidth={1.4}/></Link>)}
        <Link className={css.preferences} href="/profile#data">{t("Preferences & backup","Настройки и резервная копия","Баптаулар мен сақтық көшірме")} <ArrowUpRight size={13}/></Link>
      </aside>
    </div>
    <dialog ref={modal} className={css.dialog} onClose={() => setEditor(undefined)} aria-labelledby="profile-dialog-title">
      {editor && <div className={studioCss.studio + " " + css.editor}>
        <div className={css.dialogHead}><h2 id="profile-dialog-title">{t("Edit profile","Редактировать профиль","Профильді өңдеу")}</h2>
          <button type="button" autoFocus onClick={close} aria-label={t("Close","Закрыть","Жабу")}><X size={18}/></button></div>
        <ApplicantProfileEditor countries={countries} language={language} studio={studio} save={saveStudio} initialSection={editor.section} initialDocument={editor.file} onSaved={() => { close(); toast(t("Profile saved","Профиль сохранён","Профиль сақталды")); }}/>
      </div>}
    </dialog>
  </div></div>;
}
