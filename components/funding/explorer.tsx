"use client";
import { useState } from "react";
import Link from "next/link";
import { useURLFilters } from "@/lib/url-filters";
import { countLabel } from "@/lib/format";
import {
  Bookmark,
  ArrowUpRight,
  ShieldCheck,
  Search,
  MessageCircle,
  ArrowRight,
} from "lucide-react";
import { opportunities, findUniversity } from "@/data/universities";
import { useApp } from "@/components/providers";
import { Button } from "@/components/ui/button";
import { PageHeading, PolicyNote, ExternalLink } from "@/components/ui/shared";
import { dateLabel, money } from "@/lib/utils";
import { Help } from "@/components/ui/help";
import { UniversityMark } from "@/components/universities/university-mark";
const countries = [...new Set(opportunities.flatMap((award) => {
  const university = findUniversity(award.universityId);
  return university ? [university.country] : [];
}))].sort();

export default function FundingExplorer() {
  const { state, update, ready } = useApp();
  const { params, set, reset } = useURLFilters();
  const query = params.get("q") ?? "",
    kind = params.get("kind") ?? "",
    type = params.get("type") ?? "",
    country = params.get("country") ?? "",
    onlySaved = params.get("saved") === "1",
    eligibility = params.get("eligibility") ?? "";
  const setQuery = (v: string) => set("q", v),
    setKind = (v: string) => set("kind", v),
    setType = (v: string) => set("type", v),
    setOnlySaved = (v: boolean) => set("saved", v ? "1" : ""),
    setEligibility = (v: string) => set("eligibility", v);
  const search = params.toString();
  const [page, setPage] = useState({ search, limit: 12 });
  const limit = page.search === search ? page.limit : 12;
  const results = opportunities.filter(
    (o) =>
      (!query.trim() ||
        `${o.name} ${o.provider} ${findUniversity(o.universityId)?.name ?? ""}`
          .toLowerCase()
          .includes(query.trim().toLowerCase())) &&
      (!country || findUniversity(o.universityId)?.country === country) &&
      (!kind || o.kind === kind) &&
      (!type || o.fundingType === type) &&
      (!onlySaved || state.savedFunding.includes(o.id)) &&
      (!eligibility ||
        (eligibility === "international"
          ? !o.eligibilityUnknown
          : o.eligibilityUnknown)),
  );
  return (
    <div className="page-container funding-page">
      <PageHeading
        eyebrow=""
        title="Scholarships and financial aid"
        description="Search undergraduate awards, check coverage and save options."
      >
        <Button asChild variant="outline" size="sm">
          <Link prefetch={false} href="/advisor?question=Which%20universities%20offer%20full%20tuition%20scholarships%20to%20international%20students%3F">
            <MessageCircle size={16} /> Ask Maple about funding
          </Link>
        </Button>
      </PageHeading>
      <div className="funding-filters">
        <div className="search-field">
          <Search size={17} />
          <input
            aria-label="Search funding"
            disabled={!ready}
            placeholder="Search by award or university…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select aria-label="Funding country" disabled={!ready} value={country} onChange={(e) => set("country", e.target.value)}>
          <option value="">All countries</option>
          {countries.map((name) => <option key={name}>{name}</option>)}
        </select>
        <select
          aria-label="Opportunity kind"
          disabled={!ready}
          value={kind}
          onChange={(e) => setKind(e.target.value)}
        >
          <option value="">All opportunity types</option>
          <option>Institutional policy</option>
          <option>Competitive scholarship</option>
          <option>Government scholarship</option>
          <option>Fee reduction</option>
        </select>
        <select
          aria-label="Funding type"
          disabled={!ready}
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="">All funding</option>
          <option>Need-based</option>
          <option>Merit</option>
          <option>Government</option>
          <option>Fee reduction</option>
        </select>
        <select
          aria-label="Funding eligibility"
          disabled={!ready}
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
            disabled={!ready}
            checked={onlySaved}
            onChange={(e) => setOnlySaved(e.target.checked)}
          />
          Saved only
        </label>
      </div>
      <div className="section-heading compact-heading">
        <strong>{countLabel(results.length, "funding option")}</strong>
        <button className="text-link" onClick={reset}>
          Reset funding filters
        </button>
        <span className="tiny-note">
          Undergraduate · Check citizenship, program and academic-year
          conditions
        </span>
      </div>
      {results.length ? (
        <div className="funding-grid">
          {results.slice(0, limit).map((o) => {
            const u = findUniversity(o.universityId)!;
            const saved = state.savedFunding.includes(o.id);
            return (
              <article className="funding-card" key={o.id}>
                <div className="funding-card-header">
                  <UniversityMark university={u} />
                  <div>
                    <span className="eyebrow">{o.kind}</span>
                    <h3>{o.name}</h3>
                    <small>{u.name}</small>
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
                        ? "Check citizenship / applicant conditions below"
                        : o.eligibleCitizenships?.join(", ")}
                    </strong>
                  </div>
                  <div>
                    <span>
                      {o.amount === null
                        ? "Individual amount"
                        : "Documented award / maximum"}
                    </span>
                    <strong>
                      {o.amount === null
                        ? "Unknown until assessed"
                        : `${money(o.amount, o.currency)} · conditions apply`}
                    </strong>
                  </div>
                  <div>
                    <span>
                      Funding deadline ·{" "}
                      {o.deadline.cycle ?? "intake not verified"}
                    </span>
                    <strong>{dateLabel(o.deadline.value)}</strong>
                    {o.deadline.value && o.deadline.cycle !== "Fall 2027" && (
                      <small>
                        Previous-cycle reference; not an upcoming deadline
                      </small>
                    )}
                  </div>
                </div>
                <details>
                  <summary>Application process & conditions</summary>
                  <p className="award-conditions">{o.source.note}</p>
                  <p>{o.separateApplication || "Not yet verified"}</p>
                  <p>{u.aidForms.note}</p>
                  <p>{o.deadline.note}</p>
                  <p><strong>Renewal</strong> · {o.renewal ?? "Not yet verified"}</p>
                  <ExternalLink href={o.source.url}>
                    <ShieldCheck size={14} />
                    Official eligibility
                  </ExternalLink>
                </details>
                <div className="funding-card-footer">
                  <Link prefetch={false}
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
            Try a broader funding type or remove the saved-only filter.
            Restricted citizenship and program conditions still apply.
          </p>
          <Button onClick={reset}>
            Clear filters
            <ArrowRight size={16} />
          </Button>
        </div>
      )}
      {results.length > limit && (
        <Button onClick={() => setPage({ search, limit: limit + 12 })}>
          Show {Math.min(12, results.length - limit)} more funding options
        </Button>
      )}
      <details className="catalogue-note">
        <summary>Funding terms</summary>
        <Help term="fullNeed" />
        <Help term="priority" />
        <PolicyNote />
      </details>
      <div className="bottom-callout">
        <div>
          <h3>Estimate the costs an award leaves uncovered</h3>
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
