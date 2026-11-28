import type { Metadata } from "next";
import { MyList } from "@/components/studio/my-list";
import { profileSchools } from "@/lib/studio/profile-schools";

export const metadata: Metadata = {
  title: "My List",
  description:
    "Organise your saved universities and review published admission figures and profile checks.",
};

export default function MyListPage() {
  return <MyList schools={profileSchools} />;
}
