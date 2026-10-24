import Link from "next/link";
import type { University } from "@/types/domain";
import { cycleLabel } from "@/lib/admissions";
import {
  satBenchmark,
  satPolicyLabel,
  ieltsScoreLabel,
} from "@/lib/test-scores";
import { Evidence } from "@/components/ui/shared";

export function TestScores({
  university: u,
  compact = false,
}: {
  university: University;
  compact?: boolean;
}) {
  const sat = satBenchmark(u);
  const ielts = u.ielts.value;
  return (
    <div className={`test-scores ${compact ? "test-scores-compact" : ""}`}>
      <div className="test-score-grid">
        <div className="test-score-panel">
          <span className="card-label">SAT / 1600</span>
          <span className="test-policy">{satPolicyLabel(u)}</span>
          {u.satPolicy.scope && (
            <small className="test-scope">
              {u.satPolicy.scope.program} only
            </small>
          )}
          <strong
            className={`test-score-value ${sat.value === "Not verified" ? "test-score-unknown" : ""}`}
          >
            {sat.value}
          </strong>
          <span className="test-score-caption">{sat.label}</span>
          {sat.field.scope && (
            <small className="test-scope">
              {sat.field.scope.program} only · {sat.field.scope.purpose}
            </small>
          )}
          {u.satMedian.value !== null && u.satMiddle50.value && (
            <small>
              Middle 50%: {u.satMiddle50.value.low}–{u.satMiddle50.value.high}
            </small>
          )}
          {sat.field.cycle && (
            <small className="test-cohort">{sat.field.cycle}</small>
          )}
          {!compact && (
            <>
              <p>
                {u.satPolicy.note ??
                  u.testPolicy.value ??
                  "Check the requirements for your program and school qualification."}
              </p>
              <Evidence
                university={u}
                field={u.satPolicy}
                label={cycleLabel(u.satPolicy, u)}
              />
              {sat.field.note && <p>{sat.field.note}</p>}
              <Evidence
                university={u}
                field={sat.field}
                label={
                  sat.field.value === null
                    ? "Score data not yet verified"
                    : "Official score data"
                }
              />
            </>
          )}
        </div>
        <div className="test-score-panel">
          <span className="card-label">IELTS / 9</span>
          <span className="test-policy">
            English evidence: {ielts?.requirement ?? "Not yet verified"}
          </span>
          {u.ielts.scope && (
            <small className="test-scope">
              {u.ielts.scope.program} only · {u.ielts.scope.purpose}
            </small>
          )}
          {ielts?.scores.length ? (
            ielts.scores.map((s, i) => {
              const label = ieltsScoreLabel(s);
              return (
                <div className="ielts-score" key={i}>
                  <strong className="test-score-value">{label.value}</strong>
                  <span className="test-score-caption">{label.label}</span>
                  {!compact && <p>{s.condition}</p>}
                </div>
              );
            })
          ) : (
            <strong className="test-score-unknown">
              {ielts?.noScoreLabel ?? "Score not yet verified"}
            </strong>
          )}
          {!compact && (
            <>
              <p>
                {ielts?.detail ??
                  "IELTS acceptance, score guidance and exemptions need verification for your chosen program."}
              </p>
              <Evidence university={u} field={u.ielts} />
            </>
          )}
        </div>
      </div>
      {compact ? (
        <Link
          className="test-score-details"
          href={`/universities/${u.id}#test-scores`}
        >
          Score context, conditions & sources →
        </Link>
      ) : (
        <p className="test-score-explainer">
          SAT medians describe the middle reported score; the middle 50% runs
          from the 25th to the 75th percentile. These historical figures are not
          entry requirements. IELTS figures show university guidance, not an
          admitted-student average. Alternative tests and exemptions may apply;
          no score guarantees admission.
        </p>
      )}
    </div>
  );
}

export function TestScoreSection({ university }: { university: University }) {
  return (
    <section
      id="test-scores"
      className="panel test-score-section"
      aria-label="SAT and IELTS scores"
    >
      <span className="eyebrow">TEST REQUIREMENTS & SCORE BENCHMARKS</span>
      <h2>SAT & IELTS at a glance</h2>
      <TestScores university={university} />
    </section>
  );
}
