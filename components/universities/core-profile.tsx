import Link from "next/link";
import type { AdmissionsDossier } from "@/types/admissions";
import type { University } from "@/types/domain";
import { money, dateLabel } from "@/lib/utils";
import { UniversityActions } from "@/components/universities/actions";
import { MatchPanel } from "@/components/universities/detail-actions";
import { RequirementWorkspace } from "@/components/workspace/requirements";
import { AcademicContext } from "./academic-context";
import { ResearchEvidence } from "./research-evidence";
import { DeadlineTable } from "./deadlines";
import { Help } from "@/components/ui/help";
import { TestScoreSection } from "./test-scores";
export function CoreProfile({
  university: u,
  dossier: d,
}: {
  university: University;
  dossier: AdmissionsDossier;
}) {
  const scores = d.scores;
  const admissionDates = d.deadlines.filter(
    (date) => date.category === "admission",
  );
  const recurringLabel = (monthDay: string) =>
    new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    }).format(new Date(`2000-${monthDay}T12:00:00Z`));
  const testingLabel = {
    required: "SAT or ACT required",
    optional: "SAT / ACT optional",
    flexible: "Required testing, with specified alternatives",
    "not-accepted": "SAT / ACT not considered",
  };
  return (
    <div className="page-container detail-page core-profile">
      <Link className="back-link" href="/explore">
        ← Back to universities
      </Link>
      <div className="university-hero">
        <span
          className="university-monogram large"
          style={{ color: u.color, background: `${u.color}12` }}
        >
          {u.initials}
        </span>
        <div>
          <div className="eyebrow">FIRST-YEAR INTERNATIONAL · FALL 2027</div>
          <h1>{u.name}</h1>
          <p>
            {u.city}, {u.country}
          </p>
        </div>
        <UniversityActions id={u.id} />
      </div>
      <TestScoreSection university={u} />
      <section className="panel profile-summary">
        <h2>Your application at a glance</h2>
        <dl className="summary-grid">
          <div>
            <dt>Degree and subjects</dt>
            <dd>
              {u.degree} ·{" "}
              {[...new Set(d.programs.map((p) => p.category))]
                .slice(0, 3)
                .join(" · ")}{" "}
              · <a href="#overview">All researched options</a>
            </dd>
          </div>
          <div>
            <dt>Application rounds</dt>
            <dd>{d.rounds.map((r) => r.name).join(" · ")}</dd>
          </div>
          <div>
            <dt>Application fee</dt>
            <dd>
              {d.fee.amount === null
                ? "Not yet verified"
                : money(d.fee.amount, d.fee.currency)}{" "}
              · <a href="#admissions">Waiver conditions</a>
            </dd>
          </div>
          <div>
            <dt>SAT / ACT</dt>
            <dd>
              {u.satPolicy.value
                ? testingLabel[u.satPolicy.value]
                : "See policy"}{" "}
              · <a href="#score-context">Historical score ranges</a>
            </dd>
          </div>
          <div>
            <dt>Admission dates</dt>
            <dd>
              {admissionDates
                .map(
                  (date) =>
                    `${date.rounds.join(" / ") || date.label}: ${date.date ? dateLabel(date.date) : date.monthDay ? `${recurringLabel(date.monthDay)} (year not confirmed)` : "confirm with admissions"}`,
                )
                .join(" · ")}{" "}
              · <a href="#deadlines">Dates and conditions</a>
            </dd>
          </div>
          <div>
            <dt>English evidence</dt>
            <dd>
              {d.english.text.split(/(?<=\.)\s/)[0]}{" "}
              <a href="#admissions">Scores and exemptions</a>
            </dd>
          </div>
          <div>
            <dt>Dated annual cost baseline</dt>
            <dd>
              {d.costs.total === null
                ? "Not yet verified"
                : money(d.costs.total, d.costs.currency)}{" "}
              · {d.costs.year ?? "Year unresolved"} ·{" "}
              <a href="#estimated-cost">Inclusions</a>
            </dd>
          </div>
        </dl>
        <p>
          <strong>Route: </strong>
          {d.route.text}
        </p>
        <details>
          <summary>English policy and aid process</summary>
          <p>{d.english.text}</p>
          <p>{d.funding.forms}</p>
        </details>
        <p>
          <strong>Next: </strong>Choose a round, review its dates, and save your
          sourced checklist.
        </p>
        <div className="timeline-actions">
          <a className="button button-primary" href="#checklist">
            Build my requirement plan
          </a>
          <a className="button button-outline" href="#deadlines">
            Review dates
          </a>
        </div>
      </section>
      <nav className="detail-nav" aria-label="Profile sections">
        {[
          "Overview",
          "Admissions",
          "Test scores",
          "Score context",
          "Selection",
          "Financial aid",
          "Estimated cost",
          "Deadlines",
          "Checklist",
          "Sources",
        ].map((s) => (
          <a key={s} href={`#${s.toLowerCase().replaceAll(" ", "-")}`}>
            {s}
          </a>
        ))}
      </nav>
      <section id="overview" className="detail-section">
        <h2>Subjects and degree options</h2>
        <p>
          A selected sample from official academic directories. A related field
          or minor is not a separate undergraduate major.
        </p>
        <div className="program-grid">
          {d.programs.map((p) => (
            <article className="panel" key={`${p.name}-${p.credential}`}>
              <h3>{p.name}</h3>
              <p>
                {p.credential} · {p.category}
              </p>
              <ResearchEvidence dossier={d} ids={p.sourceIds} />
            </article>
          ))}
        </div>
        <MatchPanel university={u} />
      </section>
      <section id="admissions" className="detail-section">
        <h2>Route, rounds and submission</h2>
        <p>{d.route.text}</p>
        <ResearchEvidence dossier={d} ids={d.route.sourceIds} />
        {d.rounds.map((r) => (
          <article key={r.name}>
            <h3>{r.name}</h3>
            <p>{r.policy}</p>
            <ResearchEvidence dossier={d} ids={r.sourceIds} />
          </article>
        ))}
        <h3>Fee and waiver</h3>
        <p>
          {d.fee.amount === null
            ? "Fee not yet verified"
            : money(d.fee.amount, d.fee.currency)}
          . {d.fee.waiver}
        </p>
        <ResearchEvidence dossier={d} ids={d.fee.sourceIds} />
        <h3>
          Testing and score reporting <Help term="testing" />
        </h3>
        <p>{d.testing.text}</p>
        <ResearchEvidence dossier={d} ids={d.testing.sourceIds} />
        <h3>English proficiency</h3>
        <p>{d.english.text}</p>
        <div
          className="compare-scroll"
          tabIndex={0}
          role="region"
          aria-label="English test policy"
        >
          <table className="workspace-table">
            <thead>
              <tr>
                <th>Test / scale</th>
                <th>Published score context</th>
                <th>Applicability</th>
              </tr>
            </thead>
            <tbody>
              {d.english.tests.map((t, i) => (
                <tr key={i}>
                  <th>
                    {t.name} · {t.scale}
                  </th>
                  <td>
                    {t.score ?? "No numeric threshold verified"} · {t.kind}
                  </td>
                  <td>{t.condition}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {d.english.waiver && (
          <p>
            <strong>Exemptions: </strong>
            {d.english.waiver.rule}
          </p>
        )}
        <ResearchEvidence dossier={d} ids={d.english.sourceIds} />
      </section>
      <section id="score-context" className="detail-section">
        <h2>Historical score context</h2>
        <p>
          {scores.cohort ?? "Cohort not yet verified"} · {scores.population}
        </p>
        <p>
          These are the 25th–75th percentiles of the reported population. They
          are not minimum requirements or admission predictions.
        </p>
        <dl className="summary-grid">
          {[
            ["SAT composite", scores.satComposite],
            ["SAT reading and writing", scores.satReading],
            ["SAT math", scores.satMath],
            ["ACT composite", scores.actComposite],
          ].map(([label, range]) => (
            <div key={String(label)}>
              <dt>{String(label)}</dt>
              <dd>
                {Array.isArray(range) ? range.join("–") : "Range not verified"}
              </dd>
            </div>
          ))}
        </dl>
        <p>
          SAT median: {scores.satMedian ?? "Not verified"}. Submission share:
          SAT{" "}
          {scores.satSubmissionPercent === null
            ? "not verified"
            : `${scores.satSubmissionPercent}%`}
          ; ACT{" "}
          {scores.actSubmissionPercent === null
            ? "not verified"
            : `${scores.actSubmissionPercent}%`}
          . Students may submit both.
        </p>
        <p>{scores.note}</p>
        <ResearchEvidence dossier={d} ids={scores.sourceIds} />
        <AcademicContext dossier={d} />
      </section>
      <section id="selection" className="detail-section">
        <h2>What matters in admission</h2>
        <p>{d.selection.text}</p>
        <ResearchEvidence dossier={d} ids={d.selection.sourceIds} />
        {d.selection.factors.length > 0 && (
          <details>
            <summary>
              Published CDS selection categories · {d.selection.cdsYear}
            </summary>
            <p>
              Historical institutional categories, not numeric weights and not a
              list of required submissions.
            </p>
            <dl>
              {d.selection.factors.map((f) => (
                <div className="fact-row" key={f.name}>
                  <dt>{f.name}</dt>
                  <dd>
                    {f.importance}
                    <ResearchEvidence dossier={d} ids={f.sourceIds} />
                  </dd>
                </div>
              ))}
            </dl>
          </details>
        )}
        <p>
          Use this context to prepare thoughtful writing and choose recommenders
          who know your work. Meaningful commitments may include school, paid
          work, caregiving or community activity; there is no required
          achievement count.
        </p>
      </section>
      <section id="financial-aid" className="detail-section">
        <h2>International financial aid</h2>
        <p>{d.funding.text}</p>
        <h3>Forms and documents</h3>
        <p>{d.funding.forms}</p>
        <h3>Renewal and reassessment</h3>
        <p>{d.funding.renewal}</p>
        <h3>Conditions and exceptions</h3>
        <p>{d.funding.exceptions}</p>
        <ResearchEvidence dossier={d} ids={d.funding.sourceIds} />
        <p className="notice">
          The institution calculates financial need. A policy does not establish
          your individual award or guarantee a zero contribution. Aid dates and
          tasks are separate below.
        </p>
      </section>
      <section id="estimated-cost" className="detail-section">
        <h2>Published annual cost baseline</h2>
        <p>
          {d.costs.year ?? "Year not verified"} · {d.costs.currency}. This is a
          reference for the labelled year, not an automatic Fall 2027 price.
        </p>
        <div className="cost-table">
          {d.costs.components.map((c) => (
            <div key={c.label}>
              <span>
                {c.label} · {c.kind}
                <ResearchEvidence dossier={d} ids={c.sourceIds} />
              </span>
              <strong>
                {c.amount === null
                  ? "Variable / not verified"
                  : money(c.amount, d.costs.currency)}
              </strong>
            </div>
          ))}
          <div className="cost-total">
            <span>University-published baseline total</span>
            <strong>
              {d.costs.total === null
                ? "Not verified"
                : money(d.costs.total, d.costs.currency)}
            </strong>
          </div>
        </div>
        <p>{d.costs.exclusions}</p>
        <ResearchEvidence dossier={d} ids={d.costs.sourceIds} />
        <Link
          className="button button-primary"
          href={`/calculator?university=${u.id}`}
        >
          Build my own funding scenario →
        </Link>
      </section>
      <section id="deadlines" className="detail-section">
        <h2>Dates by round and purpose</h2>
        <p>
          Recurring month/day guidance does not confirm the target year.
          Relative dates need the stated event first.
        </p>
        <div className="timeline-list">
          {d.deadlines.map((t) => (
            <article key={t.id}>
              <h3>{t.label}</h3>
              <p>
                <strong>
                  {t.date
                    ? dateLabel(t.date)
                    : t.relative
                      ? `${t.relative.days} days after ${t.relative.event}`
                      : t.monthDay
                        ? `${t.monthDay} · recurring guidance, year unconfirmed`
                        : "Exact date not verified"}
                </strong>{" "}
                · {t.category} ·{" "}
                {t.rounds.join(", ") || "All applicable rounds"}
              </p>
              <p>
                {t.time ?? "Cutoff time not verified"}
                {t.timezone ? ` · ${t.timezone}` : ""} ·{" "}
                {t.cycle ?? "Cycle not specified"}
              </p>
              <p>{t.note}</p>
              <ResearchEvidence dossier={d} ids={t.sourceIds} />
            </article>
          ))}
        </div>
        <details>
          <summary>Save a confirmed date as your planning target</summary>
          <DeadlineTable university={u} />
        </details>
        <Link className="text-link" href="/planner">
          Open your deadline calendar and export selected dates →
        </Link>
      </section>
      <section id="checklist" className="detail-section">
        <h2>Your institution-specific requirements</h2>
        <RequirementWorkspace dossier={d} />
      </section>
      <section id="sources" className="detail-section">
        <h2>Evidence and remaining questions</h2>
        {d.gaps.length > 0 && (
          <div className="unknowns">
            <h3>Research gaps and source conflicts</h3>
            <ul>
              {d.gaps.map((g) => (
                <li key={g}>{g}</li>
              ))}
            </ul>
          </div>
        )}
        <ResearchEvidence dossier={d} ids={d.sources.map((s) => s.id)} />
      </section>
    </div>
  );
}
