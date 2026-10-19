"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  Globe2,
  Wallet,
  ShieldCheck,
} from "lucide-react";
import { universities, academicFields } from "@/data/universities";
import { searchUniversities } from "@/lib/search";
import { PageHeading, PolicyNote } from "@/components/ui/shared";
import { UniversityCard } from "./card";
import { Button } from "@/components/ui/button";
import { useApp } from "@/components/providers";
const aidOptions = [
  ["international", "International student aid"],
  ["need", "Meets full demonstrated need"],
  ["merit", "Merit scholarships"],
  ["tuition", "Explicit full tuition award"],
  ["full-cost", "Explicit full cost award"],
  ["unknown", "Funding details unavailable"],
];
export default function Explorer() {
  const params = useSearchParams();
  const router = useRouter();
  const { state } = useApp();
  const filters = Object.fromEntries(params.entries());
  const results = searchUniversities(universities, filters);
  const [view, setView] = useState("grid");
  const [filtersOpen, setFiltersOpen] = useState(false);
  function setFilter(key: string, value: string) {
    const next = new URLSearchParams(window.location.search);
    if (value) next.set(key, value);
    else next.delete(key);
    window.history.replaceState(
      null,
      "",
      `/explore${next.size ? `?${next}` : ""}`,
    );
  }
  const active = Object.entries(filters).filter(([k, v]) => v && k !== "sort");
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
  return (
    <div className="page-container explore-page">
      <PageHeading
        eyebrow="DISCOVER YOUR POSSIBILITIES"
        title="Find a place for your ambition."
        description="Start with what matters to you. Look closer at what’s possible."
      >
        <span className="cycle-label">
          <span />
          Fall 2027 · Undergraduate
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
        <aside
          className={`filter-sidebar ${filtersOpen ? "is-open" : ""}`}
          aria-label="University filters"
        >
          <div className="filter-title">
            <strong>
              <SlidersHorizontal size={16} />
              Refine your search
            </strong>
            <button
              onClick={() => router.replace("/explore", { scroll: false })}
            >
              Reset
            </button>
            <button
              className="filter-close"
              aria-label="Close filters"
              onClick={() => setFiltersOpen(false)}
            >
              <X size={16} />
            </button>
          </div>
          <div className="filter-group">
            <h3>
              <Globe2 size={16} />
              Destination
            </h3>
            {select("region", "Region", ["United States", "Europe"])}
            {select("country", "Country", [
              "United States",
              "United Kingdom",
              "Germany",
              "Netherlands",
              "France",
            ])}
            {select(
              "city",
              "City",
              [...new Set(universities.map((u) => u.city))].sort(),
            )}
          </div>
          <div className="filter-group">
            <h3>
              <GraduationCap size={17} />
              Academics
            </h3>
            <div className="fixed-filter">
              Undergraduate<span className="tag neutral">MVP</span>
            </div>
            {select("major", "Subject", academicFields)}
            {select("test", "SAT / ACT policy", [
              ["optional", "Test optional"],
              ["required", "Testing required"],
              ["unknown", "Not yet verified"],
            ])}
            {select("english", "English requirement", [
              ["verified", "Policy sourced"],
              ["unknown", "Not yet verified"],
            ])}
            <p className="tiny-note">
              Intake: Fall 2027. General policies still need cycle checks.
            </p>
          </div>
          <div className="filter-group">
            <h3>
              <Wallet size={16} />
              Funding & affordability
            </h3>
            {aidOptions.map(([value, label]) => (
              <label className="check-label" key={value}>
                <input
                  type="checkbox"
                  checked={filters.aid === value}
                  onChange={() =>
                    setFilter("aid", filters.aid === value ? "" : value)
                  }
                />
                {label}
              </label>
            ))}
            {select("waiver", "Application fee waiver", [
              ["yes", "Verified available"],
            ])}
            <label className="field-label">
              Maximum annual cost (USD)
              <input
                type="number"
                min="0"
                placeholder="Verified totals only"
                value={filters.cost || ""}
                onChange={(e) => setFilter("cost", e.target.value)}
              />
            </label>
            <p className="tiny-note">
              Unknown costs are excluded when a maximum is set. Full-need
              policies are not full-tuition awards.
            </p>
          </div>
          <details className="filter-group">
            <summary>Admissions & deadlines</summary>
            {select("platform", "Application platform", [
              "Common App",
              "Coalition",
              "Institutional portal",
            ])}
            {select("plan", "Application plan", [
              "Early Action",
              "Early Decision",
              "Regular Decision",
            ])}
            <label className="field-label">
              Apply by
              <input
                type="date"
                value={filters.deadline || ""}
                onChange={(e) => setFilter("deadline", e.target.value)}
              />
            </label>
            <p className="tiny-note">
              Only verified admission dates qualify. Aid deadlines are separate.
            </p>
          </details>
          <details className="filter-group">
            <summary>Data quality</summary>
            {select("quality", "Verification", [
              ["verified", "Has official evidence"],
              ["recheck", "Needs cycle rechecking"],
              ["unknown", "Aid policy unconfirmed"],
            ])}
          </details>
          <div className="sidebar-note">
            <ShieldCheck size={20} />
            <strong>Small database. Clear evidence.</strong>
            <p>
              We prioritize trustworthy research over the size of our directory.
            </p>
            <Link href="/about">
              How we verify
              <ArrowRight size={13} />
            </Link>
          </div>
        </aside>
        <section className="explore-results" aria-label="University results">
          <div className="results-toolbar">
            <div>
              <strong>{results.length} universities</strong>
              <span> to explore</span>
            </div>
            <div className="results-controls">
              <button
                className="filter-mobile-button"
                onClick={() => setFiltersOpen(!filtersOpen)}
                aria-expanded={filtersOpen}
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
                <option value="deadline">Application deadline</option>
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
                <button key={key} onClick={() => setFilter(key, "")}>
                  {key}: {value}
                  <X size={13} />
                </button>
              ))}
              <button
                className="clear-filters"
                onClick={() => router.replace("/explore", { scroll: false })}
              >
                Clear all
              </button>
            </div>
          )}
          <PolicyNote />
          {results.length ? (
            <div
              className={
                view === "grid"
                  ? "university-grid explorer-grid"
                  : "university-list"
              }
            >
              {results.map((u) => (
                <UniversityCard
                  key={u.id}
                  university={u}
                  compact={view === "list"}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Search size={28} />
              <h3>No verified matches. Still plenty of possibility.</h3>
              <p>
                {filters.region === "Europe"
                  ? "European records are being researched. We’ll add them when admissions and funding can be supported by official sources."
                  : "Try removing a filter. Unknown costs, deadlines, and awards are never treated as verified matches."}
              </p>
              <Button
                onClick={() => router.replace("/explore", { scroll: false })}
              >
                Clear filters & explore all
                <ArrowRight size={16} />
              </Button>
            </div>
          )}
          <p className="section-footnote">
            {universities.length} US institutions · Research checked October 18,
            2026 · No admission predictions
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
