import { fieldStatus } from "@/lib/admissions";
import type { AdmissionsDossier } from "@/types/admissions";
import type { EvidenceSource, Fact, University } from "@/types/domain";

type SourceLink = Pick<EvidenceSource, "title" | "url" | "cycle">;

export type ApplicationDocument = {
  id: string;
  label: string;
  level: "Required" | "Recommended" | "Optional" | "Conditional";
  condition: string | null;
  owner?: string;
  submission?: string;
  rounds?: string[];
  source: SourceLink;
};

export function officialSource(school: University, ids: string[]) {
  return school.sources.find(
    (source) => ids.includes(source.id) && source.status === "verified",
  );
}

function usablePolicy(
  school: University,
  field: Fact<unknown>,
  intake: string,
) {
  const year = field.cycle?.match(/\b20\d{2}\b/)?.[0];
  return (
    (!year || intake.endsWith(year)) &&
    ["verified_current", "official_general"].includes(
      fieldStatus(field, school, intake),
    )
  );
}

export function applicationDocuments(
  school: University,
  dossier: AdmissionsDossier | undefined,
  intake: string,
): ApplicationDocument[] {
  const year = intake.slice(-4);
  if (dossier) {
    return dossier.requirements.flatMap((doc) => {
      if (doc.stage !== "admission" || doc.level === "Optional") return [];
      const sources = dossier.sources.filter((source) =>
        doc.sourceIds.includes(source.id),
      );
      if (
        !sources.length ||
        sources.some((source) => {
          const scopeYear = source.cycle?.match(/\b20\d{2}\b/)?.[0];
          return (
            !["target-cycle", "general-policy"].includes(source.status) ||
            (scopeYear && scopeYear !== year)
          );
        })
      )
        return [];
      return [{ ...doc, source: sources[0] }];
    });
  }

  const field = school.requirements;
  const source = officialSource(school, field.sourceIds);
  if (!source || !usablePolicy(school, field, intake)) return [];
  return (field.value ?? [])
    .filter((doc) => doc.status !== "Optional")
    .map((doc) => ({
      id: `pro-document:${doc.label}`,
      label: doc.label,
      level: doc.status,
      condition: [doc.condition, field.scope?.program]
        .filter(Boolean)
        .join(" · "),
      source,
    }));
}

export function officialEssaySource(
  school: University,
  dossier?: AdmissionsDossier,
) {
  const writing =
    /\b(essay|essays|writing|personal statement|short answer|supplement)\b/i;
  const doc = dossier?.requirements.find(
    (item) => item.stage === "admission" && writing.test(item.label),
  );
  return (
    (doc && officialSource(school, doc.sourceIds)) ??
    (school.requirements.value?.some((item) => writing.test(item.label))
      ? officialSource(school, school.requirements.sourceIds)
      : undefined) ??
    officialSource(school, [
      ...school.applicationPlatform.sourceIds,
      ...school.admissionEligibility.sourceIds,
    ])
  );
}

export function admissionsSource(school: University) {
  return officialSource(school, [
    ...school.applicationPlatform.sourceIds,
    ...school.admissionEligibility.sourceIds,
    ...school.requirements.sourceIds,
  ]);
}
