"use client";
import { useRef, useState, useSyncExternalStore } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search,
  SlidersHorizontal,
  LayoutGrid,
  List,
  X,
  ArrowRight,
  Columns3,
} from "lucide-react";
import { universities, academicFields } from "@/data/universities";
import {
  discoverUniversities,
  selectedValues,
  type Filters,
} from "@/lib/search";
import { PageHeading, PolicyNote } from "@/components/ui/shared";
import { Help } from "@/components/ui/help";
import { UniversityCard } from "./card";
import { Button } from "@/components/ui/button";
import { useApp } from "@/components/providers";
const aidOptions = [
  ["international", "International need-based aid"],
  ["need", "Meets full demonstrated need"],
  ["merit", "Merit scholarships"],
  ["tuition", "Explicit full tuition award"],
  ["full-cost", "Explicit full cost award"],
  ["unknown", "Funding not yet verified"],
];
const testOptions = [
  ["required", "Required (SAT or ACT)"],
  ["optional", "Optional"],
  ["not-accepted", "Not considered"],
  ["flexible", "Other testing alternatives"],
  ["unknown", "Not yet verified"],
];
const labels: Record<string, string> = {
  q: "Search",
  region: "Region",
  country: "Country",
  major: "Subject",
  aid: "Funding",
  intake: "Intake",
  test: "SAT",
  act: "ACT",
  english: "English evidence",
  plan: "Round",
  from: "From",
  deadline: "By",
  waiver: "Fee waiver",
  cost: "Cost ceiling",
  currency: "Currency",
  quality: "Verification",
  type: "Institution",
  minimum: "Published minimum",
  includeUnknown: "Include unknowns",
  platform: "Platform",
  citizenship: "Citizenship",
};
function subscribeToFilters(listener: () => void) {
  window.addEventListener("popstate", listener);
  window.addEventListener("aidmap:filters", listener);
  return () => {
    window.removeEventListener("popstate", listener);
    window.removeEventListener("aidmap:filters", listener);
  };
}
const getFilterSnapshot = () => window.location.search;
function FiltersPanel({
  filters,
  setFilter,
  reset,
}: {
  filters: Filters;
  setFilter: (key: string, value: string) => void;
  reset: () => void;
}) {
  function select(key: string, label: string, options: string[] | string[][]) {
    return (
      <label className="field-label">
        {label}
        <select
          aria-label={label}
          value={filters[key] || ""}
          onChange={(e) => setFilter(key, e.target.value)}
        >
          <option value="">Any {label.toLowerCase()}</option>
          {options.map((o) => (
            <option
              key={typeof o === "string" ? o : o[0]}
              value={typeof o === "string" ? o : o[0]}
            >
              {typeof o === "string" ? o : o[1]}
            </option>
          ))}
        </select>
      </label>
    );
  }
  function checks(key: string, label: string, options: string[][]) {
    return (
      <fieldset className="filter-options">
        <legend>{label}</legend>
        {options.map(([value, text]) => (
          <label className="check-label" key={value}>
            <input
              type="checkbox"
              checked={selectedValues(filters[key]).includes(value)}
              onChange={() => {
                const values = selectedValues(filters[key]);
                setFilter(
                  key,
                  (values.includes(value)
                    ? values.filter((x) => x !== value)
                    : [...values, value]
                  ).join("|"),
                );
              }}
            />
            {text}
          </label>
        ))}
      </fieldset>
    );
  }
  return (
    <>
      <div className="filter-title">
        <strong>Refine your search</strong>
        <button onClick={reset}>Reset all</button>
      </div>
      <p className="tiny-note">
        Choose any options within a group (OR). Different groups must all match
        (AND). Unknown requirements can be included below.
      </p>
      <div className="filter-group">
        <h3>Quick filters</h3>
        <p>Bachelor’s / undergraduate only</p>
        {select(
          "country",
          "Country",
          [...new Set(universities.map((u) => u.country))].sort(),
        )}
        {select("major", "Subject", academicFields)}
        {select("intake", "Application intake", ["Fall 2027", "Fall 2028"])}
        {checks("aid", "Funding type", aidOptions)}
        <Help term="fullNeed" />
      </div>
      <details className="filter-group">
        <summary>Testing & English requirements</summary>
        {checks("test", "SAT policy", testOptions)}
        <Help term="testing" />
        {checks("act", "ACT policy", testOptions)}
        {checks("english", "Accepted English evidence", [
          ["IELTS", "IELTS accepted"],
          ["TOEFL", "TOEFL accepted"],
          ["Duolingo", "Duolingo accepted"],
          ["waiver", "Exemption possible"],
          ["unknown", "Not yet verified"],
        ])}
        <Help term="english" />
        {select("minimum", "Published minimum score", [
          "IELTS",
          "TOEFL",
          "Duolingo",
        ])}
        <p className="tiny-note">
          This finds published minimums, not admissions cutoffs. Read program,
          test-version and exemption conditions on each profile.
        </p>
      </details>
      <details className="filter-group">
        <summary>Application & deadlines</summary>
        {checks(
          "plan",
          "Application round",
          [
            "Early Action",
            "Early Decision",
            "Regular Decision",
            "Rolling Admission",
          ].map((v) => [v, v]),
        )}
        <Help term="rounds" />
        {select("waiver", "Application fee waiver", [
          ["yes", "Available with conditions"],
        ])}
        {select("platform", "Application platform", [
          "Common App",
          "Coalition",
          "Institutional portal",
        ])}
        <label className="field-label">
          Deadline from
          <input
            type="date"
            value={filters.from || ""}
            onChange={(e) => setFilter("from", e.target.value)}
          />
        </label>
        <label className="field-label">
          Deadline by
          <input
            type="date"
            value={filters.deadline || ""}
            onChange={(e) => setFilter("deadline", e.target.value)}
          />
        </label>
        <p className="tiny-note">
          Only admission dates verified for the selected intake qualify.
          Historical, yearless and financial aid dates are excluded.
        </p>
      </details>
      <details className="filter-group">
        <summary>Location, costs & source coverage</summary>
        {select("region", "Region", ["United States", "Europe"])}
        {select(
          "type",
          "Institution type",
          [...new Set(universities.map((u) => u.type))].sort(),
        )}
        {select("currency", "Cost currency", ["USD", "EUR", "GBP", "KZT"])}
        <label className="field-label">
          Maximum published annual cost
          <input
            type="number"
            min="0"
            value={filters.cost || ""}
            placeholder="No limit"
            onChange={(e) => setFilter("cost", e.target.value)}
          />
        </label>
        <p className="tiny-note">
          Uses dated official cost baselines, including older years. Currency
          defaults to USD; currencies are never converted. Tuition alone is not
          a total.
        </p>
        {select("quality", "Verification", [
          ["current", "Has Fall 2027 admission information"],
          ["verified", "Has official sources"],
          ["recheck", "Has details needing cycle review"],
        ])}
      </details>
    </>
  );
}
export default function Explorer() {
  const params = useSearchParams();
  const { state } = useApp();
  // Keep controlled inputs synchronous while Next updates its navigation state.
  const search = useSyncExternalStore(
    subscribeToFilters,
    getFilterSnapshot,
    () => (params.size ? `?${params}` : ""),
  );
  const filters = Object.fromEntries(new URLSearchParams(search));
  const found = discoverUniversities(universities, filters);
  const [view, setView] = useState("grid");
  const drawer = useRef<HTMLDialogElement>(null);
  function setFilter(key: string, value: string) {
    const next = new URLSearchParams(window.location.search);
    if (value) next.set(key, value);
    else next.delete(key);
    window.history.replaceState(
      null,
      "",
      `/explore${next.size ? `?${next}` : ""}`,
    );
    window.dispatchEvent(new Event("aidmap:filters"));
  }
  const reset = () => {
    window.history.replaceState(null, "", "/explore");
    window.dispatchEvent(new Event("aidmap:filters"));
  };
  const active = Object.entries(filters)
    .filter(([k, v]) => v && k !== "sort")
    .flatMap(([k, v]) => selectedValues(v).map((value) => [k, value]));
  const contradiction =
    (filters.from && filters.deadline && filters.from > filters.deadline) ||
    (filters.region &&
      filters.country &&
      !universities.some(
        (u) => u.country === filters.country && u.region === filters.region,
      ));
  const panel = (
    <FiltersPanel filters={filters} setFilter={setFilter} reset={reset} />
  );
  return (
    <div className="page-container explore-page">
      <PageHeading
        eyebrow="DISCOVER YOUR POSSIBILITIES"
        title="Find a place for your ambition."
        description="Find undergraduate programs and funding options. Review requirements, then save universities to plan your next steps."
      >
        <span className="cycle-label">
          {filters.intake || "Fall 2027"} · Undergraduate
        </span>
      </PageHeading>
      <div className="explore-search">
        <Search size={20} />
        <input
          aria-label="Search universities"
          placeholder="University, city, country, or subject…"
          value={filters.q || ""}
          onChange={(e) => setFilter("q", e.target.value)}
        />
        <span className="search-hint">
          {universities.length} researched institutions
        </span>
      </div>
      <div className="explorer-layout">
        <aside className="filter-sidebar" aria-label="University filters">
          {panel}
        </aside>
        <dialog
          ref={drawer}
          className="filter-dialog"
          aria-label="University filters"
        >
          <div className="drawer-top">
            <strong>Filters</strong>
            <button
              className="icon-button"
              aria-label="Close filters"
              onClick={() => drawer.current?.close()}
            >
              <X />
            </button>
          </div>
          {panel}
          <Button
            className="full-width"
            onClick={() => drawer.current?.close()}
          >
            Show {found.results.length} results
          </Button>
        </dialog>
        <section className="explore-results" aria-label="University results">
          <div className="results-toolbar">
            <div aria-live="polite">
              <strong>
                {found.results.length}{" "}
                {found.results.length === 1 ? "university" : "universities"}
              </strong>
              <span> to explore</span>
            </div>
            <div className="results-controls">
              <button
                className="filter-mobile-button"
                onClick={() => drawer.current?.showModal()}
              >
                <SlidersHorizontal size={16} />
                Filters
              </button>
              <select
                aria-label="Sort universities"
                value={filters.sort || "name"}
                onChange={(e) => setFilter("sort", e.target.value)}
              >
                <option value="name">Name: A–Z</option>
                <option value="name-desc">Name: Z–A</option>
                <option value="deadline">Verified admission deadline</option>
              </select>
              <div className="view-toggle">
                <button
                  aria-label="Grid view"
                  aria-pressed={view === "grid"}
                  onClick={() => setView("grid")}
                >
                  <LayoutGrid size={16} />
                </button>
                <button
                  aria-label="List view"
                  aria-pressed={view === "list"}
                  onClick={() => setView("list")}
                >
                  <List size={17} />
                </button>
              </div>
            </div>
          </div>
          {active.length > 0 && (
            <div className="active-filters">
              {active.map(([key, value]) => (
                <button
                  key={`${key}-${value}`}
                  aria-label={`Remove ${labels[key] || key}: ${value}`}
                  onClick={() =>
                    setFilter(
                      key,
                      selectedValues(filters[key])
                        .filter((v) => v !== value)
                        .join("|"),
                    )
                  }
                >
                  {labels[key] || key}: {value}
                  <X size={13} />
                </button>
              ))}
              <button className="clear-filters" onClick={reset}>
                Reset all
              </button>
            </div>
          )}
          {contradiction && (
            <p className="notice amber-notice" role="status">
              These filters conflict. Choose a country in the selected region
              and a date range whose start is before its end.
            </p>
          )}
          <div className="uncertainty-panel">
            <p aria-live="polite">
              {found.matches.length}{" "}
              {found.matches.length === 1 ? "matches" : "match"} the verified
              filters. {found.unknown.length} additional{" "}
              {found.unknown.length === 1
                ? "university has"
                : "universities have"}{" "}
              unverified details.
            </p>
            <label className="check-label">
              <input
                type="checkbox"
                checked={filters.includeUnknown === "yes"}
                onChange={(e) =>
                  setFilter("includeUnknown", e.target.checked ? "yes" : "")
                }
              />
              Include universities with unknown requirements
            </label>
            <p className="tiny-note">
              Unknown means more research is needed, not that you are
              ineligible. Known mismatches are still excluded.
            </p>
          </div>
          <PolicyNote />
          {found.results.length ? (
            <div
              className={
                view === "grid"
                  ? "university-grid explorer-grid"
                  : "university-list"
              }
            >
              {found.results.map(({ university, unknowns }) => (
                <UniversityCard
                  key={university.id}
                  university={university}
                  compact={view === "list"}
                  unknownFilters={unknowns}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Search size={28} />
              <h3>No verified universities match all selected filters.</h3>
              <p>
                Remove a filter or include universities with unverified
                requirements. We keep your choices until you change them.
              </p>
              <Button onClick={reset}>
                Reset all filters
                <ArrowRight size={16} />
              </Button>
            </div>
          )}
          <p className="section-footnote">
            {universities.length} institutions across{" "}
            {[...new Set(universities.map((u) => u.country))].length} countries
            · Check the source and year of each policy · No admission
            predictions
          </p>
        </section>
      </div>
      {state.compare.length > 0 && (
        <div className="compare-dock">
          <Columns3 size={19} />
          <strong>{state.compare.length} of 4 selected</strong>
          <span>
            {state.compare
              .map((id) => universities.find((u) => u.id === id)?.shortName)
              .join(" · ")}
          </span>
          <Button asChild size="sm">
            <Link href="/compare">
              Compare universities
              <ArrowRight size={15} />
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
