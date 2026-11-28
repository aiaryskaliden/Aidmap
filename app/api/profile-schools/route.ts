import { profileSchools } from "@/lib/studio/profile-schools";

// Public catalogue only. The profile and saved IDs stay in browser storage.
export const dynamic = "force-static";

export function GET() {
  return Response.json(profileSchools);
}
