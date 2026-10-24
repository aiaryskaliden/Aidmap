"use client";
import { useState } from "react";
import { useApp } from "@/components/providers";
import { findDossier } from "@/data/core-admissions";
import { findUniversity } from "@/data/universities";
import { requirementsForRound } from "@/lib/requirements";
import { timelineEvents } from "@/lib/calendar";
import { dateLabel } from "@/lib/utils";
export function ApplicationBrief() {
  const { state } = useApp();
  const [notes, setNotes] = useState(false);
  return (
    <section className="application-brief panel">
      <div className="no-print">
        <h2>Print your application brief</h2>
        <p>
          Includes your shortlist, required and conditional items, dates and
          official links. Scores, budgets and private notes are excluded by
          default.
        </p>
        <label className="check-label">
          <input
            type="checkbox"
            checked={notes}
            onChange={(e) => setNotes(e.target.checked)}
          />
          Include my private notes in this brief
        </label>
        <button
          className="button button-outline"
          onClick={() => window.print()}
        >
          Print application brief
        </button>
      </div>
      <div className="print-brief">
        <h1>AidMap · Application brief</h1>
        <p>
          Personal planning record · Confirm each official portal. Progress is
          self-reported.
        </p>
        {state.saved.map((s) => {
          const d = findDossier(s.universityId);
          return (
            <article key={s.universityId}>
              <h2>{findUniversity(s.universityId)?.name}</h2>
              <p>
                {s.applicationType || "Round not selected"} · {s.status}
              </p>
              {d ? (
                <ul>
                  {requirementsForRound(d, s.applicationType)
                    .filter(
                      (r) =>
                        r.level === "Required" || r.level === "Conditional",
                    )
                    .map((r) => (
                      <li key={r.id}>
                        <strong>{r.label}</strong> — {r.stage}, {r.level};{" "}
                        {r.owner}. {r.condition} {r.due}. Progress:{" "}
                        {s.requirementProgress?.[r.id]?.status ?? "Not started"}
                        .{" "}
                        {r.sourceIds.map((id) => {
                          const source = d.sources.find((x) => x.id === id);
                          return source ? (
                            <span className="print-url" key={id}>
                              {source.url}{" "}
                            </span>
                          ) : null;
                        })}
                      </li>
                    ))}
                </ul>
              ) : (
                <p>
                  Detailed requirements not yet researched; check the official
                  admissions site.
                </p>
              )}
              <h3>Dates</h3>
              <ul>
                {timelineEvents(s, d).map((e) => (
                  <li key={e.id}>
                    {e.label}:{" "}
                    {e.date ? dateLabel(e.date) : (e.relative ?? "Unresolved")}{" "}
                    · {e.category}. {e.note}{" "}
                    {e.source && <span className="print-url">{e.source}</span>}
                  </li>
                ))}
              </ul>
              {notes && s.notes && (
                <div className="brief-private-notes">
                  <h3>Private notes · included by your choice</h3>
                  <p>{s.notes}</p>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
