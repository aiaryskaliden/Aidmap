"use client";
import { useState } from "react";
import Link from "next/link";
import { Plus, X, ArrowUpRight } from "lucide-react";
import { universities, findUniversity } from "@/data/universities";
import { useApp } from "@/components/providers";
import { toggleCompare } from "@/lib/storage/state";
import { PageHeading, PolicyNote } from "@/components/ui/shared";
import { dateLabel, money } from "@/lib/utils";
import { nextAdmissionDeadline, cycleLabel } from "@/lib/admissions";
import type { University } from "@/types/domain";
import { findDossier } from "@/data/core-admissions";
import { satComparison, ieltsComparison } from "@/lib/test-scores";
const unknown = "Not yet verified";
const rows: {
  label: string;
  value: (u: University) => string;
  section?: string;
  key?: (u: University) => string;
}[] = [
  { label: "Country", value: (u) => u.country, section: "THE BASICS" },
  {
    label: "Selected academic fields",
    value: (u) => u.programs.value?.join(", ") ?? unknown,
  },
  {
    label: "International aid",
    value: (u) =>
      u.internationalAid.value === null
        ? unknown
        : u.internationalAid.value
          ? "Eligible for need-based aid"
          : "Not available",
    section: "FUNDING POLICIES",
  },
  {
    label: "Need-based support",
    value: (u) =>
      u.meetsFullNeed.value === null
        ? unknown
        : u.meetsFullNeed.value
          ? "Meets institution-calculated need"
          : "No full-need commitment",
  },
  {
    label: "Merit scholarships",
    value: (u) =>
      u.meritAid.value === null
        ? unknown
        : u.meritAid.value
          ? "Available; conditions apply"
          : "No institutional merit aid",
  },
  {
    label: "Admission & financial need",
    value: (u) =>
      u.needBlind.value
        ? "Need-blind first-year review; individual conditions below"
        : u.needBlind.value === false
          ? "Need-aware"
          : unknown,
  },
  {
    label: "Aid scope and exceptions",
    value: (u) =>
      findDossier(u.id)?.funding.exceptions ?? u.needBlind.note ?? unknown,
  },
  {
    label: "Explicit full-tuition award",
    value: (u) =>
      u.fullTuition.value === null
        ? unknown
        : u.fullTuition.value
          ? "Available; verify individual award"
          : "None verified",
  },
  {
    label: "Explicit full-cost award",
    value: (u) =>
      u.fullCost.value === null
        ? unknown
        : u.fullCost.value
          ? "Available; verify individual award"
          : "None verified",
  },
  {
    label: "Annual cost baseline · check year and exclusions",
    value: (u) =>
      u.annualCost.value === null
        ? unknown
        : `${money(u.annualCost.value, u.costCurrency)} · ${u.annualCost.cycle}. ${u.annualCost.note ?? ""}`,
    section: "THE WHOLE COST",
  },
  {
    label: "Potential uncovered costs",
    value: () =>
      "Tuition, living, travel and personal costs depend on your individual award.",
  },
  {
    label: "SAT / ACT",
    value: (u) =>
      u.satPolicy.value === null
        ? unknown
        : {
            required: "SAT or ACT required",
            optional: "Test optional",
            "not-accepted": "Not considered",
            flexible: "Documented alternatives accepted",
          }[u.satPolicy.value],
    section: "APPLICATION REQUIREMENTS",
  },
  {
    label: "Testing conditions and reporting",
    value: (u) =>
      findDossier(u.id)?.testing.text ?? u.testPolicy.note ?? unknown,
  },
  {
    label: "English proficiency",
    value: (u) => u.englishPolicy.value ?? unknown,
  },
  {
    label: "SAT score benchmark · historical, not a cutoff",
    value: satComparison,
  },
  { label: "IELTS score guidance · check conditions", value: ieltsComparison },
  {
    label: "Admission deadline",
    value: (u) =>
      `${dateLabel(nextAdmissionDeadline(u)?.date ?? null)} · Fall 2027`,
  },
  {
    label: "Earliest confirmed aid deadline · review round",
    value: (u) =>
      `${dateLabel(u.aidDeadline.value)} · ${u.aidDeadline.cycle ?? "intake not specified"}`,
  },
  {
    label: "Financial aid forms",
    value: (u) =>
      `${u.aidForms.value ?? unknown}${u.aidForms.note ? ` — ${u.aidForms.note}` : ""}`,
  },
  {
    label: "Evidence last checked",
    value: (u) =>
      dateLabel(
        u.sources
          .map((s) => s.checkedAt)
          .sort()
          .at(-1) ?? null,
      ),
    section: "RESEARCH CONTEXT",
  },
  {
    label: "Cycle coverage",
    value: (u) =>
      `SAT: ${cycleLabel(u.satPolicy, u)}. Costs: ${cycleLabel(u.annualCost, u)}.`,
  },
];
export default function Compare() {
  const { state, update, ready } = useApp();
  const [differences, setDifferences] = useState(false);
  const [section, setSection] = useState("");
  const groupedRows = rows.map((row, index) => ({
    ...row,
    group:
      rows.slice(0, index + 1).findLast((r) => r.section)?.section ??
      "THE BASICS",
  }));
  const different = (row: (typeof rows)[number]) =>
    new Set(
      selected.map((u) =>
        (row.key?.(u) ?? row.value(u))
          .trim()
          .replace(/\s+/g, " ")
          .toLowerCase(),
      ),
    ).size > 1;
  const selected = state.compare.flatMap((id) => {
    const u = findUniversity(id);
    return u ? [u] : [];
  });
  return (
    <div className="page-container">
      <PageHeading
        eyebrow="SIDE BY SIDE / UP TO FOUR UNIVERSITIES"
        title="See the differences that matter."
        description="Put funding, requirements, and unknowns in perspective."
      />
      <div className="compare-toolbar">
        <label className="field-label">
          <span>
            <Plus size={15} />
            Add a university
          </span>
          <select
            aria-label="Add university to comparison"
            value=""
            disabled={state.compare.length >= 4 || !ready}
            onChange={(e) => {
              if (e.target.value)
                update((s) => toggleCompare(s, e.target.value));
            }}
          >
            <option value="">
              {state.compare.length >= 4
                ? "Four selected — remove one to replace"
                : "Choose a university…"}
            </option>
            {universities
              .filter((u) => !state.compare.includes(u.id))
              .map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
          </select>
        </label>
        <label className="check-label">
          <input
            type="checkbox"
            checked={differences}
            onChange={(e) => setDifferences(e.target.checked)}
          />
          Show differences only
        </label>
        <span>{selected.length} / 4 selected</span>
        <label className="field-label">
          Comparison section
          <select value={section} onChange={(e) => setSection(e.target.value)}>
            <option value="">All sections</option>
            {[...new Set(groupedRows.map((r) => r.group))].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
      </div>
      <PolicyNote />
      <p className="notice amber-notice">
        Cost baselines may cover different academic years, currencies and
        expenses. They are not directly equivalent or confirmed Fall 2027
        prices. No currency conversion is applied.
      </p>
      {!selected.length ? (
        <div className="empty-state">
          <h3>A clearer comparison starts with two.</h3>
          <p>
            Choose universities above, or add them as you explore. Your
            selections stay in this browser.
          </p>
          <Link href="/explore" className="button button-primary">
            Explore universities
            <ArrowUpRight size={16} />
          </Link>
        </div>
      ) : (
        <>
          <div
            className="compare-scroll"
            tabIndex={0}
            role="region"
            aria-label="University comparison table; scroll horizontally to see all columns"
          >
            <table className="compare-table">
              <thead>
                <tr>
                  <th scope="col">
                    <span className="eyebrow">
                      YOUR SHORTLIST,
                      <br />
                      IN PERSPECTIVE
                    </span>
                  </th>
                  {selected.map((u) => (
                    <th scope="col" key={u.id}>
                      <button
                        className="remove-compare"
                        aria-label={`Remove ${u.name} from comparison`}
                        onClick={() => update((s) => toggleCompare(s, u.id))}
                      >
                        <X size={15} />
                      </button>
                      <span
                        className="university-monogram"
                        style={{ color: u.color, background: `${u.color}10` }}
                      >
                        {u.initials}
                      </span>
                      <Link href={`/universities/${u.id}`}>
                        {u.name}
                        <ArrowUpRight size={14} />
                      </Link>
                      <select
                        aria-label={`Replace ${u.name}`}
                        value=""
                        onChange={(e) => {
                          if (e.target.value)
                            update((s) => ({
                              ...s,
                              compare: s.compare.map((id) =>
                                id === u.id ? e.target.value : id,
                              ),
                            }));
                        }}
                      >
                        <option value="">Replace university…</option>
                        {universities
                          .filter((x) => !state.compare.includes(x.id))
                          .map((x) => (
                            <option key={x.id} value={x.id}>
                              {x.name}
                            </option>
                          ))}
                      </select>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {groupedRows
                  .filter(
                    (row) =>
                      (!section || row.group === section) &&
                      (!differences || different(row)),
                  )
                  .map((row) => (
                    <tr
                      key={row.label}
                      className={different(row) ? "different-row" : ""}
                    >
                      <th scope="row">
                        {row.section && (
                          <span className="eyebrow">{row.section}</span>
                        )}
                        {row.label}
                      </th>
                      {selected.map((u) => (
                        <td key={u.id}>
                          {row.value(u).length > 200 ? (
                            <details>
                              <summary>{row.value(u).slice(0, 110)}…</summary>
                              <p>{row.value(u)}</p>
                              <Link href={`/universities/${u.id}#sources`}>
                                Sources and applicability →
                              </Link>
                            </details>
                          ) : (
                            row.value(u)
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row">Review official evidence</th>
                  {selected.map((u) => (
                    <td key={u.id}>
                      <Link
                        className="text-link"
                        href={`/universities/${u.id}#sources`}
                      >
                        View sources
                        <ArrowUpRight size={14} />
                      </Link>
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>
          {differences && selected.length < 2 && (
            <p className="notice">
              Add a second university to see differences.
            </p>
          )}
          <p className="section-footnote">
            Shaded rows indicate different values, not a ranking or
            recommendation.
          </p>
        </>
      )}
    </div>
  );
}
