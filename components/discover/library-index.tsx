import { getMembership } from "@/lib/billing/membership";
import { libraryPreviews } from "@/lib/discovery/catalogue";
import type { DiscoveryKind } from "@/lib/discovery/types";
import { Library } from "./library";

export async function LibraryIndex({ kind }: { kind: DiscoveryKind }) {
  const membership = await getMembership();
  return <Library kind={kind} entries={libraryPreviews(kind)} pro={membership.plan === "pro"} />;
}
