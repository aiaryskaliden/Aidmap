"use client";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  CalendarDays,
  CheckCheck,
  CircleAlert,
  Wallet,
  Trash2,
  Plus,
  GraduationCap,
} from "lucide-react";
import { useApp } from "@/components/providers";
import {
  findUniversity,
  opportunities,
  universities,
} from "@/data/universities";
import { PageHeading, EmptyState, LocalNote } from "@/components/ui/shared";
import { WorkspaceNav } from "@/components/layout/shell";
import { UniversityCard } from "@/components/universities/card";
import { dateLabel } from "@/lib/utils";
import { matchUniversity } from "@/lib/matching/match";
export default function Dashboard() {
  const { state, update, ready } = useApp();
  const tasks = state.saved.flatMap((s) => s.tasks);
  const completed = tasks.filter((t) => t.done).length;
  const deadlines = state.saved
    .filter((s) => s.deadline)
    .sort((a, b) => a.deadline!.localeCompare(b.deadline!));
  const matched = state.profile
    ? universities
        .map((u) => ({ u, reasons: matchUniversity(u, state.profile) }))
        .filter((x) =>
          x.reasons.some((r) => r.category === "Academic interest match"),
        )
        .slice(0, 3)
    : [];
  return (
    <div className="page-container workspace-page">
      <WorkspaceNav />
      <PageHeading
        eyebrow="YOUR WORKSPACE / FALL 2027"
        title="Your next chapter starts here."
        description="A little clarity, a little progress. Make your next move count."
      >
        <LocalNote />
      </PageHeading>
      {state.profile?.isDemo && (
        <div className="notice amber-notice">
          Demo preferences are active. These are synthetic values for testing.
        </div>
      )}
      <div className="dashboard-stats">
        {[
          {
            icon: Bookmark,
            label: "Saved universities",
            value: state.saved.length,
            note: "Your possibilities",
          },
          {
            icon: CheckCheck,
            label: "Tasks completed",
            value: `${completed} / ${tasks.length}`,
            note: "Real progress, one step at a time",
          },
          {
            icon: Wallet,
            label: "Funding scenarios",
            value: state.scenarios.length,
            note: "Your financial what-ifs",
          },
          {
            icon: CalendarDays,
            label: "Custom deadlines",
            value: deadlines.length,
            note: "Dates set by you",
          },
        ].map((s) => (
          <div key={s.label}>
            <span className="stat-icon">
              <s.icon size={20} />
            </span>
            <span>{s.label}</span>
            <strong>{ready ? s.value : "—"}</strong>
            <small>{s.note}</small>
          </div>
        ))}
      </div>
      <div className="dashboard-layout">
        <div>
          <section className="workspace-section">
            <div className="section-heading">
              <div>
                <span className="eyebrow">YOUR POSSIBILITIES</span>
                <h2>University shortlist</h2>
              </div>
              <Link className="text-link" href="/explore">
                <Plus size={15} />
                Find more
              </Link>
            </div>
            {state.saved.length ? (
              <div className="university-grid dashboard-universities">
                {state.saved.map((s) => {
                  const u = findUniversity(s.universityId);
                  return u ? (
                    <UniversityCard key={u.id} university={u} />
                  ) : (
                    <div className="panel" key={s.universityId}>
                      This saved institution is no longer in the current
                      dataset.
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                title="Your shortlist is a blank canvas."
                text="Save a university that catches your interest. We’ll keep your research and next steps together here."
              />
            )}
          </section>
          <section className="workspace-section">
            <div className="section-heading">
              <div>
                <span className="eyebrow">LOOK AT THE NUMBERS</span>
                <h2>Saved funding scenarios</h2>
              </div>
              <Link className="text-link" href="/calculator">
                New scenario
                <ArrowUpRight size={15} />
              </Link>
            </div>
            {state.scenarios.length ? (
              <div className="scenario-list">
                {state.scenarios.map((s) => (
                  <div className="scenario-row" key={s.id}>
                    <span className="icon-box">
                      <Wallet size={19} />
                    </span>
                    <div>
                      <Link
                        href={`/calculator?scenario=${encodeURIComponent(s.id)}`}
                      >
                        {s.name}
                      </Link>
                      <p>
                        {findUniversity(s.universityId)?.name ??
                          "Custom scenario"}{" "}
                        · {s.currency} · User-entered estimates
                      </p>
                    </div>
                    <button
                      className="icon-button"
                      aria-label={`Delete scenario ${s.name}`}
                      onClick={() => {
                        if (confirm(`Delete “${s.name}”?`))
                          update((x) => ({
                            ...x,
                            scenarios: x.scenarios.filter((v) => v.id !== s.id),
                          }));
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="subtle-empty">
                <Wallet size={23} />
                <p>
                  No funding scenarios yet. Start with costs, then explore the
                  possibilities.
                </p>
                <Link href="/calculator" className="text-link">
                  Try the funding calculator
                  <ArrowRight size={15} />
                </Link>
              </div>
            )}
          </section>
          {state.savedFunding.length > 0 && (
            <section className="workspace-section">
              <h2>Saved funding policies</h2>
              {opportunities
                .filter((o) => state.savedFunding.includes(o.id))
                .map((o) => (
                  <Link
                    className="saved-scenario-link"
                    key={o.id}
                    href={`/universities/${o.universityId}#financial-aid`}
                  >
                    {o.name}
                    <ArrowUpRight size={15} />
                  </Link>
                ))}
            </section>
          )}
          {matched.length > 0 && (
            <section className="workspace-section">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">BASED ON YOUR STATED INTEREST</span>
                  <h2>Academic directions to explore</h2>
                </div>
              </div>
              {matched.map(({ u, reasons }) => (
                <div className="recommendation-row" key={u.id}>
                  <GraduationCap size={20} />
                  <div>
                    <Link href={`/universities/${u.id}`}>
                      {u.name}
                      <ArrowUpRight size={14} />
                    </Link>
                    <p>
                      {
                        reasons.find(
                          (r) => r.category === "Academic interest match",
                        )?.text
                      }
                    </p>
                    <small>
                      Research match only. Funding and admission remain
                      uncertain.
                    </small>
                  </div>
                </div>
              ))}
            </section>
          )}
        </div>
        <aside className="dashboard-aside">
          <div className="panel">
            <div className="panel-heading">
              <h3>Your next steps</h3>
              <span className="tag neutral">START HERE</span>
            </div>
            <Link className="next-step" href="/profile">
              <span>01</span>
              <div>
                <strong>
                  {state.profile
                    ? "Review your preferences"
                    : "Tell us what matters to you"}
                </strong>
                <p>Destinations, subjects and funding priorities.</p>
              </div>
              <ArrowRight size={15} />
            </Link>
            <Link className="next-step" href="/planner">
              <span>02</span>
              <div>
                <strong>Build an application plan</strong>
                <p>Add a task, a note, or your own deadline.</p>
              </div>
              <ArrowRight size={15} />
            </Link>
            <Link className="next-step" href="/calculator">
              <span>03</span>
              <div>
                <strong>Look beyond tuition</strong>
                <p>Understand the whole financial picture.</p>
              </div>
              <ArrowRight size={15} />
            </Link>
          </div>
          <div className="panel">
            <h3>
              <CalendarDays size={18} />
              Your custom timeline
            </h3>
            {deadlines.length ? (
              deadlines.map((s) => (
                <Link
                  className="deadline-row"
                  key={s.universityId}
                  href="/planner"
                >
                  <span>
                    {findUniversity(s.universityId)?.shortName ??
                      s.universityId}
                  </span>
                  <strong>{dateLabel(s.deadline)}</strong>
                  <small>User-defined date</small>
                </Link>
              ))
            ) : (
              <p className="muted">
                No custom deadlines yet. Add a date in your planner after
                checking the official requirements.
              </p>
            )}
            <Link className="text-link" href="/planner">
              Open application planner
              <ArrowRight size={15} />
            </Link>
          </div>
          <div className="verification-reminder">
            <CircleAlert size={21} />
            <h3>Keep the unknowns in view.</h3>
            <p>
              {state.saved.length
                ? `${state.saved.length} saved institutions have costs or cycle-specific requirements to verify.`
                : "University aid policies don’t establish your individual award or your final contribution."}
            </p>
            <Link href="/about">
              How we handle uncertainty
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
