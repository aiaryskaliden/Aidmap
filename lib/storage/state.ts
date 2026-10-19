import {
  storageSchema,
  type LocalState,
  type SavedUniversity,
} from "@/types/domain";
export const STORAGE_KEY = "aidmap:v1";
export const emptyState = (): LocalState => ({
  version: 1,
  profile: null,
  saved: [],
  compare: [],
  scenarios: [],
  savedFunding: [],
  theme: "light",
});
export function parseStoredData(raw: string | null): {
  state: LocalState;
  error: string | null;
} {
  if (!raw) return { state: emptyState(), error: null };
  try {
    return { state: storageSchema.parse(JSON.parse(raw)), error: null };
  } catch {
    return {
      state: emptyState(),
      error:
        "Saved data could not be read. Your original data has been kept; export it before resetting or importing a valid backup.",
    };
  }
}
export function toggleSaved(
  state: LocalState,
  universityId: string,
): LocalState {
  return {
    ...state,
    saved: state.saved.some((u) => u.universityId === universityId)
      ? state.saved.filter((u) => u.universityId !== universityId)
      : [
          ...state.saved,
          {
            universityId,
            status: "Interested",
            deadline: null,
            notes: "",
            applicationType: "",
            tasks: [],
          },
        ],
  };
}
export function toggleCompare(
  state: LocalState,
  universityId: string,
): LocalState {
  if (state.compare.includes(universityId))
    return {
      ...state,
      compare: state.compare.filter((id) => id !== universityId),
    };
  if (state.compare.length >= 4)
    throw new Error(
      "Compare up to four universities. Remove one to add another.",
    );
  return { ...state, compare: [...state.compare, universityId] };
}
export function updateSaved(
  state: LocalState,
  universityId: string,
  update: Partial<Omit<SavedUniversity, "universityId">>,
): LocalState {
  return storageSchema.parse({
    ...state,
    saved: state.saved.map((u) =>
      u.universityId === universityId ? { ...u, ...update } : u,
    ),
  });
}
export function shortlistCSV(
  rows: {
    name: string;
    country: string;
    status: string;
    deadline: string | null;
  }[],
) {
  const cell = (v: string) =>
    '"' + (/^[=+@\-\t\r]/.test(v) ? "'" : "") + v.replaceAll('"', '""') + '"';
  return [
    ["University", "Country", "Status", "Custom deadline"],
    ...rows.map((r) => [r.name, r.country, r.status, r.deadline ?? ""]),
  ]
    .map((r) => r.map(cell).join(","))
    .join("\r\n");
}
