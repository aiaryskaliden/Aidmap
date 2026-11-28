"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, Plus } from "lucide-react";
import { useApp } from "@/components/providers";
import { UniversityMark } from "@/components/universities/university-mark";
import type { ProfileSchool } from "@/lib/studio/profile-schools";
import { shortlistFit } from "@/lib/studio/shortlist-fit";
import { tr, type Copy } from "@/lib/studio/reviews";
import type { Language } from "@/lib/advisor/contracts";
import { shortlistGroups, type ShortlistGroup } from "@/types/domain";
import css from "./profile-board.module.css";

const names: Record<ShortlistGroup, Copy> = {
  reach: ["Reach", "Амбициозные", "Бәсекесі жоғары"],
  target: ["Target", "Целевые", "Мақсатты"],
  safety: ["Safety", "Запасные", "Қосалқы"],
  unsure: ["Unsure", "Уточнить", "Нақтылау"],
};

export function ProfileShortlist({ language }: { language: Language }) {
  const { state } = useApp();
  const [catalogue, setCatalogue] = useState<ProfileSchool[] | null>(null);
  const [error, setError] = useState(false);
  const count = state.saved.length;
  const hasSaved = count > 0;
  const t = (en: string, ru: string, kk: string) => tr(language, [en, ru, kk]);

  useEffect(() => {
    if (!hasSaved || catalogue) return;
    const controller = new AbortController();
    fetch("/api/profile-schools", { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error();
        return response.json() as Promise<ProfileSchool[]>;
      })
      .then((schools) => { setCatalogue(schools); setError(false); })
      .catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [hasSaved, catalogue]);

  const byId = new Map(catalogue?.map((school) => [school.id, school]));
  const groups = Map.groupBy(state.saved.flatMap((saved) => {
    const school = byId.get(saved.universityId);
    if (!school) return [];
    return [{ school, group: saved.shortlistGroup ?? shortlistFit(school.fit, state.profile).suggestedBand }];
  }), ({ group }) => group);

  return <div className={css.shortlist}>
    <div className={css.sectionTitle}>
      <h2>{t("College list", "Список вузов", "Университеттер тізімі")} <span>{count}</span></h2>
      <Link className={css.textAction} href={count ? "/my-list" : "/explore"} prefetch={false}>
        {count ? <>{t("My List", "Мой список", "Менің тізімім")} <ArrowUpRight size={14}/></> : <><Plus size={14}/> {t("Add colleges","Добавить вузы","Университет қосу")}</>}
      </Link>
    </div>
    {hasSaved && !catalogue ? (
      <p className={css.dim} role="status">{error
        ? t("College details are unavailable. Open My List to see your saved colleges.", "Подробности временно недоступны. Сохранённые вузы есть в «Моём списке».", "Мәліметтер әзірге қолжетімсіз. Университеттерді тізіміңізден ашыңыз.")
        : t("Loading your colleges…","Загружаем список…","Тізім жүктелуде…")}</p>
    ) : <div className={css.groups}>
      {shortlistGroups.filter((group) => group !== "unsure" || groups.has(group)).map((group) => {
        const entries = groups.get(group) ?? [];
        return <div className={css.group} key={group} data-group={group}>
          <span className={css.groupTitle}><i/> {tr(language, names[group])} <b>{entries.length}</b></span>
          {entries.length > 0 && <div className={css.marks}>{entries.slice(0, 3).map(({ school }) => (
            <Link href={"/universities/" + school.id} key={school.id} aria-label={school.name} title={school.name} prefetch={false}><UniversityMark university={school}/></Link>
          ))}{entries.length > 3 && <Link href="/my-list" className={css.extra}>+{entries.length - 3}</Link>}</div>}
        </div>;
      })}
    </div>}
  </div>;
}
