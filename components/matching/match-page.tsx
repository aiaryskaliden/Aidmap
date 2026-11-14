"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Bookmark, CheckCircle2, CircleHelp, Sparkles } from "lucide-react";
import { universities } from "@/data/universities";
import { useApp } from "@/components/providers";
import { assessUniversityFit } from "@/lib/matching/fit";
import { researchedSATContext, satBandText } from "@/data/cds-sat-2025";
import { toggleSaved } from "@/lib/storage/state";
import { PageHeading, LocalNote } from "@/components/ui/shared";
import { Button } from "@/components/ui/button";

export default function MatchPage() {
  const { state, ready, update, toast } = useApp();
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const profile = state.profile?.isDemo ? null : state.profile;
  const assessments = useMemo(
    () =>
      universities
        .map((university) => ({
          university,
          fit: assessUniversityFit(university, profile),
        }))
        .sort(
          (a, b) =>
            (b.fit.score ?? -1) - (a.fit.score ?? -1) ||
            b.fit.coverage - a.fit.coverage ||
            a.university.name.localeCompare(b.university.name),
        ),
    [profile],
  );

  const filtered = assessments.filter(({ university }) =>
    `${university.name} ${university.country}`
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );
  const visible = showAll ? filtered : filtered.slice(0, 12);
  const savedIds = new Set(state.saved.map((item) => item.universityId));
  const nextSteps = assessments.find((item) => item.fit.coverage >= 45)?.fit.nextSteps ??
    assessments[0]?.fit.nextSteps ?? [];

  return (
    <main className="page-container">
      <PageHeading
        eyebrow="AIDMAP / EXPLAINABLE MATCHING"
        title="Understand your university options."
        description="Compare your study interests and test results with sourced requirements, then save universities to your application planner."
      />
      <div className="panel" style={{ marginBottom: "1.5rem" }}>
        <div className="panel-heading">
          <h2>How the evidence score works</h2>
          <Sparkles size={22} aria-hidden="true" />
        </div>
        <p>
          <strong>These points are NOT your probability of admission.</strong> They summarize only comparable
          published criteria: selected subject (30 points), location (15), SAT minimum (20),
          English minimum (20), and funding policy (15). Unverified or inapplicable
          items earn no points, and we show how much evidence was actually evaluated.
        </p>
        <p className="muted">
          A high fit does not measure selectivity, interviews, grades, recommendations, essays,
          citizenship restrictions, scholarship competitiveness or admissions decisions.
          A score appears only when at least 45 of 100 evidence points can be evaluated. Unknown criteria do not inflate it to 100%.
        </p>
        <Link className="text-link" href="/profile">
          Review my profile <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </div>

      {!ready ? (
        <p>Loading your private university preferences…</p>
      ) : !profile ? (
        <section className="panel">
          <h2>Start with your actual applicant profile</h2>
          <p>
            Add your subject, optional SAT and English results, and preferred destinations.
            Your information stays in this browser. You do not need to provide income or a family budget.
          </p>
          <Button asChild><Link href="/profile">Create my profile <ArrowRight size={16} /></Link></Button>
        </section>
      ) : (
        <>
          <section className="panel" style={{ marginBottom: "1.5rem" }}>
            <h2>Improve your application</h2>
            <p className="muted">Suggested next actions based on your profile and currently documented university requirements. This is rule-based advice, not an AI API review.</p>
            <ul className="requirements-list">
              {nextSteps.slice(0, 5).map((step) => (
                <li className="requirement-item" key={step}>
                  <CheckCircle2 size={16} aria-hidden="true" style={{ display: "inline", marginRight: 8 }} />
                  {step}
                </li>
              ))}
            </ul>
            <Link className="text-link" href="/improve">Open full application improvement checklist <ArrowRight size={15} aria-hidden="true" /></Link>
          </section>

          <label className="field-label" style={{ marginBottom: "1.25rem", display: "block" }}>
            Filter university matches
            <input
              aria-label="Filter university matches"
              type="search"
              value={query}
              placeholder="University or country…"
              onChange={(event) => { setQuery(event.target.value); setShowAll(false); }}
            />
          </label>

          <div className="section-heading">
            <strong>{filtered.length} researched universities</strong>
            <span className="tiny-note">Ranked by verified alignment points, not admission probability</span>
          </div>

          <div className="university-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))", gap: "1.2rem" }}>
            {visible.map(({ university: u, fit }) => {
              const saved = savedIds.has(u.id);
              const satContext = researchedSATContext(u);
              const studentSat = profile.sat;
              return (
                <article className="university-card" key={u.id} style={{ display: "grid", gap: "0.8rem", alignContent: "start" }}>
                  <div className="card-identity">
                    <h3><Link href={`/universities/${u.id}`}>{u.name}</Link></h3>
                    <p className="location">{u.city} · {u.country}</p>
                  </div>
                  <div>
                    <strong style={{ fontSize: "1.35rem" }}>
                      {fit.score === null ? "Not enough verified data" : `${fit.score}/100 points`}
                    </strong>
                    <p className="tiny-note">
                      {fit.coverage}/100 criteria points checked against published evidence. NOT an admission probability.
                    </p>
                    <div
                      aria-label={`Evidence coverage ${fit.coverage} out of 100`}
                      style={{ background: "var(--border, #bbb)", height: 6, borderRadius: 99, overflow: "hidden", marginTop: 8 }}
                    >
                      <div style={{ background: "var(--accent, #346cb7)", width: `${fit.coverage}%`, height: "100%" }} />
                    </div>
                  </div>
                  {satContext && (
                    <div className="notice" style={{ padding: "0.8rem" }}>
                      <strong>SAT 25th / Median / 75th:</strong>{" "}
                      {satContext.p25} / {satContext.p50 ?? "—"} / {satContext.p75}
                      {studentSat !== null && (
                        <p className="tiny-note">Your {studentSat}: {satBandText(studentSat, satContext.p25, satContext.p50, satContext.p75)}.</p>
                      )}
                      <a href={satContext.source} target="_blank" rel="noopener noreferrer" className="text-link">Official historical score data ↗</a>
                    </div>
                  )}
                  <ul style={{ display: "grid", gap: 6, paddingLeft: "1.1rem" }}>
                    {fit.signals.map((signal) => (
                      <li key={signal.label}>
                        <strong>{signal.status === "match" ? "✓ " : signal.status === "mismatch" ? "– " : "? "}{signal.label}:</strong>{" "}
                        <span className="muted">{signal.detail}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="card-footer" style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    <Button
                      type="button"
                      variant={saved ? "outline" : "default"}
                      size="sm"
                      onClick={() => {
                        if (update((s) => toggleSaved(s, u.id)))
                          toast(saved ? "Removed from your shortlist." : "Saved to your private shortlist.");
                      }}
                    >
                      <Bookmark size={15} /> {saved ? "Saved — remove" : "Save university"}
                    </Button>
                    <Link className="profile-link" href={`/universities/${u.id}#financial-aid`}>
                      Scholarships <ArrowRight size={15} />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
          {visible.length === 0 && (
            <section className="panel"><CircleHelp size={20} /> No universities match your search. Try a different name.</section>
          )}
          {!showAll && filtered.length > visible.length && (
            <div style={{ textAlign: "center", margin: "1.5rem" }}>
              <Button variant="outline" onClick={() => setShowAll(true)}>
                Show all {filtered.length} universities
              </Button>
            </div>
          )}
          <LocalNote />
        </>
      )}
    </main>
  );
}
