"use client";
import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import { currencySchema } from "@/types/domain";
import Link from "next/link";
import {
  Search,
  SlidersHorizontal,
  LayoutGrid,
  List,
  X,
  ArrowRight,
  Columns3,
  GraduationCap,
  HeartHandshake,
  MessageCircle,
  Target,
} from "lucide-react";
import { universities, academicFields } from "@/data/universities";
import {
  discoverUniversities,
  selectedValues,
  type Filters,
} from "@/lib/search";
import { PolicyNote } from "@/components/ui/shared";
import { Help } from "@/components/ui/help";
import { UniversityCard } from "./card";
import { Button } from "@/components/ui/button";
import { useApp } from "@/components/providers";
const countries = [...new Set(universities.map((u) => u.country))].sort();
const regions = [...new Set(universities.map((u) => u.region))].sort();
const institutionTypes = [...new Set(universities.map((u) => u.type))].sort();
const pageSize = 12;
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
const quickFilters = [
  {
    key: "major",
    value: "Computer Science",
    label: "Computer Science",
    icon: GraduationCap,
  },
  {
    key: "aid",
    value: "international",
    label: "Need-based aid",
    icon: HeartHandshake,
  },
  {
    key: "maxAdmitRate",
    value: "known",
    label: "Published rates",
    icon: Target,
  },
] as const;
const labels: Record<string, string> = {
  q: "Search",
  maxAdmitRate: "Acceptance rate",
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
  includeUnknownCosts: "Include unknown costs",
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
  const { ready } = useApp();
  function select(key: string, label: string, options: string[] | string[][]) {
    return (
      <label className="field-label">
        {label}
        <select
          disabled={!ready}
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
      <fieldset className="filter-options" disabled={!ready}>
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
        <strong>
          <SlidersHorizontal size={15} aria-hidden /> Filters
        </strong>
        <button disabled={!ready} onClick={reset}>
          Reset all
        </button>
      </div>
      <div className="filter-group">
        {select("country", "Country", countries)}
        {select("major", "Subject", academicFields)}
        {select("maxAdmitRate", "Acceptance rate", [
          ["known", "Verified rate available"],
          ["10", "10% or lower"],
          ["25", "25% or lower"],
          ["50", "50% or lower"],
          ["75", "75% or lower"],
        ])}
        {select("intake", "Application intake", ["Fall 2027", "Fall 2028"])}
      </div>
      <details className="filter-group" open={filters.aid ? true : undefined}>
        <summary>Funding</summary>
        {checks("aid", "Funding type", aidOptions)}
        <Help term="fullNeed" />
      </details>
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
            ...new Set(
              universities.flatMap((u) => u.applicationPlans.value ?? []),
            ),
          ]
            .sort()
            .map((v) => [v, v]),
        )}
        <Help term="rounds" />
        {select("waiver", "Application fee waiver", [
          ["yes", "Available with conditions"],
        ])}
        {select("platform", "Application platform", [
          "Common App",
          "Coalition",
          "Institutional portal",
          "Studyinfo",
        ])}
        <label className="field-label">
          Deadline from
          <input
            type="date"
            disabled={!ready}
            value={filters.from || ""}
            onChange={(e) => setFilter("from", e.target.value)}
          />
        </label>
        <label className="field-label">
          Deadline by
          <input
            type="date"
            disabled={!ready}
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
        {select("region", "Region", regions)}
        {select("type", "Institution type", institutionTypes)}
        {select("currency", "Cost currency", currencySchema.options)}
        <label className="field-label">
          Maximum published gross annual cost
          <input
            type="number"
            disabled={!ready}
            min="0"
            value={filters.cost || ""}
            placeholder="No limit"
            onChange={(e) => setFilter("cost", e.target.value)}
          />
        </label>
        <label className="check-label">
          <input
            type="checkbox"
            disabled={!ready}
            checked={filters.includeUnknownCosts === "yes"}
            onChange={(e) =>
              setFilter("includeUnknownCosts", e.target.checked ? "yes" : "")
            }
          />
          Include universities with unknown costs
        </label>
        <p className="tiny-note">
          Uses dated official cost baselines, including older years. Currency
          defaults to USD; currencies are never converted. Tuition alone is not
          a total. This filters gross costs before aid, not your eventual net
          price.
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
export default function Explorer({ initialSearch }: { initialSearch: string }) {
  const { state, ready } = useApp();
  // Keep controlled inputs synchronous while Next updates its navigation state.
  const search = useSyncExternalStore(
    subscribeToFilters,
    getFilterSnapshot,
    () => initialSearch,
  );
  const filters = useMemo(
    () => Object.fromEntries(new URLSearchParams(search)),
    [search],
  );
  const found = useMemo(
    () => discoverUniversities(universities, filters),
    [filters],
  );
  const [page, setPage] = useState({ search, limit: pageSize });
  const limit = page.search === search ? page.limit : pageSize;
  const [view, setView] = useState("list");
  const drawer = useRef<HTMLDialogElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
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
  const sortSelect = (
    <select
      aria-label="Sort universities"
      disabled={!ready}
      value={filters.sort || "name"}
      onChange={(e) => setFilter("sort", e.target.value)}
    >
      <option value="name">Name (A–Z)</option>
      <option value="name-desc">Name (Z–A)</option>
      <option value="deadline">Next admission deadline</option>
      <option value="acceptance">Lowest published rate</option>
    </select>
  );
  const layoutToggle = (
    <div className="view-toggle" role="group" aria-label="Results layout">
      <button
        type="button"
        aria-label="Grid view"
        aria-pressed={view === "grid"}
        onClick={() => setView("grid")}
      >
        <LayoutGrid size={16} aria-hidden />
      </button>
      <button
        type="button"
        aria-label="List view"
        aria-pressed={view === "list"}
        onClick={() => setView("list")}
      >
        <List size={17} aria-hidden />
      </button>
    </div>
  );
  return (
    <div className="page-container explore-page">
      <header className="catalogue-heading">
        <div>
          <h1>Universities</h1>
          <p>Explore undergraduate programs, admission rates and funding.</p>
        </div>
        <span className="cycle-label">{countries.length} countries</span>
      </header>
      <div className="catalogue-tools">
        <div className="explore-search">
          <Search size={19} aria-hidden />
          <input
            ref={searchInput}
            type="text"
            aria-label="Search universities"
            disabled={!ready}
            placeholder="Search universities, cities or subjects"
            value={filters.q || ""}
            onChange={(e) => setFilter("q", e.target.value)}
          />
          {filters.q && (
            <button
              className="catalogue-clear-search"
              aria-label="Clear university search"
              onClick={() => {
                setFilter("q", "");
                searchInput.current?.focus();
              }}
            >
              <X size={16} aria-hidden />
            </button>
          )}
        </div>
        <div className="catalogue-tool-links">
          <Button asChild size="sm">
            <Link href="/match" prefetch={false}>
              Find my fit <ArrowRight size={15} aria-hidden />
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link
              prefetch={false}
              href="/advisor?question=Help%20me%20find%20universities%20for%20my%20major"
            >
              <MessageCircle size={16} aria-hidden /> Ask Maple
            </Link>
          </Button>
        </div>
      </div>
      <div
        className="catalogue-quick-filters"
        role="group"
        aria-label="Quick filters"
      >
        {quickFilters.map(({ key, value, label, icon: Icon }) => {
          const current = selectedValues(filters[key]);
          const selected = current.includes(value);
          return (
            <button
              key={key}
              type="button"
              disabled={!ready}
              aria-pressed={selected}
              onClick={() =>
                setFilter(
                  key,
                  key === "aid"
                    ? (selected
                        ? current.filter((item) => item !== value)
                        : [...current, value]
                      ).join("|")
                    : selected
                      ? ""
                      : value,
                )
              }
            >
              <Icon size={15} aria-hidden /> {label}
            </button>
          );
        })}
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
          <label className="field-label catalogue-drawer-sort">
            Sort by {sortSelect}
          </label>
          {layoutToggle}
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
            </div>
            <div className="results-controls">
              <button
                className="filter-mobile-button"
                disabled={!ready}
                onClick={() => drawer.current?.showModal()}
              >
                <SlidersHorizontal size={16} />
                Filters
              </button>
              {sortSelect}
              {layoutToggle}
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
          {(found.unknown.length > 0 || filters.includeUnknown === "yes") && (
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
                  disabled={!ready}
                  checked={filters.includeUnknown === "yes"}
                  onChange={(e) =>
                    setFilter("includeUnknown", e.target.checked ? "yes" : "")
                  }
                />
                Include universities with unknown requirements
              </label>
            </div>
          )}
          {found.results.length ? (
            <div
              className={
                view === "grid"
                  ? "university-grid explorer-grid"
                  : "university-list"
              }
            >
              {found.results.slice(0, limit).map(({ university, unknowns }) => (
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
          {found.results.length > limit && (
            <Button
              onClick={() => setPage({ search, limit: limit + pageSize })}
            >
              Show {Math.min(pageSize, found.results.length - limit)} more
              universities
            </Button>
          )}
          <p className="section-footnote">
            {universities.length} institutions across{" "}
            {[...new Set(universities.map((u) => u.country))].length} countries
            · Select a university to see the admissions figure’s source and
            scope.
          </p>
          <details className="catalogue-note">
            <summary>How to read funding information</summary>
            <PolicyNote />
          </details>
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
