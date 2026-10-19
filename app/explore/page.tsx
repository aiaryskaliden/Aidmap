import { Suspense } from "react";
import Explorer from "@/components/universities/explorer";
export const metadata = {
  title: "Explore universities",
  description:
    "Filter source-backed undergraduate universities by subject, location and international funding policy.",
};
export default function ExplorePage() {
  return (
    <Suspense
      fallback={
        <div className="page-container">Loading university explorer…</div>
      }
    >
      <Explorer />
    </Suspense>
  );
}
