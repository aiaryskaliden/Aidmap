import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ArrowRight, ArrowUpRight, GraduationCap, LockKeyhole } from "lucide-react";
import { getMembership } from "@/lib/billing/membership";
import { pricingPath } from "@/lib/billing/plans";
import { findReading } from "@/lib/discovery/catalogue";
import type { DiscoveryKind } from "@/lib/discovery/types";
import styles from "./library.module.css";

export type ReadingPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ billing?: string | string[] }>;
};

export async function ReadingGuide({kind, slug, billing}: {kind: DiscoveryKind; slug: string; billing?: string | string[]}) {
  const entry = findReading(kind, slug);
  if (!entry) notFound();
  const essays = kind === "essay";
  const base = essays ? "/essays" : "/profiles";
  const path = base + "/" + slug;
  const membership = await getMembership();
  const accessible = entry.free || membership.plan === "pro";
  if (!accessible && membership.mode === "stripe" && billing === "checkout-complete") redirect(pricingPath(path, "checkout-pending"));
  return <article className={styles.reader}><div className={styles.readInner}>
    <Link className={styles.crumb} href={base}><ArrowLeft size={15}/>{essays ? "Essay library" : "Student profiles"}</Link>
    <header>
      <div className={styles.byline}><GraduationCap size={16}/>{entry.university}</div>
      <h1>{entry.title}</h1>
      <p className={styles.deck}>{entry.summary}</p>
      <div className={styles.tags}>{[...new Set([entry.situation, entry.theme, entry.subject].filter(Boolean))].map((item) => <span key={item}>{item}</span>)}</div>
    </header>
    {accessible ? <>
      <section className={styles.source}>
        <a href={entry.sourceUrl} target="_blank" rel="noopener noreferrer">{essays ? "Read the original essay" : "Read the original profile"} <ArrowUpRight size={16}/></a>
        <small>{entry.publisher} · Source checked <time dateTime={entry.checkedAt}>{entry.checkedAt}</time></small>
      </section>
      <section className={styles.notes}>
        <h2>{essays ? "What to notice as you read" : "What to look for in this profile"}</h2>
        <ol>{entry.notes.map((note) => <li key={note}>{note}</li>)}</ol>
        <div className={styles.question}><strong>For your own application</strong><p>{entry.focusQuestion}</p></div>
        <Link href={essays ? "/studio?view=essays" : "/studio?view=profile"} className={styles.primaryAction}>{essays ? "Open my drafts" : "Open my profile"} <ArrowRight size={14}/></Link>
      </section>
    </> : <section className={styles.locked}>
      <LockKeyhole size={20}/><h2>Read this guide with AidMap Pro</h2>
      <p>Explore the published {essays ? "essay" : "profile"} from {entry.publisher} with AidMap’s reading notes and a question for your own application.</p>
      <Link className={styles.primaryAction} href={pricingPath(path)}>See Pro plans <ArrowRight size={15}/></Link>
      <div><Link className={styles.backToFree} href={base + "?access=free"}>Browse the two free guides <ArrowRight size={12}/></Link></div>
    </section>}
  </div></article>;
}
