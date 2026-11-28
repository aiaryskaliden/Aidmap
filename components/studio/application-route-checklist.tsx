"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  ChevronRight,
  ListFilter,
  School,
} from "lucide-react";
import { useApp } from "@/components/providers";
import {
  commonAppCatalogueHref,
  routePreparationProgress,
  routeStepDone,
  setRouteStep,
  type ApplicationRoute,
} from "@/lib/studio/application-routes";
import { tr, type Copy } from "@/lib/studio/reviews";
import { blankProfile } from "@/types/domain";
import css from "./application-route-checklist.module.css";

export function ApplicationRouteChecklist({
  route,
}: {
  route: ApplicationRoute;
}) {
  const { state, ready, blocked, update } = useApp();
  const language = state.studio?.language ?? "en";
  const t = (...copy: Copy) => tr(language, copy);
  const progress = routePreparationProgress(route, state);
  const intake = state.profile?.entryYear ?? blankProfile.entryYear;
  return (
    <div className={css.page} data-route-art={route.art} lang={language}>
      <Link className={css.back} href="/">
        <ArrowLeft size={16} aria-hidden />
        {t("My applications", "Мои заявки", "Менің өтінімдерім")}
      </Link>
      <header className={css.banner}>
        <div>
          <p>
            {t("First-year entry", "Первый курс", "Бірінші курс")} · {intake}
          </p>
          <h1>{route.name}</h1>
          <a
            href={route.portal}
            className={css.portal}
            target="_blank"
            rel="noreferrer"
          >
            {t(
              "Open official portal",
              "Открыть портал подачи",
              "Өтінім порталын ашу",
            )}
            <ArrowUpRight size={15} aria-hidden />
          </a>
        </div>
        <Image
          className={css.art}
          src={`/applications/art/${route.art}.webp`}
          alt=""
          aria-hidden
          width={240}
          height={240}
        />
      </header>
      <div className={css.columns}>
        <section
          className={css.checklist}
          aria-labelledby="route-checklist-heading"
        >
          <header>
            <div className={css.progressTitle}>
              <h2 id="route-checklist-heading">
                {t(
                  "Preparation checklist",
                  "Подготовка заявки",
                  "Өтінімге дайындық",
                )}
              </h2>
              <strong aria-live="polite">
                {ready ? `${progress.percent}%` : "…"}
              </strong>
            </div>
            <progress
              max={progress.total}
              value={ready ? progress.done : undefined}
              aria-labelledby="route-checklist-heading"
            />
            <p>
              {ready ? `${progress.done}/${progress.total} · ` : ""}
              {t(
                "Tick each step as you prepare it.",
                "Отмечайте готовые шаги.",
                "Дайын қадамдарды белгілеңіз.",
              )}
            </p>
          </header>
          <ul>
            {route.steps.map((step) => {
              const done = routeStepDone(route, state, step.id);
              return (
                <li key={step.id}>
                  <label className={css.step} data-done={done}>
                    <input
                      type="checkbox"
                      checked={done}
                      disabled={!ready || blocked}
                      onChange={(event) => {
                        const checked = event.target.checked;
                        update((current) =>
                          setRouteStep(current, route, step.id, checked),
                        );
                      }}
                    />
                    <span>{tr(language, step.label)}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </section>
        <aside
          className={css.resources}
          aria-labelledby="route-resource-heading"
        >
          <h2 id="route-resource-heading">
            {t("Resources", "Материалы", "Материалдар")}
          </h2>
          <a href={route.guide} target="_blank" rel="noreferrer">
            <BookOpen size={17} aria-hidden />
            {t(
              "Official application guide",
              "Инструкция по подаче",
              "Өтінім беру нұсқаулығы",
            )}
            <ArrowUpRight size={14} aria-hidden />
          </a>
          {route.id === "common-app" && (
            <Link href={commonAppCatalogueHref}>
              <ListFilter size={17} aria-hidden />
              {t(
                "Common App colleges",
                "Вузы Common App",
                "Common App университеттері",
              )}
              <ChevronRight size={14} aria-hidden />
            </Link>
          )}
          {route.id === "mit" && (
            <Link href="/universities/mit">
              <School size={17} aria-hidden />
              {t("MIT university profile", "Профиль MIT", "MIT профилі")}
              <ChevronRight size={14} aria-hidden />
            </Link>
          )}
          <p>
            {t(
              "Your checklist is saved on this device. Submit your application through the official portal.",
              "Чек-лист сохраняется на этом устройстве. Заявку отправляйте через официальный портал.",
              "Белгілер осы құрылғыда сақталады. Өтінімді ресми портал арқылы жіберіңіз.",
            )}
          </p>
        </aside>
      </div>
    </div>
  );
}
