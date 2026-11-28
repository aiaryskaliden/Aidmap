import type { AdmissionsDossier } from "@/types/admissions";
import { researchLabels } from "@/types/admissions";
import { SourceDetails } from "./source-details";
export function ResearchEvidence({
  dossier,
  ids,
}: {
  dossier: AdmissionsDossier;
  ids: string[];
}) {
  const sources = dossier.sources.filter((s) => ids.includes(s.id));
  return <SourceDetails summary="Evidence & applicability" entries={sources.map((source) => ({
    ...source,
    details: [
      researchLabels[source.status] + " · " + (source.cycle ?? "Cycle not specified"),
      source.applicability,
      source.note ?? "",
    ],
  }))} />;
}
