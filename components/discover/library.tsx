"use client";

import Link from "next/link";
import { ArrowRight, Bookmark, BookOpen, Check, ChevronRight, GraduationCap, ListFilter, LockKeyhole, Search, X } from "lucide-react";
import { useApp } from "@/components/providers";
import type { LibraryPreview } from "@/lib/discovery/catalogue";
import type { DiscoveryKind } from "@/lib/discovery/types";
import { useURLFilters } from "@/lib/url-filters";
import styles from "./library.module.css";

type FilterKey = "university" | "situation" | "theme" | "subject";
const normalize = (value: string) => value.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase().trim();
const colors = ["mint", "ochre", "blue", "rose", "plum", "teal"] as const;
export function Library({ kind, entries, pro }: { kind: DiscoveryKind; entries: LibraryPreview[]; pro: boolean }) {
  const essays = kind === "essay";
  const base = essays ? "/essays" : "/profiles";
  const { params, set, reset } = useURLFilters();
  const { state, ready, blocked, update } = useApp();
  const query = params.get("q") ?? "";
  const tokens = normalize(query).split(/\s+/).filter(Boolean);
  const saved = state.libraryBookmarks ?? [];
  const access = params.get("access") ?? "";
  const showSaved = params.get("saved") === "1";
  const filterFields: { key: FilterKey; label: string }[] = [
    { key: "university", label: "University" },
    { key: "situation", label: "Situation" },
    { key: essays ? "theme" : "subject", label: essays ? "Theme" : "Subject" },
  ];
  const filtered = entries.filter((entry) => {
    const searchText = normalize([entry.title, entry.university, entry.theme, entry.situation, entry.summary, entry.subject].join(" "));
    return tokens.every((token) => searchText.includes(token))
      && filterFields.every(({ key }) => !params.get(key) || params.get(key) === entry[key])
      && (!access || (access === "free" ? entry.free : !entry.free))
      && (!showSaved || saved.includes(base + "/" + entry.id));
  });

  function toggleBookmark(path: string) {
    update((current) => {
      const previous = current.libraryBookmarks ?? [];
      return { ...current, libraryBookmarks: previous.includes(path)
        ? previous.filter((item) => item !== path) : [...previous, path] };
    });
  }

  return <div className={styles.page}>
    <div className={styles.container}>
      <header className={styles.heading}>
        <div>
          <div className={styles.switcher}>
            <Link href="/profiles" aria-current={!essays ? "page" : undefined}>Profiles</Link>
            <Link href="/essays" aria-current={essays ? "page" : undefined}>Essays</Link>
          </div>
          <h1>{essays ? "Essay library" : "Student profiles"}</h1>
          <p>{essays ? "Read real application essays and explore the decisions behind the writing." : "See how students found their way to university through the experiences they shared."}</p>
        </div>
        <Link className={styles.workspaceLink} href={essays ? "/studio?view=essays" : "/studio?view=profile"}>{essays ? "My drafts" : "My profile"} <ChevronRight size={14}/></Link>
      </header>
      <label className={styles.search}><Search size={18} aria-hidden/><input type="search" aria-label={essays ? "Search essays" : "Search profiles"}
        placeholder={essays ? "Search essays by interest, activity or university" : "Search students, subjects or universities"}
        value={query} onChange={(event) => set("q", event.target.value)} /></label>
      <div className={styles.layout}>
        <aside className={styles.filters} aria-label="Library filters">
          <div className={styles.filterTitle}><ListFilter size={17}/><h2>Filters</h2>{params.size > 0 && <button onClick={reset}>Clear</button>}</div>
          <div className={styles.filterFields}>{filterFields.map(({ key, label }) => {
            const values = [...new Set(entries.map((entry) => entry[key]).filter((value): value is string => !!value))].sort();
            if (!values.length) return null;
            return <label key={key}>{label}<select value={params.get(key) ?? ""} onChange={(event) => set(key, event.target.value)}>
              <option value="">All {label === "University" ? "universities" : label.toLowerCase() + "s"}</option>
              {values.map((value) => <option key={value}>{value}</option>)}
            </select></label>;
          })}
          <label>Guide access<select value={access} onChange={(event) => set("access", event.target.value)}>
            <option value="">All guides</option><option value="free">Free</option><option value="pro">Pro</option>
          </select></label></div>
          <button type="button" className={styles.savedFilter} aria-pressed={showSaved} onClick={() => set("saved", showSaved ? "" : "1")}>
            <Bookmark size={14}/> Saved by me {showSaved && <Check size={13}/>}
          </button>
        </aside>
        <section className={styles.results} aria-label={essays ? "Essays" : "Student profiles"}>
          <div className={styles.resultsHead}><p aria-live="polite">{filtered.length} {essays ? (filtered.length === 1 ? "essay" : "essays") : (filtered.length === 1 ? "profile" : "profiles")}</p>
          {!pro && <button type="button" aria-pressed={access === "free"} onClick={() => set("access", access === "free" ? "" : "free")}>{access === "free" ? <X size={12}/> : <BookOpen size={13}/>} Free to read</button>}</div>
          {!filtered.length ? <div className={styles.empty}><Search size={24}/><h2>{showSaved ? "No saved matches" : "No matches"}</h2><p>Try a different search or clear your filters.</p><button onClick={reset}>Clear filters</button></div> :
          <div className={essays ? styles.essayGrid : styles.profileGrid}>
            {filtered.map((entry) => {
              const path = base + "/" + entry.id;
              const isSaved = saved.includes(path);
              const index = entries.indexOf(entry);
              return <article key={entry.id} className={essays ? styles.essay : styles.profile} data-tone={colors[index % colors.length]}>
                <button className={styles.bookmark} disabled={!ready || blocked} aria-pressed={isSaved}
                  aria-label={`${isSaved ? "Remove bookmark for" : "Bookmark"} ${entry.title}`} onClick={() => toggleBookmark(path)}>
                  <Bookmark size={15} fill={isSaved ? "currentColor" : "none"}/></button>
                {essays ? <Link href={path} className={styles.cover} aria-label={"Open " + entry.title} prefetch={false}>
                  <span className={styles.paper} aria-hidden><span>{entry.university}</span><i/><i/><i/><i/><i/></span>
                </Link> : <div className={styles.profileIdentity}><span aria-hidden className={styles.initials}>{entry.title.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => Array.from(word)[0]).join("")}</span>
                  <div><h2><Link href={path} prefetch={false}>{entry.title}</Link></h2><p>{entry.subject ?? entry.theme}</p></div></div>}
                <div className={styles.cardBody}>{essays && <h2><Link href={path} prefetch={false}>{entry.title}</Link></h2>}
                  <p className={styles.summary}>{entry.summary}</p>
                  <div className={styles.school}><GraduationCap size={14}/>{entry.university}</div>
                  <div className={styles.cardFoot}><span>{entry.situation}</span>
                    <Link className={styles.accessLink} href={path} prefetch={false}>{!entry.free && !pro ? <><LockKeyhole size={12}/> Pro guide</> : <>Read guide <ArrowRight size={13}/></>}</Link>
                  </div>
                </div>
              </article>;
            })}
          </div>}
        </section>
      </div>
    </div>
  </div>;
}
