import "server-only";
import { discoveryRecords } from "./records";
import type { DiscoveryKind, DiscoveryRecord } from "./types";

export type LibraryPreview = Pick<DiscoveryRecord,
  "id" | "title" | "university" | "subject" | "situation" | "theme" | "summary" | "free"
>;

export function libraryPreviews(kind: DiscoveryKind): LibraryPreview[] {
  return discoveryRecords.filter((record) => record.kind === kind).map(
    ({ id, title, university, subject, situation, theme, summary, free }) =>
      ({ id, title, university, subject, situation, theme, summary, free }),
  );
}

export function findReading(kind: DiscoveryKind, id: string) {
  return discoveryRecords.find((record) => record.kind === kind && record.id === id);
}
