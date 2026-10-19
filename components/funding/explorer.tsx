"use client";
import Link from "next/link";
import { useState } from "react";
import {
  Bookmark,
  ArrowUpRight,
  ShieldCheck,
  Search,
  ArrowRight,
} from "lucide-react";
import { opportunities, findUniversity } from "@/data/universities";
import { useApp } from "@/components/providers";
import { Button } from "@/components/ui/button";
import { PageHeading, PolicyNote, ExternalLink } from "@/components/ui/shared";
import { dateLabel } from "@/lib/utils";
export default function FundingExplorer() {
  const { state, update, ready } = useApp();
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("");
  const [type, setType] = useState("");
  const [onlySaved, setOnlySaved] = useState(false);
  const [eligibility, setEligibility] = useState("");
  const results = opportunities.filter(
    (o) =>
      (!query ||
        `${o.name} ${o.provider}`
          .toLowerCase()
          .includes(query.toLowerCase())) &&
      (!kind || o.kind === kind) &&
      (!type || o.fundingType === type) &&
      (!onlySaved || state.savedFunding.includes(o.id)) &&
      (!eligibility ||
        (eligibility === "international"
          ? !o.eligibilityUnknown
          : o.eligibilityUnknown)),
  );
  return (
    <div className="page-container">
      <PageHeading
        eyebrow="FUNDING / KNOW YOUR OPTIONS"
        title="Potential, with the fine print."
        description="Understand international funding policies before you build them into your plans."
      />
      <div className="funding-intro-grid">
        {[
          {
            n: "01",
            title: "Need-based aid",
            text: "Your institution assesses financial need. Your budget and its calculated contribution may differ.",
          },
          {
            n: "02",
            title: "Merit scholarships",
            text: "Competitive awards with specific criteria. Amounts, eligibility, and renewal conditions need checking.",
          },
          {
            n: "03",
            title: "Full tuition ≠ full cost",
            text: "A tuition award can leave housing, food, health insurance and travel for you to fund.",
          },
        ].map((x) => (
          <div className="funding-intro" key={x.n}>
            <span>{x.n}</span>
            <h3>{x.title}</h3>
            <p>{x.text}</p>
          </div>
        ))}
      </div>
      <div className="funding-filters">
        <div className="search-field">
          <Search size={17} />
          <input
            aria-label="Search funding"
            placeholder="Search aid programs or providers…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select
          aria-label="Opportunity kind"
          value={kind}
          onChange={(e) => setKind(e.target.value)}
        >
          <option value="">All opportunity types</option>
          <option>Institutional policy</option>
          <option>Competitive scholarship</option>
        </select>
        <select
          aria-label="Funding type"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="">All funding</option>
          <option>Need-based</option>
          <option>Merit</option>
        </select>
        <select
          aria-label="Funding eligibility"
          value={eligibility}
          onChange={(e) => setEligibility(e.target.value)}
        >
          <option value="">All eligibility statuses</option>
          <option value="international">
            International eligibility sourced
          </option>
          <option value="unknown">Eligibility unknown</option>
        </select>
        <label className="check-label">
          <input
            type="checkbox"
            checked={onlySaved}
            onChange={(e) => setOnlySaved(e.target.checked)}
          />
          Saved only
        </label>
      </div>
      <div className="section-heading compact-heading">
        <strong>{results.length} funding policies</strong>
        <span className="tiny-note">
          Undergraduate · United States · No verified competitive awards in this
          initial release
        </span>
      </div>
      <PolicyNote />
      {results.length ? (
        <div className="funding-grid">
          {results.map((o) => {
            const u = findUniversity(o.universityId)!;
            const saved = state.savedFunding.includes(o.id);
            return (
              <article className="funding-card" key={o.id}>
                <div className="funding-card-header">
                  <span
                    className="university-monogram"
                    style={{ color: u.color, background: `${u.color}10` }}
                  >
                    {u.initials}
                  </span>
                  <div>
                    <span className="eyebrow">{o.kind}</span>
                    <h3>{o.name}</h3>
                  </div>
                  <Button
                    size="icon"
                    disabled={!ready}
                    variant={saved ? "secondary" : "outline"}
                    aria-label={`${saved ? "Unsave" : "Save"} ${o.name}`}
                    aria-pressed={saved}
                    onClick={() =>
                      update((s) => ({
                        ...s,
                        savedFunding: saved
                          ? s.savedFunding.filter((id) => id !== o.id)
                          : [...s.savedFunding, o.id],
                      }))
                    }
                  >
                    <Bookmark
                      size={17}
                      fill={saved ? "currentColor" : "none"}
                    />
                  </Button>
                </div>
                <p className="funding-coverage">{o.coverage}</p>
                <div className="funding-facts">
                  <div>
                    <span>Eligibility</span>
                    <strong>
                      {o.eligibilityUnknown
                        ? "Not yet verified"
                        : "International undergraduate applicants"}
                    </strong>
                  </div>
                  <div>
                    <span>Individual amount</span>
                    <strong>Unknown until assessed</strong>
                  </div>
                  <div>
                    <span>RD financial aid deadline</span>
                    <strong>{dateLabel(o.deadline.value)}</strong>
                  </div>
                  <div>
                    <span>Renewal conditions / major restrictions</span>
                    <strong>Not yet verified</strong>
                  </div>
                </div>
                <details>
                  <summary>Application process & conditions</summary>
                  <p>{o.separateApplication || "Not yet verified"}</p>
                  <p>{u.aidForms.note}</p>
                  <p>{o.deadline.note}</p>
                </details>
                <div className="funding-card-footer">
                  <ExternalLink href={o.source.url}>
                    <ShieldCheck size={14} />
                    Official eligibility
                  </ExternalLink>
                  <Link
                    className="text-link"
                    href={`/universities/${u.id}#financial-aid`}
                  >
                    View details
                    <ArrowUpRight size={15} />
                  </Link>
                </div>
                <small>
                  Policy checked {dateLabel(o.source.checkedAt)} ·{" "}
                  {o.source.cycle || "General policy; recheck for Fall 2027"}
                </small>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <h3>No sourced opportunities match these filters.</h3>
          <p>
            This initial collection focuses on university need-based policies.
            We won’t fill gaps with unverified scholarship listings.
          </p>
          <Button
            onClick={() => {
              setQuery("");
              setKind("");
              setType("");
              setOnlySaved(false);
              setEligibility("");
            }}
          >
            Clear filters
            <ArrowRight size={16} />
          </Button>
        </div>
      )}
      <div className="bottom-callout">
        <div>
          <h3>A policy is only one part of the picture.</h3>
          <p>Model annual costs and see which expenses could remain.</p>
        </div>
        <Link className="button button-primary" href="/calculator">
          Open funding calculator
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
