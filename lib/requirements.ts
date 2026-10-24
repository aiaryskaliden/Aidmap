import type { AdmissionsDossier, Requirement } from "@/types/admissions";
import type { SavedUniversity } from "@/types/domain";

export const progressStates = [
  "Not started",
  "In progress",
  "Prepared",
  "Self-reported sent or completed",
] as const;
export type RequirementProgress = NonNullable<
  SavedUniversity["requirementProgress"]
>;
export function requirementsForRound(d: AdmissionsDossier, round: string) {
  return d.requirements.filter(
    (r) => !round || !r.rounds.length || r.rounds.includes(round),
  );
}
export function importRequirements(
  d: AdmissionsDossier,
  existing: RequirementProgress = {},
): RequirementProgress {
  const next = { ...existing };
  for (const r of d.requirements) next[r.id] ??= { status: "Not started" };
  return next;
}
export function requirementComplete(
  r: Requirement,
  progress?: RequirementProgress[string],
) {
  return (
    progress?.status === "Self-reported sent or completed" ||
    (r.level === "Conditional" &&
      progress?.status === "Not applicable" &&
      !!progress.reason?.trim())
  );
}
export function requirementSummary(
  requirements: Requirement[],
  progress: RequirementProgress = {},
) {
  const essential = requirements.filter(
    (r) => r.level === "Required" || r.level === "Conditional",
  );
  const pending = essential.filter(
    (r) => !requirementComplete(r, progress[r.id]),
  );
  return {
    total: essential.length,
    pending,
    complete: essential.length - pending.length,
  };
}
