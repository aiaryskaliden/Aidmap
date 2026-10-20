"use client";
import type { University } from "@/types/domain";
import { verifiedDeadline } from "@/lib/admissions";
import { importOfficialDeadline } from "@/lib/planning";
import { dateLabel } from "@/lib/utils";
import { useApp } from "@/components/providers";
import { ExternalLink } from "@/components/ui/shared";
import { Help } from "@/components/ui/help";
export function DeadlineTable({ university: u }: { university: University }) {
  const { state, update, toast, ready, blocked } = useApp();
  const intake = `Fall ${state.profile?.entryYear ?? 2027}`;
  const today = new Date().toISOString().slice(0, 10);
  const deadlines = u.deadlines.value ?? [];
  return (
    <>
      <Help term="priority" />
      <p>
        Dates belong to the intake shown. A month and day without a verified
        year remain a reference. Adding a date requires your confirmation.
      </p>
      {deadlines.length ? (
        <div
          className="deadline-table-scroll"
          tabIndex={0}
          role="region"
          aria-label="Application deadlines"
        >
          <table className="deadline-table">
            <thead>
              <tr>
                <th>Deadline</th>
                <th>Date / intake</th>
                <th>Status</th>
                <th>Next action</th>
              </tr>
            </thead>
            <tbody>
              {deadlines.map((d, i) => {
                const current = verifiedDeadline(u, d, intake);
                const usable = current && !!d.date && d.date >= today;
                const source = u.sources.find((s) =>
                  (d.sourceIds ?? u.deadlines.sourceIds).includes(s.id),
                );
                return (
                  <tr key={`${d.label}-${i}`}>
                    <th scope="row">
                      {d.label}
                      <small>{d.kind}</small>
                    </th>
                    <td>
                      {dateLabel(d.date)}
                      <small>{d.cycle ?? "Intake not specified"}</small>
                    </td>
                    <td>
                      <span className={`tag ${current ? "green" : "amber"}`}>
                        {current
                          ? `Verified for ${intake}`
                          : d.date && d.cycle
                            ? d.cycle < intake
                              ? "Previous-cycle reference"
                              : "Different intake — verify applicability"
                            : "Needs intake verification"}
                      </span>
                      <p>{d.note}</p>
                      {source && (
                        <ExternalLink href={source.url}>
                          Official deadline
                        </ExternalLink>
                      )}
                    </td>
                    <td>
                      {usable ? (
                        <button
                          className="button button-outline"
                          disabled={!ready || blocked}
                          onClick={() => {
                            if (
                              !confirm(
                                `Add ${d.label}: ${dateLabel(d.date)} (${intake}) to your planner? This replaces this university’s current planning date. Check that this round and applicant category apply to you.`,
                              )
                            )
                              return;
                            const accepted = update((s) =>
                              importOfficialDeadline(s, u, d, intake, today),
                            );
                            if (accepted)
                              toast(
                                "Verified deadline added to your planner with its source.",
                              );
                          }}
                        >
                          Add to planner
                        </button>
                      ) : (
                        <span>
                          {current ? "Date has passed" : "Review official page"}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="notice amber-notice">
          No admission dates are verified for {intake}. Confirm the current
          dates on the official admissions website.
        </p>
      )}
    </>
  );
}
