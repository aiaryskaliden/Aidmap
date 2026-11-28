import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function AIAdvisor({ universityId }: { universityId?: string }) {
  const href = universityId
    ? "/advisor?university=" + encodeURIComponent(universityId)
    : "/advisor";
  return (
    <section id="ai-advisor" className="panel">
      <h2>Admissions Advisor</h2>
      <p>
        Compare universities and plan your application using official admissions
        and financial aid sources.
      </p>
      <Link className="text-link" href={href}>
        Open Advisor <ArrowUpRight size={15} />
      </Link>
    </section>
  );
}
