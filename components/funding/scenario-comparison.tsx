"use client";
import { useState } from "react";
import { useApp } from "@/components/providers";
import { calculateFunding, hypotheticalFunding } from "@/lib/funding/calculate";
import { money } from "@/lib/utils";
import type { FundingScenario } from "@/types/domain";
import { countLabel } from "@/lib/format";
export function ScenarioComparison({
  onLoad,
}: {
  onLoad: (s: FundingScenario) => void;
}) {
  const { state } = useApp();
  const [ids, setIds] = useState<string[]>([]);
  const selected = state.scenarios.filter((s) => ids.includes(s.id));
  const rows = selected.map((s) => ({
    s,
    base: calculateFunding(
      s.costs,
      s.currency,
      s.contribution,
      s.confirmedAward === null
        ? null
        : { amount: s.confirmedAward, currency: s.currency, kind: "confirmed" },
    ),
    whatIf:
      s.hypotheticalAward === null
        ? null
        : hypotheticalFunding(
            s.costs,
            s.currency,
            s.contribution,
            s.hypotheticalAward,
          ),
  }));
  const amount = (v: number | null | undefined, s: FundingScenario) =>
    v == null ? "Unknown" : money(v, s.currency);
  const metrics: {
    label: string;
    value: (r: (typeof rows)[number]) => string;
  }[] = [
    { label: "Cost year", value: (r) => r.s.costYear || "Not recorded" },
    {
      label: "Provenance / assumptions",
      value: (r) => r.s.provenance || "Legacy scenario; source not recorded",
    },
    { label: "Currency", value: (r) => r.s.currency },
    { label: "Annual cost", value: (r) => amount(r.base.total, r.s) },
    {
      label: "Confirmed annual grant",
      value: (r) =>
        r.s.confirmedAward === null
          ? "No confirmed grant"
          : amount(r.s.confirmedAward, r.s),
    },
    {
      label: "Remaining cost after confirmed grant",
      value: (r) => amount(r.base.remaining, r.s),
    },
    { label: "Family budget", value: (r) => amount(r.s.contribution, r.s) },
    {
      label: "Above family budget",
      value: (r) => amount(r.base.aboveBudget, r.s),
    },
    {
      label: "Hypothetical TOTAL award · separate what-if",
      value: (r) => amount(r.s.hypotheticalAward, r.s),
    },
    {
      label: "What-if remaining cost",
      value: (r) => amount(r.whatIf?.remaining, r.s),
    },
    {
      label: "What-if budget gap",
      value: (r) => amount(r.whatIf?.aboveBudget, r.s),
    },
    {
      label: "Restrictions / renewal assumptions",
      value: (r) =>
        r.s.restrictions ||
        "Not recorded; verify the offer before relying on arithmetic",
    },
  ];
  return (
    <section className="panel scenario-comparison">
      <h2>Compare your saved scenarios</h2>
      <p>
        Choose two to four. Each column retains its own year, currency and
        assumptions. A tuition-only grant may not cover living expenses;
        arithmetic alone does not establish usable funding.
      </p>
      {!state.scenarios.length ? (
        <p>Save scenarios above to compare them here.</p>
      ) : (
        <div className="scenario-choices">
          {state.scenarios.map((s) => (
            <label key={s.id} className="check-label">
              <input
                type="checkbox"
                checked={ids.includes(s.id)}
                disabled={!ids.includes(s.id) && ids.length >= 4}
                onChange={(e) =>
                  setIds(
                    e.target.checked
                      ? [...ids, s.id]
                      : ids.filter((x) => x !== s.id),
                  )
                }
              />
              {s.name} · {s.currency}
            </label>
          ))}
        </div>
      )}
      <p aria-live="polite">
        {countLabel(selected.length, "scenario")} selected / 4
      </p>
      {new Set(selected.map((s) => s.currency)).size > 1 && (
        <p className="notice amber-notice">
          Different currencies: amounts are not ranked, added or converted.
        </p>
      )}
      {selected.length >= 2 ? (
        <div
          className="compare-scroll"
          role="region"
          aria-label="Saved funding scenario comparison"
          tabIndex={0}
        >
          <table className="workspace-table">
            <thead>
              <tr>
                <th>Annual scenario</th>
                {selected.map((s) => (
                  <th key={s.id}>
                    {s.name}
                    <button
                      className="text-link"
                      onClick={() => {
                        onLoad(s);
                        window.scrollTo({ top: 0, behavior: "instant" });
                      }}
                    >
                      Edit assumptions
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {metrics.map((m) => (
                <tr key={m.label}>
                  <th scope="row">{m.label}</th>
                  {rows.map((r) => (
                    <td key={r.s.id}>{m.value(r)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        state.scenarios.length > 0 && (
          <p>Select at least two scenarios for side-by-side comparison.</p>
        )
      )}
    </section>
  );
}
