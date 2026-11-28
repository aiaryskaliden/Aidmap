import { ArrowUpRight, ChevronDown } from "lucide-react";
import {
  formatAdmissionCycle,
  formatAdmissionRate,
  getAdmissionRate,
} from "@/lib/admission-rates";
import { dateLabel } from "@/lib/utils";

export function AdmissionRateStat({
  id,
  profile = false,
}: {
  id: string;
  profile?: boolean;
}) {
  const rate = getAdmissionRate(id);
  if (!rate) return null;
  return (
    <div className={profile ? "admit-stat admit-stat-profile" : "admit-stat"}>
      <span>
        {rate?.metric === "offer"
          ? "Offer rate"
          : rate?.scope === "undergraduate · all entry years"
            ? "Undergrad admit rate"
            : "Acceptance rate"}
      </span>
      <strong>{rate ? formatAdmissionRate(rate) : "—"}</strong>
      {rate && <small>{formatAdmissionCycle(rate)}</small>}
      {profile && rate && (
        <details>
          <summary>
            Source <ChevronDown size={13} aria-hidden />
          </summary>
          <p>
            {rate.scopeNote ||
              (rate.scope.endsWith("application records")
                ? "First-year application records."
                : "All first-year applicants.")}
            {rate.kind === "counts" &&
              ` ${rate.admitted.toLocaleString("en")} ${rate.metric === "offer" ? "offers" : "admitted"} from ${rate.applicants.toLocaleString("en")} ${rate.scope.endsWith("application records") ? "applications" : "applicants"}.`}
            {rate.stage === "decision-release" &&
              " At decision release, before later waitlist offers."}
          </p>
          <p>Checked {dateLabel(rate.checkedAt)}</p>
          <a href={rate.sourceUrl} target="_blank" rel="noreferrer">
            {rate.sourceTitle} <ArrowUpRight size={13} aria-hidden />
          </a>
        </details>
      )}
    </div>
  );
}
