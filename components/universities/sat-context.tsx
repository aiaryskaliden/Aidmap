"use client";

import Link from "next/link";
import { useApp } from "@/components/providers";
import type { University } from "@/types/domain";
import { researchedSATContext, satBandText } from "@/data/cds-sat-2025";

export function SATContext({ university }: { university: University }) {
  const context = researchedSATContext(university);
  const { state } = useApp();
  const sat = state.profile?.isDemo ? null : state.profile?.sat ?? null;
  if (!context) {
    return (
      <div className="notice">
        <p>
          <strong>Historical SAT distribution not published in our research yet.</strong>{" "}
          This is different from an admission minimum. Review the university\u2019s
          official admissions or institutional research page for score context.
        </p>
      </div>
    );
  }
  const cells: { label: string; value: number | null }[] = [
    { label: "25th percentile", value: context.p25 },
    { label: "Median (50th)", value: context.p50 },
    { label: "75th percentile", value: context.p75 },
  ];
  return (
    <div className="panel" style={{ marginTop: "1rem" }}>
      <div className="panel-heading">
        <h3>Official SAT score distribution</h3>
        <span className="tag neutral">Historical cohort</span>
      </div>
      <p className="tiny-note">{context.cohort} · composite SAT / 1600</p>
      <div className="summary-grid" style={{ marginTop: "0.7rem" }}>
        {cells.map(({ label, value }) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value ?? "Not reported"}</dd>
          </div>
        ))}
      </div>
      {sat !== null ? (
        <p style={{ marginTop: "0.9rem" }}>
          <strong>Your SAT: {sat}.</strong>{" "}
          {satBandText(sat, context.p25, context.p50, context.p75)}.
          This compares scores of enrolled students who submitted SAT results,
          not the likelihood that you will be admitted.
        </p>
      ) : (
        <p style={{ marginTop: "0.9rem" }}>
          <Link href="/profile" className="text-link">Add SAT to compare your own score →</Link>
        </p>
      )}
      <a href={context.source} target="_blank" rel="noopener noreferrer" className="text-link">
        View original institutional data (Common Data Set / score source) ↗
      </a>
    </div>
  );
}

export function MBZUAIWaiver({ university }: { university: University }) {
  const { state } = useApp();
  if (university.id !== "mbzuai") return null;
  const sat = state.profile?.isDemo ? null : state.profile?.sat ?? null;
  const math = state.profile?.isDemo ? null : state.profile?.satMath ?? null;
  const eligibleByScores = sat !== null && math !== null && sat >= 1400 && math >= 760;
  return (
    <div className="panel" style={{ marginTop: "1rem" }}>
      <div className="panel-heading">
        <h3>MBZUAI: screening exam waiver</h3>
        <span className="tag neutral">Separate from admission</span>
      </div>
      <p>
        The published SAT route requires <strong>1400+ total AND 760+ Math</strong>.
        Both are necessary for consideration for an exemption from the screening exam.
        This is <strong>not</strong> the minimum SAT score for admission; SAT itself is optional.
      </p>
      {sat === null || math === null ? (
        <p>Add both your SAT total and Math section score in <Link className="text-link" href="/profile">Preferences</Link> to check this route.</p>
      ) : (
        <p>
          <strong>Your reported scores: {sat} total / {math} Math.</strong>{" "}
          {eligibleByScores
            ? "You meet both published numerical thresholds for potential exemption. Submit verifiable scores and await the university\u2019s decision."
            : "The two-score SAT waiver route is not met; other published exemptions may still apply. This does not mean you cannot apply."}
        </p>
      )}
      <p className="tiny-note">
        Other qualifying routes can include specified ACT scores or eligible international Olympiad medals.
        A confirmed screening-exam waiver may also qualify an applicant for the application-fee waiver.
      </p>
      <a href="https://mbzuai.ac.ae/admissions/undergraduate-admissions"
        target="_blank" rel="noopener noreferrer" className="text-link">
        MBZUAI official admissions and waiver criteria ↗
      </a>
    </div>
  );
}
