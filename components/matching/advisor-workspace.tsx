"use client";

import Link from "next/link";
import {
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronDown,
  ListChecks,
  Paperclip,
  Square,
  X,
} from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useApp } from "@/components/providers";
import { MascotMark } from "@/components/studio/mascot";
import type { SchoolOption } from "@/components/studio/types";
import type { ApplicantProfile } from "@/types/domain";
import type {
  AdvisorFact,
  AdvisorFrame,
  AdvisorProfile,
  AdvisorResult,
  Dialogue,
  Language,
} from "@/lib/advisor/contracts";
import { answerLanguage } from "@/lib/advisor/language";
import {
  checks,
  fieldCopy,
  label,
  statuses,
  stepCopy,
} from "@/lib/advisor/copy";
import styles from "./advisor-workspace.module.css";

type DemoMode = "catalogue" | "local" | "protected";
type Reply = {
  question: string;
  language: Language;
  data?: AdvisorResult;
  dialogue?: Dialogue;
  coaching?: string;
  issue?: "network" | "rate" | "cancel";
};

const starters = [
  [
    "What IELTS score does MIT ask for?",
    "Какой IELTS нужен в MIT?",
    "MIT үшін қандай IELTS балы керек?",
  ],
  [
    "Compare MIT and Princeton based on my profile",
    "Сравни MIT и Принстон по моему профилю",
    "MIT пен Princeton-ды профиліме сай салыстыр",
  ],
  [
    "Find full tuition scholarships",
    "Найди стипендии на полную оплату обучения",
    "Оқу ақысын толық өтейтін шәкіртақыларды тап",
  ],
  [
    "What is Harvard’s acceptance rate?",
    "Какая доля принятых в Гарвард?",
    "Гарвардтың қабылдау үлесі қандай?",
  ],
] satisfies [string, string, string][];

function sharedProfile(
  profile: ApplicantProfile | null,
): AdvisorProfile | undefined {
  if (!profile || profile.isDemo) return undefined;
  const scale = Number(profile.gradingScale);
  const grade = Number(profile.grades);
  const hasGrade =
    !!profile.grades.trim() &&
    [4, 5, 10, 100].includes(scale) &&
    Number.isFinite(grade) &&
    grade >= 0 &&
    grade <= scale;
  const receivesBudget = profile.budget !== null && profile.budget <= 1_000_000;
  return {
    major: profile.major.slice(0, 80).trim() || undefined,
    countries: profile.targetCountries
      .filter(Boolean)
      .slice(0, 6)
      .map((country) => country.slice(0, 80)),
    nationality: /^[A-Za-z]{2}$/.test(profile.citizenship)
      ? profile.citizenship.toUpperCase()
      : undefined,
    sat: profile.sat ?? undefined,
    satMath:
      profile.satMath != null &&
      (profile.sat === null ||
        (profile.sat - profile.satMath >= 200 &&
          profile.sat - profile.satMath <= 800))
        ? profile.satMath
        : undefined,
    ielts:
      profile.englishTest === "IELTS"
        ? (profile.englishScore ?? undefined)
        : undefined,
    gpa: hasGrade ? grade : undefined,
    gpaScale: hasGrade ? (scale as 4 | 5 | 10 | 100) : undefined,
    budget: receivesBudget ? profile.budget! : undefined,
    currency: receivesBudget ? profile.currency : undefined,
    funding: profile.aidPreference === "Merit" ? "merit" : undefined,
  };
}

function EvidenceDetails({ reply, index }: { reply: Reply; index: number }) {
  const { data, dialogue, language } = reply;
  const [showProfiles, setShowProfiles] = useState(false);
  if (!data || !data.cards.length) return null;
  const t = (en: string, ru: string, kk: string) =>
    label(language, [en, ru, kk]);
  const facts = (items: AdvisorFact[]) => {
    const focused = items.filter(({ field }) =>
      dialogue?.emphasizedFields.includes(field),
    );
    return focused.length ? focused : items.slice(0, 4);
  };
  const fieldName = (fact: string) =>
    fieldCopy[fact] ? label(language, fieldCopy[fact]) : fact;
  const renderFact = (fact: AdvisorFact) => (
    <div className={styles.factText}>
      <span>{fact.value ?? t("Unavailable", "Неизвестно", "Белгісіз")}</span>
      <small>
        {label(language, statuses[fact.status])}
        {fact.cycle ? " · " + fact.cycle : ""}
      </small>
      {fact.scope && <small>{fact.scope}</small>}
      {fact.note && <small>{fact.note}</small>}
    </div>
  );
  const compare = data.intent === "compare";
  const comparisonFields = [
    ...new Set(
      data.cards.flatMap((school) =>
        facts(school.facts).map(({ field }) => field),
      ),
    ),
  ];
  const showAwards = dialogue?.focus === "aid" || data.intent === "funding";
  const relevantIds = data.cards.flatMap((school) => [
    ...(showAwards ? school.funding.map((award) => award.ref) : []),
    ...facts(school.facts)
      .filter((fact) => fact.value !== null)
      .flatMap((fact) => fact.refs),
  ]);
  const source = data.evidence.find(({ id }) => id === relevantIds[0]);

  return (
    <div className={styles.research}>
      <div className={styles.schoolLinks}>
        {data.cards.map((school) => (
          <Link
            href={"/universities/" + school.id}
            key={school.id}
            prefetch={false}
          >
            {school.name}
            <ArrowUpRight size={13} />
          </Link>
        ))}
      </div>
      <details open={compare} className={styles.disclosure}>
        <summary>
          <span>
            {compare
              ? t(
                  "University comparison",
                  "Сравнение вузов",
                  "Университеттерді салыстыру",
                )
              : showAwards
                ? t(
                    "Funding details",
                    "Условия финансирования",
                    "Қаржыландыру шарттары",
                  )
                : t(
                    "Requirements and details",
                    "Требования и детали",
                    "Талаптар мен мәліметтер",
                  )}
          </span>
          <ChevronDown size={16} />
        </summary>
        {compare && (
          <button
            type="button"
            className={styles.researchButton}
            onClick={() => setShowProfiles(!showProfiles)}
          >
            {showProfiles
              ? t("Table", "Таблица", "Кесте")
              : t("Profiles", "Профили", "Профильдер")}
          </button>
        )}
        {compare && !showProfiles ? (
          <div
            className={styles.compareScroll}
            tabIndex={0}
            role="region"
            aria-label={t(
              "University comparison",
              "Сравнение вузов",
              "Университеттерді салыстыру",
            )}
          >
            <table className={styles.comparison}>
              <thead>
                <tr>
                  <th scope="col">{t("Evidence", "Данные", "Дерек")}</th>
                  {data.cards.map((u) => (
                    <th scope="col" key={u.id}>
                      <Link href={"/universities/" + u.id} prefetch={false}>
                        {u.name}
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonFields.map((key) => (
                  <tr key={key}>
                    <th scope="row">{fieldName(key)}</th>
                    {data.cards.map((school) => {
                      const fact = school.facts.find(
                        ({ field }) => field === key,
                      );
                      return (
                        <td key={school.id}>{fact ? renderFact(fact) : "—"}</td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          data.cards.map((school) => (
            <article className={styles.schoolDetail} key={school.id}>
              <h3>
                <Link href={"/universities/" + school.id} prefetch={false}>
                  {school.name}
                </Link>
              </h3>
              {!!school.checks.length && (
                <ul>
                  {school.checks.map((check) => (
                    <li key={check}>{label(language, checks[check])}</li>
                  ))}
                </ul>
              )}
              {facts(school.facts).map((fact) => (
                <div className={styles.detailLine} key={fact.field}>
                  <strong>{fieldName(fact.field)}</strong>
                  {renderFact(fact)}
                </div>
              ))}
              {showAwards &&
                school.funding.map((award) => (
                  <div className={styles.award} key={award.ref + award.name}>
                    <strong>{award.name}</strong>
                    <p>{award.coverage}</p>
                    {award.amount !== null && (
                      <p>
                        {new Intl.NumberFormat(language, {
                          style: "currency",
                          currency: award.currency,
                        }).format(award.amount)}
                      </p>
                    )}
                    {award.application && <small>{award.application}</small>}
                    {award.renewal && <small>{award.renewal}</small>}
                    {award.eligibilityTerms && (
                      <small>{award.eligibilityTerms}</small>
                    )}
                    {award.deadline.value && renderFact(award.deadline)}
                  </div>
                ))}
            </article>
          ))
        )}
      </details>
      {!!data.plan.length && (
        <details className={styles.disclosure} open={data.intent === "roadmap"}>
          <summary>
            <span>
              <ListChecks size={16} />
              {t("Next steps", "Следующие шаги", "Келесі қадамдар")}
            </span>
            <ChevronDown size={16} />
          </summary>
          <ol className={styles.sourceList}>
            {data.plan.map((step) => (
              <li key={step.action}>
                {label(language, stepCopy[step.action])}
              </li>
            ))}
          </ol>
        </details>
      )}
      {source && (
        <details className={styles.disclosure}>
          <summary>
            <h3>
              <BookOpen size={16} />
              {t(
                "Official sources",
                "Официальные источники",
                "Ресми дереккөздер",
              )}
            </h3>
            <ChevronDown size={16} />
          </summary>
          <ul className={styles.sourceList}>
            <li id={`advisor-source-${index}-1`}>
              <a href={source.url} target="_blank" rel="noreferrer">
                {source.title}
                <ArrowUpRight size={13} />
              </a>
              <small>
                {t("Checked", "Проверено", "Тексерілген")} {source.checkedAt}
                {source.cycle ? " · " + source.cycle : ""}
              </small>
            </li>
          </ul>
        </details>
      )}
    </div>
  );
}

export function AdvisorWorkspace({
  language,
  options,
  selected,
  initialQuestion = "",
}: {
  language: Language;
  options: SchoolOption[];
  selected?: string;
  initialQuestion?: string;
}) {
  const t = (en: string, ru: string, kk: string) =>
    label(language, [en, ru, kk]);
  const { state } = useApp();
  const [schoolIds, setSchools] = useState(selected ? [selected] : []);
  const [attach, setAttach] = useState(false);
  const [turns, setTurns] = useState<Reply[]>([]);
  const [question, setQuestion] = useState(initialQuestion);
  const [demo, setDemo] = useState<DemoMode>("catalogue");
  const [consent, setConsent] = useState(false);
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [showContext, setShowContext] = useState(!!selected);
  const field = useRef<HTMLTextAreaElement>(null);
  const scrollArea = useRef<HTMLDivElement>(null);
  const active = useRef<AbortController | null>(null);
  const focusLatest = useRef(false);
  const [contextStart, setContextStart] = useState(0);
  const previous = turns
    .slice(contextStart)
    .reverse()
    .find(
      (turn) =>
        turn.data?.cards.length ||
        (turn.dialogue?.kind === "clarify" &&
          turn.dialogue.focus !== "general"),
    );
  const last = turns.at(-1);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/advisor", { signal: controller.signal })
      .then((response) => response.json())
      .then(({ mode }) => {
        if (mode === "local" || mode === "protected") setDemo(mode);
      })
      .catch(() => {});
    return () => {
      controller.abort();
      active.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!focusLatest.current || !scrollArea.current) return;
    const newest = scrollArea.current.lastElementChild;
    if (newest instanceof HTMLElement)
      scrollArea.current.scrollTop = newest.offsetTop - 10;
  }, [turns.length, last?.dialogue]);

  function suggest(text: string) {
    setQuestion(text);
    field.current?.focus();
  }
  async function send(event: FormEvent) {
    event.preventDefault();
    const text = question.trim();
    if (!text || active.current) return;
    const replyLanguage = answerLanguage(
      text,
      previous?.dialogue?.kind === "clarify" ? previous.language : language,
    );
    const index = turns.length;
    const controller = new AbortController();
    active.current = controller;
    focusLatest.current = true;
    setBusy(true);
    setQuestion("");
    setTurns((all) => [...all, { question: text, language: replyLanguage }]);
    const patch = (next: Partial<Reply>) =>
      setTurns((all) =>
        all.map((item, i) => (i === index ? { ...item, ...next } : item)),
      );
    let received = false;
    const demoConsent = demo !== "catalogue" && consent;
    try {
      const response = await fetch("/api/advisor", {
        method: "POST",
        signal: controller.signal,
        headers: {
          "content-type": "application/json",
          ...(demo === "protected" && demoConsent && token
            ? { authorization: "Bearer " + token }
            : {}),
        },
        body: JSON.stringify({
          conversation: true,
          question: text,
          language: replyLanguage,
          universityIds: schoolIds,
          profile: attach ? sharedProfile(state.profile) : undefined,
          previous: previous?.data
            ? {
                intent: previous.data.intent,
                ids: previous.data.cards.map(({ id }) => id),
                focus: previous.dialogue?.focus,
              }
            : undefined,
          demoConsent,
        }),
      });
      if (!response.ok || !response.body) {
        patch({ issue: response.status === 429 ? "rate" : "network" });
        return;
      }
      const reader = response.body
        .pipeThrough(new TextDecoderStream())
        .getReader();
      let buffer = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += value;
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const frame = JSON.parse(line) as AdvisorFrame;
          if (frame.type === "catalogue") {
            received = true;
            patch({ data: frame.result, dialogue: frame.dialogue });
          }
          if (frame.type === "done") patch({ coaching: frame.coaching });
        }
      }
      if (!received) patch({ issue: "network" });
    } catch {
      if (!received)
        patch({ issue: controller.signal.aborted ? "cancel" : "network" });
    } finally {
      if (active.current === controller) {
        active.current = null;
        setBusy(false);
      }
    }
  }

  return (
    <div className={styles.chat}>
      <header className={styles.header}>
        <div className={styles.heading}>
          <MascotMark size={22} />
          <div>
            <h1>
              {t(
                "Admissions Advisor",
                "Помощник по поступлению",
                "Оқуға түсу кеңесшісі",
              )}
            </h1>
            <p>
              {t(
                "Ask Maple about programmes, funding and your next step.",
                "Спросите Мэйпл о программах, стипендиях или следующем шаге.",
                "Мейплден бағдарламалар, шәкіртақы және келесі қадам туралы сұраңыз.",
              )}
            </p>
          </div>
        </div>
        <button
          type="button"
          className={styles.contextButton}
          onClick={() => setShowContext(!showContext)}
          aria-expanded={showContext}
        >
          <Paperclip size={15} />
          {t("Context", "Контекст", "Деректер")}
          {schoolIds.length || attach
            ? " · " + (schoolIds.length + Number(attach))
            : ""}
        </button>
      </header>
      {showContext && (
        <section className={styles.context}>
          <label>
            {t(
              "Focus your question on a university",
              "Выбрать вуз для вопроса",
              "Сұраққа университет таңдау",
            )}
            <select
              value=""
              disabled={schoolIds.length >= 4}
              onChange={(event) => {
                const value = event.target.value;
                if (value) {
                  setContextStart(turns.length);
                  setSchools([...schoolIds, value]);
                }
              }}
            >
              <option value="">
                {t("Add university", "Добавить вуз", "Университет қосу")}
              </option>
              {options
                .filter(({ id }) => !schoolIds.includes(id))
                .map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.name}
                  </option>
                ))}
            </select>
          </label>
          <div className={styles.contextProfile}>
            <label>
              <input
                type="checkbox"
                disabled={!state.profile || state.profile.isDemo}
                checked={attach}
                onChange={(event) => setAttach(event.target.checked)}
              />
              {t(
                "Use my saved academic profile",
                "Использовать учебный профиль",
                "Сақталған оқу профилімді қолдану",
              )}
            </label>
            <Link href="/studio?view=profile" prefetch={false}>
              {t("Open profile", "Открыть профиль", "Профильді ашу")}
              <ArrowRight size={13} />
            </Link>
          </div>
          {!!schoolIds.length && (
            <div className={styles.schoolLinks}>
              {schoolIds.map((id) => (
                <button
                  type="button"
                  key={id}
                  onClick={() => {
                    setContextStart(turns.length);
                    setSchools(schoolIds.filter((value) => value !== id));
                  }}
                  aria-label={
                    t("Remove ", "Убрать ", "Алып тастау ") +
                    options.find((school) => school.id === id)?.name
                  }
                >
                  {options.find((school) => school.id === id)?.name}
                  <X size={13} />
                </button>
              ))}
            </div>
          )}
        </section>
      )}
      {demo !== "catalogue" && (
        <details className={styles.demo}>
          <summary>
            {t("Authorized AI demo", "Закрытое демо ИИ", "Жабық ЖИ демосы")}
          </summary>
          <label>
            <input
              type="checkbox"
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
            />
            {t(
              "I’m 18+ and my question is synthetic. I allow AidMap to send this demo question to Groq.",
              "Мне 18+, и мой вопрос вымышленный. Разрешаю AidMap передать этот демовопрос в Groq.",
              "Жасым 18-ден асқан, сұрағым ойдан шығарылған. AidMap осы демо сұрақты Groq-қа жібере алады.",
            )}
          </label>
          {demo === "protected" && (
            <label>
              {t("Demo access token", "Токен демо", "Демо токені")}
              <input
                type="password"
                autoComplete="off"
                maxLength={200}
                value={token}
                onChange={(event) => setToken(event.target.value)}
              />
            </label>
          )}
        </details>
      )}
      {!turns.length ? (
        <section className={styles.start}>
          <MascotMark size={25} />
          <h2>
            {t(
              "What’s on your mind?",
              "Что хотите узнать?",
              "Нені білгіңіз келеді?",
            )}
          </h2>
          <div className={styles.suggestions}>
            {starters.map((copy) => (
              <button
                key={copy[0]}
                type="button"
                onClick={() => suggest(label(language, copy))}
              >
                {label(language, copy)}
                <ArrowRight size={15} />
              </button>
            ))}
          </div>
        </section>
      ) : (
        <div
          className={styles.transcript}
          ref={scrollArea}
          onWheel={() => {
            focusLatest.current = false;
          }}
          aria-label={t("Conversation", "Диалог", "Әңгіме")}
        >
          {turns.map((turn, i) => {
            const r = (en: string, ru: string, kk: string) =>
              label(turn.language, [en, ru, kk]);
            const tool =
              turn.dialogue?.kind === "writing"
                ? "essays"
                : turn.dialogue?.kind === "activities"
                  ? "activities"
                  : turn.dialogue?.kind === "profile"
                    ? "profile"
                    : (turn.dialogue?.focus === "eligibility" ||
                          turn.dialogue?.focus === "readiness") &&
                        turn.data?.cards.length === 1
                      ? "fit"
                      : undefined;
            const issue =
              turn.issue === "rate"
                ? r(
                    "Pause for a minute, then try again.",
                    "Подождите минуту и попробуйте снова.",
                    "Бір минут күтіп, қайта көріңіз.",
                  )
                : turn.issue === "cancel"
                  ? r(
                      "Question stopped.",
                      "Запрос остановлен.",
                      "Сұрау тоқтатылды.",
                    )
                  : r(
                      "I couldn’t load the reply. Please retry.",
                      "Ответ не загрузился. Попробуйте ещё раз.",
                      "Жауап жүктелмеді. Қайта көріңіз.",
                    );
            return (
              <article className={styles.turn} key={i} lang={turn.language}>
                <p className={styles.user}>{turn.question}</p>
                <div className={styles.answer}>
                  <MascotMark size={16} />
                  <div className={styles.answerBody}>
                    {turn.dialogue && (
                      <p className={styles.message}>{turn.dialogue.message}</p>
                    )}
                    {turn.coaching && (
                      <p className={styles.coaching}>
                        <strong>
                          {r(
                            "Maple’s AI suggestion",
                            "Совет ИИ от Мэйпл",
                            "Мейплдің ЖИ кеңесі",
                          )}
                        </strong>
                        {turn.coaching}
                      </p>
                    )}
                    {turn.dialogue?.library ? (
                      <Link
                        className={styles.researchButton}
                        href={"/" + turn.dialogue.library}
                      >
                        {turn.dialogue.library === "essays"
                          ? r("Explore essays", "Примеры эссе", "Эссе үлгілері")
                          : r(
                              "Explore profiles",
                              "Примеры профилей",
                              "Профиль үлгілері",
                            )}
                        <ArrowRight size={14} />
                      </Link>
                    ) : (
                      tool && (
                        <Link
                          className={styles.researchButton}
                          href={
                            "/studio?view=" +
                            tool +
                            (tool === "fit"
                              ? "&school=" + turn.data?.cards[0].id
                              : "")
                          }
                        >
                          {tool === "fit"
                            ? r(
                                "Check my readiness",
                                "Проверить готовность",
                                "Дайындықты тексеру",
                              )
                            : r(
                                "Open this tool",
                                "Открыть раздел",
                                "Бөлімді ашу",
                              )}
                          <ArrowRight size={14} />
                        </Link>
                      )
                    )}
                    {turn.data && <EvidenceDetails reply={turn} index={i} />}
                    {i === turns.length - 1 &&
                      !!turn.dialogue?.suggestions.length && (
                        <div className={styles.followUps}>
                          {turn.dialogue.suggestions.map((item) => (
                            <button
                              type="button"
                              key={item}
                              onClick={() => suggest(item)}
                            >
                              {item}
                            </button>
                          ))}
                        </div>
                      )}
                    {turn.issue && (
                      <p className={styles.error} role="alert">
                        {issue}{" "}
                        <button
                          type="button"
                          onClick={() => suggest(turn.question)}
                        >
                          {r(
                            "Edit question",
                            "Изменить вопрос",
                            "Сұрақты өзгерту",
                          )}
                        </button>
                      </p>
                    )}
                    {!turn.dialogue && !turn.issue && (
                      <p className={styles.status} role="status">
                        {r(
                          "Looking through the catalogue…",
                          "Смотрю данные в каталоге…",
                          "Каталогты қарап жатырмын…",
                        )}
                      </p>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
      <form className={styles.composer} onSubmit={send}>
        <label className="sr-only" htmlFor="advisor-question">
          {t("Ask a question", "Задать вопрос", "Сұрақ қою")}
        </label>
        <textarea
          id="advisor-question"
          ref={field}
          maxLength={700}
          rows={2}
          placeholder={t(
            "Ask a question in English, Russian or Kazakh…",
            "Спросите по-русски, по-английски или по-казахски…",
            "Қазақша, орысша немесе ағылшынша сұраңыз…",
          )}
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing
            ) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
        />
        {busy ? (
          <button
            type="button"
            aria-label={t("Stop", "Остановить", "Тоқтату")}
            onClick={() => active.current?.abort()}
          >
            <Square size={17} />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!question.trim()}
            aria-label={t(
              "Send question",
              "Отправить вопрос",
              "Сұрақты жіберу",
            )}
          >
            <ArrowUp size={21} />
          </button>
        )}
      </form>
      <p className={styles.note}>
        <Check size={13} />
        {t(
          "Official sources appear under each answer. Review private drafts in Essays.",
          "Официальные ссылки под ответами. Личные черновики проверяйте в разделе «Эссе».",
          "Ресми сілтемелер жауап астында. Жеке жобаларды «Эссе» бөлімінде тексеріңіз.",
        )}
      </p>
    </div>
  );
}
