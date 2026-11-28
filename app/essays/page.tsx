import { LibraryIndex } from "@/components/discover/library-index";

export const metadata = { title: "Essay library" };

export default function EssaysPage() {
  return <LibraryIndex kind="essay" />;
}
