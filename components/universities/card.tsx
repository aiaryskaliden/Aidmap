"use client";
import Link from "next/link";
import { ArrowUpRight, MapPin, ShieldCheck, CircleHelp } from "lucide-react";
import type { University } from "@/types/domain";
import { UniversityActions } from "./actions";
import { dateLabel } from "@/lib/utils";
import { matchUniversity } from "@/lib/matching/match";
import { useApp } from "@/components/providers";
export function UniversityCard({
  university: u,
  compact = false,
}: {
  university: University;
  compact?: boolean;
}) {
  const { state } = useApp();
  const match = matchUniversity(u, state.profile).find(
    (r) => r.category === "Academic interest match",
  );
  return (
    <article className={`university-card ${compact ? "compact-card" : ""}`}>
      <div className="card-top">
        <span
          className="university-monogram"
          style={{ color: u.color, background: `${u.color}10` }}
        >
          {u.initials}
        </span>
        <span className="tag neutral">{u.type}</span>
      </div>
      <div className="card-identity">
        <h3>
          <Link href={`/universities/${u.id}`}>{u.name}</Link>
        </h3>
        <p className="location">
          <MapPin size={13} />
          {u.city}, {u.state} · USA
        </p>
      </div>
      <div className="subject-tags">
        {(u.programs.value ?? []).slice(0, 3).map((p) => (
          <span key={p}>{p}</span>
        ))}
        {!u.programs.value && <span>Subjects not yet verified</span>}
      </div>
      <div className="card-aid">
        <span className="card-label">INTERNATIONAL FUNDING</span>
        <p>
          {u.internationalAid.value === true
            ? "Need-based financial aid"
            : "Not yet verified"}
        </p>
        <span>
          {u.meetsFullNeed.value
            ? "Meets full demonstrated need"
            : "Coverage needs verification"}
        </span>
      </div>
      <div className="card-deadline">
        <span>Fall 2027 application deadline</span>
        <strong>{dateLabel(u.admissionDeadline.value)}</strong>
      </div>
      {match && (
        <p className="match-hint">
          {match.category}: {state.profile?.major}
        </p>
      )}
      <div className="card-verification">
        {u.internationalAid.value !== null ? (
          <>
            <ShieldCheck size={14} />
            <Link href={`/universities/${u.id}#sources`}>
              Aid policy sourced
            </Link>
          </>
        ) : (
          <>
            <CircleHelp size={14} />
            Policy not verified
          </>
        )}
        <span>Individual award unknown</span>
      </div>
      <div className="card-footer">
        <UniversityActions id={u.id} compact />
        <Link
          className="profile-link"
          href={`/universities/${u.id}`}
          aria-label={`View ${u.name} profile`}
        >
          View profile
          <ArrowUpRight size={16} />
        </Link>
      </div>
    </article>
  );
}
