import { Suspense } from "react";
import Calculator from "@/components/funding/calculator";
export const metadata = {
  title: "Funding Gap Calculator",
  description:
    "Understand your whole annual cost, confirmed funding and hypothetical scenarios without treating aid eligibility as an award.",
};
export default function CalculatorPage() {
  return (
    <Suspense
      fallback={<div className="page-container">Loading calculator…</div>}
    >
      <Calculator />
    </Suspense>
  );
}
