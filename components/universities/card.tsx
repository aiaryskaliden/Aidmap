"use client";
import Link from "next/link";
import { ArrowUpRight, ChevronDown, MapPin } from "lucide-react";
import { useState } from "react";
import type { University } from "@/types/domain";
import { UniversityActions } from "./actions";
import { dateLabel, money } from "@/lib/utils";
import { nextAdmissionDeadline } from "@/lib/admissions";
import { TestScores } from "./test-scores";
import { opportunities } from "@/data/universities";
import { matchUniversity } from "@/lib/matching/match";
import { useApp } from "@/components/providers";
import { AdmissionRateStat } from "./admission-rate";
import { UniversityMark } from "./university-mark";
import { getAdmissionRate } from "@/lib/admission-rates";
import { ApplicationWorkspaceLink } from "./application-workspace-link";

const fundedUniversities = new Set(opportunities.map((o) => o.universityId));
const satLabels = {
  required: "SAT / ACT required",
  optional: "Test optional",
  "not-accepted": "SAT / ACT not considered",
  flexible: "Testing alternatives",
} as const;

function UniversityListRow({
  u,
  unknownFilters,
}: {
  u: University;
  unknownFilters: string[];
}) {
  const [expanded, setExpanded] = useState(false);
  const profile = `/universities/${u.id}`;
  const fields = u.programs.value ?? [];
  const deadline = nextAdmissionDeadline(u)?.date;
  const rate = getAdmissionRate(u.id);
  const annual = u.costs.tuition === null;
  const price = u.costs.tuition ?? u.annualCost.value;
  const priceCycle = annual ? u.annualCost.cycle : u.costCycle;
  const funding =
    u.meetsFullNeed.value === true
      ? "Meets full demonstrated need"
      : u.internationalAid.value === true
        ? "International need-based aid"
        : fundedUniversities.has(u.id)
          ? "Scholarships and fee support"
          : null;
  const tests = u.satPolicy.value ? satLabels[u.satPolicy.value] : undefined;

  return (
    <article className="university-card catalogue-row">
      <UniversityMark university={u} />
      <div className="catalogue-name">
        <h3>
          <Link
            prefetch={false}
            href={profile}
            aria-label={`View ${u.name} profile`}
          >
            {u.name}
          </Link>
        </h3>
        <p>{[u.city, u.country].filter(Boolean).join(" · ")}</p>
      </div>
      {rate ? (
        <AdmissionRateStat id={u.id} />
      ) : (
        <div className="catalogue-stat catalogue-admission">
          <strong>
            {tests ??
              (fields.length ? `${fields.length} subject areas` : u.type)}
          </strong>
          <span>
            {tests
              ? (u.satPolicy.scope?.program ?? "SAT / ACT policy")
              : "Undergraduate"}
          </span>
        </div>
      )}
      <div className="catalogue-stat catalogue-tuition">
        {price !== null ? (
          <>
            <strong>{money(price, u.costCurrency)}</strong>
            <span>
              {annual ? "Annual cost" : "Tuition"}
              {priceCycle ? ` · ${priceCycle}` : ""}
            </span>
          </>
        ) : (
          <Link prefetch={false} href={profile + "#estimated-cost"}>
            Tuition details <ArrowUpRight size={12} />
          </Link>
        )}
      </div>
      <div className="catalogue-actions">
        <ApplicationWorkspaceLink id={u.id} compact />
        <UniversityActions id={u.id} compact iconCompare />
        <button
          className="catalogue-expand"
          type="button"
          aria-label={`Details for ${u.name}`}
          aria-expanded={expanded}
          aria-controls={`catalogue-details-${u.id}`}
          onClick={() => setExpanded(!expanded)}
        >
          <ChevronDown size={16} />
        </button>
      </div>
      {unknownFilters.length > 0 && (
        <p className="unknown-match">Pending: {unknownFilters.join(", ")}</p>
      )}
      <div
        hidden={!expanded}
        className="catalogue-details"
        id={`catalogue-details-${u.id}`}
      >
        <dl>
          {fields.length > 0 && (
            <div>
              <dt>Subjects</dt>
              <dd>{fields.join(" · ")}</dd>
            </div>
          )}
          {funding && (
            <div>
              <dt>Funding</dt>
              <dd>{funding}</dd>
            </div>
          )}
          {tests && rate && (
            <div>
              <dt>Testing</dt>
              <dd>
                {tests}
                {u.satPolicy.scope ? ` · ${u.satPolicy.scope.program}` : ""}
              </dd>
            </div>
          )}
          {deadline && (
            <div>
              <dt>Next admission deadline</dt>
              <dd>{dateLabel(deadline)}</dd>
            </div>
          )}
        </dl>
        <Link prefetch={false} href={profile}>
          Requirements and sources <ArrowUpRight size={13} />
        </Link>
      </div>
    </article>
  );
}
export function UniversityCard({
  university: u,
  compact = false,
  unknownFilters = [],
}: {
  university: University;
  compact?: boolean;
  unknownFilters?: string[];
}) {
  const { state } = useApp();
  if (compact) {
    return <UniversityListRow u={u} unknownFilters={unknownFilters} />;
  }
  const match = matchUniversity(u, state.profile).find(
    (r) => r.category === "Academic interest match",
  );
  return (
    <article className="university-card">
      <div className="card-top">
        <UniversityMark university={u} />
        <span className="tag neutral">{u.type}</span>
      </div>
      <div className="card-identity">
        <h3>
          <Link prefetch={false} href={`/universities/${u.id}`}>
            {u.name}
          </Link>
        </h3>
        <p className="location">
          <MapPin size={13} />
          {u.city} · {u.country}
        </p>
      </div>
      <div className="subject-tags">
        {(u.programs.value ?? []).slice(0, 3).map((p) => (
          <span key={p}>{p}</span>
        ))}
        {!u.programs.value && <span>Subjects not yet verified</span>}
      </div>
      <AdmissionRateStat id={u.id} />
      <div className="card-aid">
        <span className="card-label">INTERNATIONAL FUNDING</span>
        <p>
          {u.internationalAid.value === true
            ? "Need-based financial aid"
            : fundedUniversities.has(u.id)
              ? "Scholarships / fee support"
              : u.meritAid.value
                ? "Merit scholarships"
                : "—"}
        </p>
        <span>
          {u.meetsFullNeed.value ? "Meets full demonstrated need" : ""}
        </span>
      </div>
      <TestScores university={u} compact />
      {u.englishTests.scope && (
        <p className="card-policy-note">
          English evidence: {u.englishTests.scope.program} only (
          {u.englishTests.scope.purpose}).
        </p>
      )}
      <div className="card-deadline">
        <span>Fall 2027 application deadline</span>
        <strong>{dateLabel(nextAdmissionDeadline(u)?.date ?? null)}</strong>
      </div>
      {unknownFilters.length > 0 && (
        <p className="unknown-match">
          Needs verification: {unknownFilters.join(", ")}. This is not a
          confirmed match.
        </p>
      )}
      {match && (
        <p className="match-hint">
          {match.category}: {state.profile?.major}
        </p>
      )}
      <div className="card-footer">
        <UniversityActions id={u.id} compact />
        <ApplicationWorkspaceLink id={u.id} compact />
        <Link
          prefetch={false}
          className="profile-link"
          href={`/universities/${u.id}`}
          aria-label={`View ${u.name} profile`}
        >
          <span>View profile</span>
          <ArrowUpRight size={16} />
        </Link>
      </div>
    </article>
  );
}
