"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  ClipboardList,
  FilePenLine,
  ListChecks,
  LockKeyhole,
} from "lucide-react";
import { useApp } from "@/components/providers";
import { UniversityMark } from "@/components/universities/university-mark";
import { pricingPath } from "@/lib/billing/plans";
import { tr } from "@/lib/studio/reviews";
import type { University } from "@/types/domain";
import styles from "./university-application.module.css";

type SchoolIdentity = Pick<
  University,
  "id" | "name" | "city" | "country" | "initials" | "color"
>;

export function ApplicationHeading({
  school,
  plan,
}: {
  school: SchoolIdentity;
  plan: "free" | "pro";
}) {
  const { state } = useApp();
  const t = (en: string, ru: string, kk: string) =>
    tr(state.studio?.language ?? "en", [en, ru, kk]);
  return (
    <header className={styles.heading}>
      <Link href={`/universities/${school.id}`} className={styles.back}>
        <ArrowLeft size={15} />{" "}
        {t("University profile", "Профиль вуза", "Университет профилі")}
      </Link>
      <div className={styles.schoolHeading}>
        <UniversityMark university={school} large />
        <div>
          <p>{[school.city, school.country].filter(Boolean).join(", ")}</p>
          <h1>{school.name}</h1>
        </div>
        <span
          className={styles.planBadge}
          aria-label={
            plan === "pro"
              ? t("Pro access", "Доступ Pro", "Pro қолжетімділігі")
              : "AidMap Pro"
          }
        >
          AidMap Pro
        </span>
      </div>
    </header>
  );
}

export function ApplicationLock({ school }: { school: SchoolIdentity }) {
  const { state } = useApp();
  const language = state.studio?.language ?? "en";
  const t = (en: string, ru: string, kk: string) => tr(language, [en, ru, kk]);
  const benefits = [
    {
      Icon: ListChecks,
      title: t("Review your fit", "Сверьте профиль", "Профильді тексеріңіз"),
      detail: t(
        "Compare your profile with published requirements and find what to check next.",
        "Сравните профиль с опубликованными требованиями и найдите, что нужно уточнить.",
        "Профиліңізді жарияланған талаптармен салыстырып, келесі қадамды анықтаңыз.",
      ),
    },
    {
      Icon: ClipboardList,
      title: t(
        "Track documents",
        "Отслеживайте документы",
        "Құжаттарды қадағалаңыз",
      ),
      detail: t(
        "Mark documents as prepared in a checklist shared with your planner.",
        "Отмечайте готовые документы в списке, связанном с планировщиком.",
        "Жоспарлағышпен ортақ тізімде дайын құжаттарды белгілеңіз.",
      ),
    },
    {
      Icon: CalendarDays,
      title: t(
        "Plan funding and dates",
        "Планируйте бюджет и сроки",
        "Қаржы мен мерзімді жоспарлаңыз",
      ),
      detail: t(
        "Check which dates match your intake and review aid forms and award conditions.",
        "Найдите сроки своего набора, формы для получения помощи и условия стипендий.",
        "Өз қабылдау кезеңіңіздің мерзімін, көмек формаларын және шәкіртақы шарттарын тексеріңіз.",
      ),
    },
    {
      Icon: FilePenLine,
      title: t("Prepare essays", "Готовьте эссе", "Эссе дайындаңыз"),
      detail: t(
        "Save drafts for this university and review them against the prompt you enter.",
        "Храните черновики для этого вуза и проверяйте их по заданию, которое ввели.",
        "Осы университетке арналған жобаларды сақтап, енгізген тапсырмаңыз бойынша тексеріңіз.",
      ),
    },
  ];

  return (
    <div className={styles.workspace} lang={language}>
      <ApplicationHeading school={school} plan="free" />
      <section className={styles.lock}>
        <div className={styles.lockIntro}>
          <span className={styles.featureIcon}>
            <LockKeyhole size={20} />
          </span>
          <h2>
            {t(
              "Application workspace",
              "Кабинет для подачи",
              "Өтінім кабинеті",
            )}
          </h2>
          <p>
            {t(
              "Organize your application to this university with AidMap Pro.",
              "Соберите заявку в этот вуз в одном месте с AidMap Pro.",
              "Осы университетке өтінімді AidMap Pro көмегімен бір жерде жинаңыз.",
            )}
          </p>
          <Link
            className={styles.primary}
            href={pricingPath(`/universities/${school.id}/apply`)}
          >
            {t("Compare plans", "Сравнить тарифы", "Тарифтерді салыстыру")}{" "}
            <ArrowRight size={17} />
          </Link>
        </div>
        <ul className={styles.benefits}>
          {benefits.map(({ Icon, title, detail }) => (
            <li key={title}>
              <Icon size={19} aria-hidden="true" />
              <div>
                <h3>{title}</h3>
                <p>{detail}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
