"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  Check,
  ArrowLeft,
  BookOpen,
  MapPinned,
  UsersRound,
  Info,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { useApp } from "@/components/providers";
import { proPrices, type BillingInterval } from "@/lib/billing/plans";
import { tr, type Copy } from "@/lib/studio/reviews";
import styles from "./pricing.module.css";

const collections = [
  {
    icon: BookOpen,
    href: "/essays",
    title: ["Essay reading guides", "Разборы эссе", "Эссе талдаулары"],
    detail: [
      "Trace how a writer builds a scene and reflects on it. Follow the source to read the original.",
      "Посмотрите, как автор описывает событие и объясняет его значение. Оригинал можно прочитать у издателя.",
      "Автор оқиғаны қалай баяндап, одан қандай ой түйгенін талдаңыз. Түпнұсқаны баспадан оқыңыз.",
    ],
  },
  {
    icon: UsersRound,
    href: "/profiles",
    title: ["Student profiles", "Профили студентов", "Студент профильдері"],
    detail: [
      "Find a student with interests or experiences you share. Read the context behind their choices.",
      "Найдите студента с похожими интересами или опытом и разберите его выбор.",
      "Қызығушылығы не тәжірибесі ұқсас студентті тауып, оның таңдауын зерттеңіз.",
    ],
  },
  {
    icon: MapPinned,
    href: "/my-list",
    title: [
      "University workspaces",
      "Заявки по вузам",
      "Университет кабинеттері",
    ],
    detail: [
      "Open a university from your list to work through requirements, draft essays and track aid deadlines.",
      "Откройте вуз из своего списка, чтобы сверить требования, подготовить эссе и отследить сроки финансирования.",
      "Тізімнен университетті ашып, талаптарды тексеріңіз, эссе дайындаңыз және қаржыландыру мерзімдерін бақылаңыз.",
    ],
  },
] satisfies {
  icon: typeof BookOpen;
  href: string;
  title: Copy;
  detail: Copy;
}[];

const freeFeatures: Copy[] = [
  ["2 essay reading guides", "2 разбора эссе", "2 эссе талдауы"],
  [
    "2 student profile guides",
    "2 разбора профилей студентов",
    "2 студент профилінің талдауы",
  ],
  [
    "University and scholarship search",
    "Поиск университетов и стипендий",
    "Университет пен шәкіртақы іздеу",
  ],
  [
    "Personal shortlist, profile and essay drafts",
    "Список вузов, профиль и черновики эссе",
    "Университеттер тізімі, профиль және эссе жобалары",
  ],
];
const proFeatures: Copy[] = [
  [
    "Every AidMap essay and profile guide",
    "Все разборы эссе и профилей AidMap",
    "AidMap-тағы барлық эссе және профиль талдауы",
  ],
  [
    "A dedicated workspace for each university",
    "Отдельный кабинет для каждого вуза",
    "Әр университетке жеке кабинет",
  ],
  [
    "Profile checks against university requirements",
    "Сверка профиля с требованиями вуза",
    "Профильді университет талаптарымен салыстыру",
  ],
  [
    "School-specific checklists, drafts and funding deadlines",
    "Чек-листы, черновики и сроки финансирования по вузам",
    "Әр университеттің құжаттар тізімі, эссе жобалары мен қаржыландыру мерзімдері",
  ],
];
const billingNotices: Record<string, Copy> = {
  "checkout-cancelled": [
    "Checkout was cancelled.",
    "Оплата отменена.",
    "Төлем тоқтатылды.",
  ],
  "checkout-pending": [
    "Your subscription is being verified.",
    "Подписка проверяется.",
    "Жазылым тексеріліп жатыр.",
  ],
  unavailable: [
    "Billing is currently unavailable.",
    "Оплата сейчас недоступна.",
    "Төлем қазір қолжетімсіз.",
  ],
  "already-subscribed": [
    "Open subscription settings to review your plan.",
    "Тариф можно проверить в настройках подписки.",
    "Тарифті жазылым баптауларынан тексеруге болады.",
  ],
  error: [
    "Billing could not be opened. Try again.",
    "Не удалось открыть оплату. Попробуйте ещё раз.",
    "Төлем ашылмады. Қайталап көріңіз.",
  ],
};

type PricingProps = {
  plan: "free" | "pro";
  mode: "preview" | "stripe" | "unconfigured";
  canManage: boolean;
  returnTo: string;
  notice?: string;
};

function BillingButton({
  action,
  returnTo,
  children,
  interval,
  previewPlan,
  subtle = false,
}: {
  action: "checkout" | "portal" | "preview";
  returnTo: string;
  children: ReactNode;
  interval?: BillingInterval;
  previewPlan?: PricingProps["plan"];
  subtle?: boolean;
}) {
  return (
    <form action={`/api/billing/${action}`} method="post">
      <input type="hidden" name="return" value={returnTo} />
      {interval && <input type="hidden" name="interval" value={interval} />}
      {previewPlan && <input type="hidden" name="plan" value={previewPlan} />}
      <button
        type="submit"
        className={subtle ? styles.manageButton : styles.planButton}
      >
        {children}
        {!subtle && <ArrowRight size={17} aria-hidden="true" />}
      </button>
    </form>
  );
}

function PlanFeatures({ items }: { items: string[] }) {
  return (
    <ul className={styles.features}>
      {items.map((item) => (
        <li key={item}>
          <Check size={16} strokeWidth={2.1} aria-hidden="true" />
          {item}
        </li>
      ))}
    </ul>
  );
}

export function PricingPlans({
  plan,
  mode,
  canManage,
  returnTo,
  notice,
}: PricingProps) {
  const { state, ready } = useApp();
  const language = state.studio?.language ?? "en";
  const t = (en: string, ru: string, kk: string) => tr(language, [en, ru, kk]);
  const [interval, setInterval] = useState<BillingInterval>("monthly");
  const yearly = interval === "yearly";
  const price = proPrices[interval];
  const currency = new Intl.NumberFormat(language, {
    style: "currency",
    currency: "USD",
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: 0,
  });
  const amount = currency.format(price.usd);
  const current = t("Current plan", "Текущий тариф", "Қазіргі тариф");
  const manage = t(
    "Manage subscription",
    "Управлять подпиской",
    "Жазылымды басқару",
  );
  const isPro = plan === "pro";
  const backHref = returnTo === "/pricing" ? "/" : returnTo;
  const backText = returnTo.startsWith("/essays")
    ? t("Back to essays", "К эссе", "Эсселерге қайту")
    : returnTo.startsWith("/profiles")
      ? t("Back to profiles", "К профилям", "Профильдерге қайту")
      : t("Back to workspace", "В кабинет", "Кабинетке қайту");

  let message =
    notice && Object.hasOwn(billingNotices, notice)
      ? tr(language, billingNotices[notice])
      : undefined;
  if (notice === "checkout-complete") {
    message = isPro
      ? t("Pro is active.", "Тариф Pro активен.", "Pro тарифі белсенді.")
      : tr(language, billingNotices["checkout-pending"]);
  } else if (notice === "preview" && mode === "preview") {
    message = isPro
      ? t(
          "Pro preview is active.",
          "Предпросмотр Pro активен.",
          "Pro алдын ала қарау режимі белсенді.",
        )
      : t(
          "Free preview is active.",
          "Предпросмотр Free активен.",
          "Free алдын ала қарау режимі белсенді.",
        );
  }

  let proAction: ReactNode;
  if (isPro) {
    proAction = (
      <Link prefetch={false} href={backHref} className={styles.planButton}>
        {backText}
        <ArrowRight size={17} aria-hidden="true" />
      </Link>
    );
  } else if (canManage) {
    proAction = (
      <BillingButton action="portal" returnTo={returnTo}>
        {manage}
      </BillingButton>
    );
  } else if (mode === "stripe") {
    proAction = (
      <BillingButton action="checkout" returnTo={returnTo} interval={interval}>
        {t("Subscribe to Pro", "Подключить Pro", "Pro тарифіне жазылу")}
      </BillingButton>
    );
  } else if (mode === "preview") {
    proAction = (
      <BillingButton action="preview" returnTo={returnTo} previewPlan="pro">
        {t(
          "Try Pro preview",
          "Открыть предпросмотр Pro",
          "Pro тарифін алдын ала көру",
        )}
      </BillingButton>
    );
  }

  return (
    <section className={styles.page} lang={language}>
      <div className={styles.top}>
        <nav
          className={styles.nav}
          aria-label={t(
            "Plan navigation",
            "Навигация по тарифам",
            "Тариф мәзірі",
          )}
        >
          <Link className={styles.brand} href="/">
            <Image src="/icon.svg" width={31} height={31} alt="" />
            AidMap <b>Pro</b>
          </Link>
          <Link className={styles.back} href={backHref}>
            <ArrowLeft size={15} />
            {backText}
          </Link>
        </nav>
      </div>
      <div className={styles.wrap}>
        {message && (
          <p className={styles.notice} role="status">
            <Info size={16} aria-hidden="true" />
            {message}
          </p>
        )}
        <header className={styles.hero}>
          <div className={styles.artwork} aria-hidden="true">
            <span className={styles.orbit} />
            <Image
              alt=""
              src="/brand/wayfinder.webp"
              width={420}
              height={280}
              unoptimized
              loading="eager"
            />
          </div>
          <div className={styles.heroCopy}>
            <h1>
              {t(
                "Study real applications with AidMap Pro",
                "Разберите реальные заявки вместе с AidMap Pro",
                "AidMap Pro арқылы нақты өтінімдерді зерттеңіз",
              )}
            </h1>
            <p>
              {t(
                "Find an essay or student story that speaks to your experience, then prepare your own application for each university.",
                "Найдите эссе или историю студента с похожим опытом и подготовьте свою заявку под каждый вуз.",
                "Өзіңізге жақын эссе не студент тарихын тауып, әр университетке жеке өтінім дайындаңыз.",
              )}
            </p>
            <div className={styles.heroActions}>
              <a className={styles.heroLink} href="#compare-plans">
                {t("Compare plans", "Сравнить тарифы", "Тарифтерді салыстыру")}{" "}
                <ArrowDown size={15} />
              </a>
              <Link className={styles.sampleLink} href="/essays">
                {t("Browse essays", "Посмотреть эссе", "Эсселерді қарау")}{" "}
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </header>
        <div id="compare-plans" className={styles.compareHeading}>
          <h2>
            {t("Plans and prices", "Тарифы и цены", "Тарифтер мен бағалар")}
          </h2>
          <div
            className={styles.interval}
            role="group"
            aria-label={t("Billing period", "Период оплаты", "Төлем кезеңі")}
          >
            <button
              type="button"
              aria-pressed={!yearly}
              disabled={!ready}
              onClick={() => setInterval("monthly")}
            >
              {t("Monthly", "Месяц", "Ай сайын")}
            </button>
            <button
              type="button"
              aria-pressed={yearly}
              disabled={!ready}
              onClick={() => setInterval("yearly")}
            >
              {t("Yearly", "Год", "Жыл сайын")}
            </button>
          </div>
        </div>

        <div className={styles.plans}>
          <article className={styles.plan} aria-labelledby="aidmap-free-plan">
            <div className={styles.planHeading}>
              <h2 id="aidmap-free-plan">Free</h2>
              {!isPro && <span className={styles.current}>{current}</span>}
            </div>
            <p className={styles.description}>
              {t(
                "Read a few guides and start a university shortlist.",
                "Читайте первые разборы и составляйте свой список вузов.",
                "Алғашқы талдауларды оқып, университеттер тізімін құрыңыз.",
              )}
            </p>
            <div className={styles.priceBlock}>
              <div className={styles.price}>
                <b>{currency.format(0)}</b>
                <span>USD</span>
              </div>
            </div>
            <div className={styles.action}>
              {isPro && mode === "preview" ? (
                <BillingButton
                  action="preview"
                  returnTo={returnTo}
                  previewPlan="free"
                >
                  {t(
                    "Switch to Free preview",
                    "Перейти на Free в предпросмотре",
                    "Free алдын ала қарау режиміне ауысу",
                  )}
                </BillingButton>
              ) : (
                <Link
                  prefetch={false}
                  href={
                    returnTo.startsWith("/profiles") ? "/profiles" : "/essays"
                  }
                  className={styles.planButton}
                >
                  {t(
                    "Browse free examples",
                    "Посмотреть бесплатные примеры",
                    "Тегін үлгілерді қарау",
                  )}
                  <ArrowRight size={17} aria-hidden="true" />
                </Link>
              )}
            </div>
            <PlanFeatures
              items={freeFeatures.map((item) => tr(language, item))}
            />
          </article>

          <article
            className={`${styles.plan} ${styles.pro}`}
            aria-labelledby="aidmap-pro-plan"
          >
            <div className={styles.planHeading}>
              <h2 id="aidmap-pro-plan">Pro</h2>
              {isPro && <span className={styles.current}>{current}</span>}
            </div>
            <p className={styles.description}>
              {t(
                "The full guide library and a workspace for every university in your list.",
                "Вся библиотека разборов и отдельный кабинет для каждого вуза в вашем списке.",
                "Барлық талдаулар және тізімдегі әр университетке жеке кабинет.",
              )}
            </p>
            <div
              className={styles.priceBlock}
              aria-live="polite"
              aria-atomic="true"
            >
              <div className={styles.price}>
                <b>{amount}</b>
                <span>
                  {yearly
                    ? t("USD / year", "USD / год", "USD / жыл")
                    : t("USD / month", "USD / месяц", "USD / ай")}
                </span>
              </div>
              {yearly && (
                <p className={styles.equivalent}>
                  {t(
                    `Equivalent to ${currency.format(price.perMonthUsd)} per month`,
                    `В пересчёте на месяц — ${currency.format(price.perMonthUsd)}`,
                    `Айына ${currency.format(price.perMonthUsd)} баламасы`,
                  )}
                </p>
              )}
            </div>
            <div className={styles.action}>
              {proAction ?? (
                <p className={styles.unavailable}>
                  <Info size={16} aria-hidden="true" />
                  {t(
                    "Checkout is currently unavailable",
                    "Оплата пока недоступна",
                    "Төлем әзірге қолжетімсіз",
                  )}
                </p>
              )}
              {mode === "preview" && (
                <p className={styles.actionNote}>
                  {t(
                    "Local preview · no payment",
                    "Локальный предпросмотр · без оплаты",
                    "Жергілікті алдын ала қарау · төлемсіз",
                  )}
                </p>
              )}
              {mode === "stripe" && !isPro && !canManage && (
                <p className={styles.actionNote}>
                  {t(
                    "Pro access is linked to this browser.",
                    "Доступ к Pro привязан к этому браузеру.",
                    "Pro мүмкіндігі осы браузерге байланыстырылған.",
                  )}
                </p>
              )}
              {isPro && canManage && (
                <BillingButton action="portal" returnTo={returnTo} subtle>
                  {manage}
                </BillingButton>
              )}
            </div>
            <PlanFeatures
              items={proFeatures.map((item) => tr(language, item))}
            />
          </article>
        </div>
        <section className={styles.inside} aria-labelledby="inside-pro">
          <h2 id="inside-pro">
            {t(
              "Inside AidMap Pro",
              "Что входит в AidMap Pro",
              "AidMap Pro мүмкіндіктері",
            )}
          </h2>
          <div className={styles.collections}>
            {collections.map(({ icon: Icon, href, title, detail }) => (
              <Link key={href} href={href} className={styles.collection}>
                <Icon size={21} strokeWidth={1.7} aria-hidden="true" />
                <h3>{tr(language, title)}</h3>
                <p>{tr(language, detail)}</p>
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
