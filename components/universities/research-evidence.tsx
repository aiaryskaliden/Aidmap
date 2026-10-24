import type { AdmissionsDossier } from "@/types/admissions";
import { researchLabels } from "@/types/admissions";
export function ResearchEvidence({
  dossier,
  ids,
}: {
  dossier: AdmissionsDossier;
  ids: string[];
}) {
  const sources = dossier.sources.filter((s) => ids.includes(s.id));
  return (
    <details className="research-evidence">
      <summary>Evidence & applicability ({sources.length})</summary>
      {sources.map((s) => (
        <div key={s.id}>
          <a href={s.url} target="_blank" rel="noopener noreferrer">
            {s.title} ↗
          </a>
          <p>
            {researchLabels[s.status]} · {s.cycle ?? "Cycle not specified"} ·
            checked {s.checkedAt}
          </p>
          <p>
            {s.applicability}
            {s.note ? ` ${s.note}` : ""}
          </p>
        </div>
      ))}
    </details>
  );
}
