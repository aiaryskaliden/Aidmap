"use client";
import Link from "next/link";
import { useApp } from "@/components/providers";
import type { AdmissionsDossier } from "@/types/admissions";
import { languageContext, scorePosition } from "@/lib/academic-context";
export function AcademicContext({
  dossier: d,
}: {
  dossier: AdmissionsDossier;
}) {
  const { state } = useApp();
  const p = state.profile;
  return (
    <div className="notice academic-context">
      <div>
        <h3>Your optional score context</h3>
        <p>
          {p?.sat != null && d.scores.satComposite
            ? `${scorePosition(p.sat, d.scores.satComposite)} the historical SAT composite middle 50%.`
            : "Add a SAT score in Preferences to compare it where an official composite range is available."}
        </p>
        <p>
          {p?.act != null && d.scores.actComposite
            ? `${scorePosition(p.act, d.scores.actComposite)} the historical ACT composite middle 50%.`
            : "ACT comparison is available when both your score and an official range are known."}
        </p>
        <p>
          This describes a past group of students, not your admission prospects
          or a recommendation to submit or withhold a score.
        </p>
        <p>{languageContext(d, p)}</p>
        <Link href="/profile">Edit private preferences →</Link>
      </div>
    </div>
  );
}
