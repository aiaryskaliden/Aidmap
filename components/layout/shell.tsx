"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useRef, useState } from "react";
import {
  BadgeDollarSign,
  ArrowUpRight,
  Award,
  BookOpen,
  Building2,
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  ClipboardCheck,
  CornerDownRight,
  Columns2,
  FilePenLine,
  Files,
  Gem,
  House,
  LayoutDashboard,
  ListChecks,
  Medal,
  Menu,
  MessageCircle,
  Moon,
  Landmark,
  Palmtree,
  School,
  Settings2,
  Sun,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { useApp } from "@/components/providers";
import { applicationRoutes } from "@/lib/studio/application-routes";
import { studioHref } from "@/components/studio/types";
import { tr, type Copy } from "@/lib/studio/reviews";
import styles from "./shell.module.css";

const groups = [
  {
    label: ["Workspace", "Кабинет", "Кабинет"],
    links: [
      { href: "/", icon: House, label: ["Overview", "Обзор", "Шолу"] },
      {
        href: "/advisor",
        icon: MessageCircle,
        label: ["Ask Maple", "Чат с Мэйпл", "Мейплмен чат"],
      },
      {
        href: "/planner",
        icon: CalendarDays,
        label: ["Planner", "Планер", "Жоспар"],
      },
    ],
  },
  {
    label: ["My application", "Моя заявка", "Өтінімім"],
    links: [
      {
        href: studioHref("profile"),
        icon: UserRound,
        label: ["My profile", "Мой профиль", "Профилім"],
      },
      {
        href: "/my-list",
        icon: ListChecks,
        label: ["My List", "Мой список", "Менің тізімім"],
      },
      {
        href: studioHref("fit"),
        icon: ChartNoAxesColumnIncreasing,
        label: ["University fit", "Готовность к вузу", "Оқуға дайындық"],
      },
      {
        href: studioHref("essays"),
        icon: FilePenLine,
        label: ["Essays", "Мои эссе", "Эсселерім"],
      },
      {
        href: studioHref("activities"),
        icon: Medal,
        label: ["Activities", "Активности", "Іс-шаралар"],
      },
      {
        href: studioHref("honors"),
        icon: Award,
        label: [
          "Honors & achievements",
          "Награды и достижения",
          "Марапаттар мен жетістіктер",
        ],
      },
      {
        href: studioHref("final"),
        icon: ClipboardCheck,
        label: ["Final review", "Финальная проверка", "Соңғы тексеріс"],
      },
    ],
  },
  {
    label: ["Discover", "Каталог", "Каталог"],
    links: [
      {
        href: "/explore",
        icon: Building2,
        label: ["Universities", "Университеты", "Университеттер"],
      },
      {
        href: "/funding",
        icon: BadgeDollarSign,
        label: ["Scholarships", "Стипендии", "Шәкіртақылар"],
      },
      {
        href: "/profiles",
        icon: UsersRound,
        label: ["Example profiles", "Примеры профилей", "Үлгі профильдер"],
      },
      {
        href: "/essays",
        icon: BookOpen,
        label: ["Essay library", "Библиотека эссе", "Эссе кітапханасы"],
      },
    ],
  },
] satisfies {
  label: Copy;
  links: { href: string; icon: typeof House; label: Copy }[];
}[];

type SchoolLink = { id: string; name: string };
const applicationIcons = {
  ucas: School,
  uc: Palmtree,
  "common-app": Files,
  mit: Landmark,
};

function SelectedNavigation({
  close,
  schools,
}: {
  close: () => void;
  schools: SchoolLink[];
}) {
  const pathname = usePathname();
  const params = useSearchParams();
  const studioView = params.get("view") || params.get("tab") || "overview";
  let active = pathname;
  if (pathname === "/studio")
    active = studioView === "overview" ? "/" : `/studio?view=${studioView}`;
  if (
    pathname === "/match" ||
    (pathname.startsWith("/universities/") &&
      !schools.some(({ id }) => pathname === `/universities/${id}/apply`))
  )
    active = "/explore";
  if (pathname === "/calculator") active = "/funding";
  if (pathname === "/improve") active = studioHref("fit");
  return <Navigation active={active} close={close} schools={schools} />;
}

function Navigation({
  active,
  close,
  schools,
}: {
  active?: string;
  close: () => void;
  schools: SchoolLink[];
}) {
  const { state } = useApp();
  const language = state.studio?.language ?? "en";
  const sections = groups.map(({ label, links }) => (
    <div className={styles.group} key={label[0]}>
      <p className={styles.groupLabel}>{tr(language, label)}</p>
      {links.map(({ href, label: title, icon: Icon }) => (
        <Link
          className={styles.navLink}
          key={href}
          href={href}
          prefetch={false}
          onClick={close}
          aria-current={active === href ? "page" : undefined}
        >
          <Icon size={17} strokeWidth={1.75} aria-hidden />
          {tr(language, title)}
        </Link>
      ))}
    </div>
  ));

  return (
    <>
      {sections}
      <div className={styles.group}>
        <p className={styles.groupLabel}>
          {tr(language, ["Apply", "Подача заявок", "Өтінім беру"])}
        </p>
        {applicationRoutes.map(({ href, name, art }) => {
          const Icon = applicationIcons[art];
          return (
            <Link
              key={href}
              className={styles.navLink}
              href={href}
              prefetch={false}
              onClick={close}
              aria-current={active === href ? "page" : undefined}
            >
              <Icon size={16} strokeWidth={1.75} aria-hidden />
              {name}
            </Link>
          );
        })}
        {schools.map(({ id, name }) => {
          const href = `/universities/${id}/apply`;
          return (
            <Link
              className={styles.navLink}
              key={id}
              href={href}
              prefetch={false}
              onClick={close}
              aria-current={active === href ? "page" : undefined}
              aria-label={tr(language, [
                `${name} application plan`,
                `${name} · план подачи`,
                `${name} · өтінім жоспары`,
              ])}
            >
              <CornerDownRight size={15} aria-hidden />
              <span className={styles.schoolName}>{name}</span>
            </Link>
          );
        })}
      </div>
      <div className={styles.secondary}>
        <Link
          className={styles.navLink}
          href="/dashboard"
          prefetch={false}
          onClick={close}
          aria-current={active === "/dashboard" ? "page" : undefined}
        >
          <LayoutDashboard size={17} strokeWidth={1.75} aria-hidden />
          {tr(language, [
            "Saved & dashboard",
            "Избранное и прогресс",
            "Сақталғандар мен прогресс",
          ])}
        </Link>
        <Link
          className={styles.navLink}
          href="/compare"
          prefetch={false}
          onClick={close}
          aria-current={active === "/compare" ? "page" : undefined}
        >
          <Columns2 size={17} strokeWidth={1.75} aria-hidden />
          {tr(language, ["Compare", "Сравнение", "Салыстыру"])}
          {state.compare.length > 0 && (
            <span className={styles.count}>{state.compare.length}</span>
          )}
        </Link>
      </div>
    </>
  );
}

export function Header({
  schoolNames,
}: {
  schoolNames: Record<string, string>;
}) {
  const { state, update, ready, blocked } = useApp();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const close = () => setOpen(false);
  const language = state.studio?.language ?? "en";
  const schoolLinks = state.saved
    .filter(({ universityId }) => Object.hasOwn(schoolNames, universityId))
    .slice(0, 3)
    .map(({ universityId }) => ({
      id: universityId,
      name: schoolNames[universityId],
    }));

  return (
    <header
      className={styles.sidebar}
      data-open={open}
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          close();
          menuButton.current?.focus();
        }
      }}
    >
      <div className={styles.sidebarTop}>
        <Link
          prefetch={false}
          className={styles.brand}
          href="/"
          aria-label="AidMap home"
          onClick={close}
        >
          <Image src="/icon.svg" width={36} height={36} alt="" unoptimized />
          <span>AidMap</span>
        </Link>
        <button
          className={styles.menuButton}
          ref={menuButton}
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="aidmap-navigation"
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={21} /> : <Menu size={21} />}
        </button>
      </div>
      <div className={styles.navBody} id="aidmap-navigation">
        <nav className={styles.menu} aria-label="Main navigation">
          <Suspense
            fallback={<Navigation close={close} schools={schoolLinks} />}
          >
            <SelectedNavigation close={close} schools={schoolLinks} />
          </Suspense>
        </nav>
        <Link
          className={`${styles.navLink} ${styles.plans}`}
          href="/pricing"
          prefetch={false}
          onClick={close}
          aria-current={pathname === "/pricing" ? "page" : undefined}
        >
          <Gem size={17} strokeWidth={1.8} aria-hidden />
          AidMap Pro
          <ArrowUpRight size={14} className={styles.planArrow} aria-hidden />
        </Link>
        <div className={styles.tools}>
          <Link
            className={styles.navLink}
            prefetch={false}
            href="/profile#data"
            onClick={close}
          >
            <Settings2 size={17} strokeWidth={1.75} aria-hidden />
            {tr(language, ["Preferences", "Настройки", "Баптаулар"])}
          </Link>
          <button
            type="button"
            className={styles.themeButton}
            disabled={!ready || blocked}
            aria-label={`Switch to ${state.theme === "light" ? "dark" : "light"} theme`}
            onClick={() =>
              update((current) => ({
                ...current,
                theme: current.theme === "light" ? "dark" : "light",
              }))
            }
          >
            {state.theme === "light" ? <Moon size={17} /> : <Sun size={17} />}
          </button>
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className={styles.footer}>
      <Link prefetch={false} href="/about">
        Methodology
      </Link>
      <Link prefetch={false} href="/profile#data">
        Privacy &amp; data
      </Link>
    </footer>
  );
}
