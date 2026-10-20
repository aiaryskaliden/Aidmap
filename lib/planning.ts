import type { AdmissionDeadline, LocalState, University } from "@/types/domain";
import { verifiedDeadline } from "@/lib/admissions";
import { toggleSaved, updateSaved } from "@/lib/storage/state";
export function importOfficialDeadline(
  state: LocalState,
  u: University,
  d: AdmissionDeadline,
  intake: string,
  today: string,
) {
  if (!verifiedDeadline(u, d, intake) || !d.date || d.date < today)
    throw new Error(
      "Only an upcoming verified deadline for your intake can be added. Historical and yearless dates stay as references.",
    );
  const source = u.sources.find((s) =>
    (d.sourceIds ?? u.deadlines.sourceIds).includes(s.id),
  );
  if (!source) throw new Error("The deadline needs an official source.");
  const next = state.saved.some((s) => s.universityId === u.id)
    ? state
    : toggleSaved(state, u.id);
  return updateSaved(next, u.id, {
    deadline: d.date,
    deadlineSource: {
      url: source.url,
      cycle: intake,
      kind: d.kind,
      label: d.label,
    },
  });
}
