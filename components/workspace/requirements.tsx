"use client";
import { useState } from "react";
import Link from "next/link";
import type { AdmissionsDossier } from "@/types/admissions";
import { useApp } from "@/components/providers";
import { toggleSaved, updateSaved } from "@/lib/storage/state";
import {
  importRequirements,
  progressStates,
  requirementsForRound,
  requirementSummary,
} from "@/lib/requirements";
import { findDossier } from "@/data/core-admissions";
import { findUniversity } from "@/data/universities";
import { ResearchEvidence } from "@/components/universities/research-evidence";
import { countLabel } from "@/lib/format";

export function RequirementWorkspace({
  dossier: d,
}: {
  dossier: AdmissionsDossier;
}) {
  const { state, ready, blocked, update, toast } = useApp();
  const saved = state.saved.find((s) => s.universityId === d.universityId);
  const [stage, setStage] = useState("admission");
  const [onlyPending, setOnlyPending] = useState(false);
  const [reason, setReason] = useState<Record<string, string>>({});
  const round = saved?.applicationType ?? "";
  const visible = requirementsForRound(d, round).filter(
    (r) => r.stage === stage,
  );
  const summary = requirementSummary(visible, saved?.requirementProgress);
  const tracked = !!saved?.requirementProgress;
  return (
    <div className="requirements-workspace">
      <p className="notice">
        These are your own progress records. AidMap does not send documents or
        confirm receipt. Prepared materials still need to be submitted
        separately to each university.
      </p>
      <div className="form-grid">
        <label className="field-label">
          Application round
          <select
            aria-label="Application round"
            value={round}
            disabled={!ready || blocked}
            onChange={(e) =>
              update((s) => {
                const next = s.saved.some(
                  (x) => x.universityId === d.universityId,
                )
                  ? s
                  : toggleSaved(s, d.universityId);
                return updateSaved(next, d.universityId, {
                  applicationType: e.target.value,
                });
              })
            }
          >
            <option value="">Choose a round</option>
            {d.rounds.map((r) => (
              <option key={r.name}>{r.name}</option>
            ))}
            {round && !d.rounds.some((r) => r.name === round) && (
              <option>{round}</option>
            )}
          </select>
        </label>
        <label className="field-label">
          Application stage
          <select
            aria-label="Application stage"
            value={stage}
            onChange={(e) => setStage(e.target.value)}
          >
            <option value="admission">Admission application</option>
            <option value="aid">Financial aid</option>
            <option value="enrollment">After admission / enrollment</option>
          </select>
        </label>
      </div>
      {!round && (
        <p className="tiny-note">
          Choose your round to narrow the list. Round-specific items remain
          visible until you choose.
        </p>
      )}
      {round && <p>{d.rounds.find((r) => r.name === round)?.policy}</p>}
      <button
        className="button button-outline"
        disabled={!ready || blocked}
        onClick={() => {
          const ok = update((s) => {
            const next = s.saved.some((x) => x.universityId === d.universityId)
              ? s
              : toggleSaved(s, d.universityId);
            const item = next.saved.find(
              (x) => x.universityId === d.universityId,
            )!;
            return updateSaved(next, d.universityId, {
              requirementProgress: importRequirements(
                d,
                item.requirementProgress,
              ),
            });
          });
          if (ok)
            toast(
              "Requirements saved. Existing progress and personal dates are preserved.",
            );
        }}
      >
        {tracked
          ? "Refresh sourced checklist"
          : "Add sourced checklist to my planner"}
      </button>
      <div className="requirement-summary" aria-live="polite">
        <strong>
          {countLabel(summary.pending.length, "required or conditional item")}{" "}
          still need attention
        </strong>
        <p>
          {summary.pending[0]
            ? `Next: ${summary.pending[0].owner} — ${summary.pending[0].label}`
            : "No outstanding required items in this view. Confirm your official portal checklist."}
        </p>
        <label className="check-label">
          <input
            type="checkbox"
            checked={onlyPending}
            onChange={(e) => setOnlyPending(e.target.checked)}
          />
          Only incomplete required and conditional items
        </label>
      </div>
      <div className="requirement-list">
        {(onlyPending ? summary.pending : visible).map((r) => {
          const progress = saved?.requirementProgress?.[r.id];
          return (
            <article className="requirement-card" key={r.id}>
              <div className="requirement-title">
                <h3>{r.label}</h3>
                <span className="tag neutral">{r.level}</span>
              </div>
              <p>
                <strong>{r.owner}</strong> · {r.due}
              </p>
              {r.condition && <p>{r.condition}</p>}
              <p>
                <strong>Submit: </strong>
                {r.submission}
              </p>
              {r.reusableKey && (
                <label className="check-label">
                  <input
                    type="checkbox"
                    disabled={!ready || blocked}
                    checked={state.preparation?.[r.reusableKey] ?? false}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      update((s) => ({
                        ...s,
                        preparation: {
                          ...s.preparation,
                          [r.reusableKey!]: checked,
                        },
                      }));
                    }}
                  />
                  Preparation available for reuse · review this university’s
                  requirements before sending
                </label>
              )}
              {tracked && (
                <label className="field-label">
                  Your progress: {r.label}
                  <select
                    aria-label={`Your progress: ${r.label}`}
                    disabled={!ready || blocked}
                    value={progress?.status ?? "Not started"}
                    onChange={(e) => {
                      const status = e.target.value as NonNullable<
                        typeof progress
                      >["status"];
                      if (
                        status === "Not applicable" &&
                        !(reason[r.id] ?? progress?.reason)?.trim()
                      ) {
                        toast(
                          "Explain which condition does not apply before choosing Not applicable.",
                        );
                        return;
                      }
                      update((s) => {
                        const item = s.saved.find(
                          (x) => x.universityId === d.universityId,
                        )!;
                        return updateSaved(s, d.universityId, {
                          requirementProgress: {
                            ...item.requirementProgress,
                            [r.id]: {
                              status,
                              reason: reason[r.id] ?? progress?.reason,
                            },
                          },
                        });
                      });
                    }}
                  >
                    {progressStates.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                    {r.level === "Conditional" && (
                      <option>Not applicable</option>
                    )}
                  </select>
                </label>
              )}
              {tracked && r.level === "Conditional" && (
                <label className="field-label">
                  Why this condition does not apply (if relevant)
                  <input
                    maxLength={500}
                    value={reason[r.id] ?? progress?.reason ?? ""}
                    onChange={(e) =>
                      setReason({ ...reason, [r.id]: e.target.value })
                    }
                    onBlur={(e) => {
                      const text = e.target.value;
                      if (
                        progress?.status === "Not applicable" &&
                        !text.trim()
                      ) {
                        toast("A reason is required for Not applicable.");
                        return;
                      }
                      update((s) => {
                        const item = s.saved.find(
                          (x) => x.universityId === d.universityId,
                        )!;
                        return updateSaved(s, d.universityId, {
                          requirementProgress: {
                            ...item.requirementProgress,
                            [r.id]: {
                              status: progress?.status ?? "Not started",
                              reason: text,
                            },
                          },
                        });
                      });
                    }}
                  />
                </label>
              )}
              <ResearchEvidence dossier={d} ids={r.sourceIds} />
            </article>
          );
        })}
      </div>
    </div>
  );
}
export function RequirementMatrix() {
  const { state } = useApp();
  return (
    <section className="panel">
      <h2>Requirements across your shortlist</h2>
      <p>
        Counts include required and conditional items still awaiting your
        confirmation. Preparation alone does not mean sent.
      </p>
      <div
        className="compare-scroll"
        role="region"
        aria-label="Shortlist requirements matrix"
        tabIndex={0}
      >
        <table className="workspace-table">
          <thead>
            <tr>
              <th>University / round</th>
              <th>Admission still open</th>
              <th>Aid still open</th>
              <th>Who acts next</th>
            </tr>
          </thead>
          <tbody>
            {state.saved.map((s) => {
              const d = findDossier(s.universityId);
              const rs = d ? requirementsForRound(d, s.applicationType) : [];
              const a = requirementSummary(
                rs.filter((r) => r.stage === "admission"),
                s.requirementProgress,
              );
              const f = requirementSummary(
                rs.filter((r) => r.stage === "aid"),
                s.requirementProgress,
              );
              const next = a.pending[0] ?? f.pending[0];
              return (
                <tr key={s.universityId}>
                  <th scope="row">
                    <Link href={`/universities/${s.universityId}#checklist`}>
                      {findUniversity(s.universityId)?.shortName}
                    </Link>
                    <small>{s.applicationType || "Round not selected"}</small>
                  </th>
                  <td>
                    {d
                      ? `${a.pending.length} / ${a.total}`
                      : "Research checklist only"}
                  </td>
                  <td>
                    {d ? `${f.pending.length} / ${f.total}` : "Not researched"}
                  </td>
                  <td>
                    {next
                      ? `${next.owner}: ${next.label}`
                      : d
                        ? "Review official portal"
                        : "Confirm official requirements"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
