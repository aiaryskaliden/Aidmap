import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  ShieldCheck,
  ArrowUpRight,
  Info,
  Check,
} from "lucide-react";
import { findUniversity, universities } from "@/data/universities";
import { dateLabel, money } from "@/lib/utils";
import {
  costKeys,
  costLabels,
  type Fact,
  type University,
} from "@/types/domain";
import { Evidence, ExternalLink, PolicyNote } from "@/components/ui/shared";
import { UniversityActions } from "@/components/universities/actions";
import {
  MatchPanel,
  AddChecklist,
} from "@/components/universities/detail-actions";
export const generateStaticParams = () =>
  universities.map((u) => ({ slug: u.id }));
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const u = findUniversity((await params).slug);
  return {
    title: u?.name ?? "University not found",
    description: `Research ${u?.name ?? "this university"}: international financial aid, application requirements, sources and funding uncertainty.`,
  };
}
function FactRow({
  u,
  field,
  label,
  text,
}: {
  u: University;
  field: Fact<unknown>;
  label: string;
  text?: string;
}) {
  return (
    <div className="fact-row">
      <dt>{label}</dt>
      <dd>
        <strong>
          {field.value === null
            ? "Not yet verified"
            : (text ?? String(field.value))}
        </strong>
        <Evidence university={u} field={field} />
        {field.note && <p>{field.note}</p>}
        {field.value !== null && (
          <small>
            {field.cycle || "General policy · Recheck for Fall 2027"}
          </small>
        )}
      </dd>
    </div>
  );
}
export default async function UniversityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const u = findUniversity((await params).slug);
  if (!u) notFound();
  return (
    <div className="page-container detail-page">
      <Link className="back-link" href="/explore">
        <ArrowLeft size={14} />
        Back to universities
      </Link>
      <div className="university-hero">
        <span
          className="university-monogram large"
          style={{ color: u.color, background: `${u.color}12` }}
        >
          {u.initials}
        </span>
        <div>
          <div className="eyebrow">{u.type} · UNDERGRADUATE</div>
          <h1>{u.name}</h1>
          <p className="location">
            <MapPin size={15} />
            {u.city}, {u.state}, United States
          </p>
        </div>
        <UniversityActions id={u.id} />
      </div>
      <div className="detail-quick-stats">
        <div>
          <span>International student aid</span>
          <strong>
            {u.internationalAid.value ? "Need-based aid" : "Not yet verified"}
          </strong>
        </div>
        <div>
          <span>Admission policy</span>
          <strong>
            {u.needBlind.value
              ? "Need-blind, with conditions"
              : "Not yet verified"}
          </strong>
        </div>
        <div>
          <span>Individual funding award</span>
          <strong>Not yet known</strong>
        </div>
        <div>
          <span>Research checked</span>
          <strong>Oct 18, 2026</strong>
        </div>
      </div>
      <PolicyNote />
      <nav className="detail-nav" aria-label="Profile sections">
        {[
          "Overview",
          "Admissions",
          "Financial aid",
          "Estimated cost",
          "Checklist",
          "Sources",
        ].map((s) => (
          <a key={s} href={`#${s.toLowerCase().replaceAll(" ", "-")}`}>
            {s}
          </a>
        ))}
      </nav>
      <div className="detail-layout">
        <div>
          <section id="overview" className="detail-section">
            <span className="eyebrow">01 / YOUR ACADEMIC DIRECTION</span>
            <h2>Room to explore your interests.</h2>
            <p>
              Selected undergraduate fields from the institution’s official
              academic directory. This is a starting point, not the complete
              program catalog.
            </p>
            <div className="program-grid">
              {u.programs.value?.map((p) => (
                <div key={p}>
                  <Check size={16} />
                  {p}
                </div>
              )) ?? <span>Not yet verified</span>}
            </div>
            <Evidence university={u} field={u.programs} />
            <MatchPanel university={u} />
          </section>
          <section id="admissions" className="detail-section">
            <span className="eyebrow">02 / KNOW WHAT’S REQUIRED</span>
            <h2>Admissions, with the details.</h2>
            <dl>
              <FactRow u={u} field={u.testPolicy} label="SAT / ACT policy" />
              <FactRow
                u={u}
                field={u.englishPolicy}
                label="English proficiency"
              />
              <FactRow
                u={u}
                field={u.admissionDeadline}
                label="Fall 2027 admission deadline"
                text={dateLabel(u.admissionDeadline.value)}
              />
              <FactRow
                u={u}
                field={u.applicationPlatform}
                label="First-year application platform"
              />
              <FactRow
                u={u}
                field={u.applicationPlans}
                label="Application plans"
                text={u.applicationPlans.value?.join(", ")}
              />
              <FactRow
                u={u}
                field={u.applicationFee}
                label="Application fee"
                text={
                  u.applicationFee.value === null
                    ? undefined
                    : money(u.applicationFee.value)
                }
              />
              <FactRow
                u={u}
                field={u.feeWaiver}
                label="Application fee waiver"
                text={
                  u.feeWaiver.value
                    ? "Available; check conditions"
                    : "Not available"
                }
              />
            </dl>
          </section>
          <section id="financial-aid" className="detail-section">
            <span className="eyebrow">03 / UNDERSTAND THE POSSIBILITIES</span>
            <h2>Funding is personal. Policies are a start.</h2>
            <dl>
              <FactRow
                u={u}
                field={u.internationalAid}
                label="International aid eligibility"
                text="International applicants may apply for need-based aid"
              />
              <FactRow
                u={u}
                field={u.needBlind}
                label="Financial need in admission"
                text={
                  u.needBlind.value
                    ? "Need-blind first-year review; see exceptions below"
                    : "Need-aware"
                }
              />
              <FactRow
                u={u}
                field={u.meetsFullNeed}
                label="Demonstrated financial need"
                text="Meets full institution-calculated need"
              />
              <FactRow
                u={u}
                field={u.meritAid}
                label="Institutional merit scholarships"
                text={
                  u.meritAid.value
                    ? "Available; award conditions apply"
                    : "No institutional merit scholarships"
                }
              />
              <FactRow
                u={u}
                field={u.fullTuition}
                label="Explicit full-tuition award"
              />
              <FactRow
                u={u}
                field={u.fullCost}
                label="Explicit full-cost award"
              />
              <FactRow
                u={u}
                field={u.aidForms}
                label="Financial aid application"
              />
              <FactRow
                u={u}
                field={u.aidDeadline}
                label="Regular Decision aid deadline"
                text={dateLabel(u.aidDeadline.value)}
              />
            </dl>
            <div className="notice amber-notice">
              <Info size={18} />
              <p>
                Meeting full demonstrated need does not mean a guaranteed zero
                contribution. The university calculates need, and an aid package
                may include student work expectations. Check the individual
                offer.
              </p>
            </div>
          </section>
          <section id="estimated-cost" className="detail-section">
            <span className="eyebrow">04 / LOOK AT THE WHOLE PICTURE</span>
            <h2>Annual cost of attendance.</h2>
            <p>
              Fall 2027 · USD. Missing costs remain unknown and are never added
              as zero.
            </p>
            <div className="cost-table">
              {costKeys.map((k) => (
                <div key={k}>
                  <span>{costLabels[k]}</span>
                  <strong>
                    {u.costs[k] === null
                      ? "Not yet verified"
                      : money(u.costs[k]!, u.costCurrency)}
                  </strong>
                </div>
              ))}
              <div className="cost-total">
                <span>Total annual cost</span>
                <strong>Insufficient verified information</strong>
              </div>
            </div>
            <Link
              className="button button-primary"
              href={`/calculator?university=${u.id}`}
            >
              Build your own funding scenario
              <ArrowRight size={16} />
            </Link>
          </section>
          <section id="checklist" className="detail-section">
            <span className="eyebrow">05 / ONE STEP AT A TIME</span>
            <h2>Start your research checklist.</h2>
            <p>
              These planning prompts are not a verified list of this
              institution’s application requirements. Use official admissions
              instructions to confirm each item.
            </p>
            <ul className="checklist-prompts">
              {[
                "Confirm the Fall 2027 application deadline and platform",
                "Check transcript and translation requirements",
                "Review required tests and English proficiency exemptions",
                "Check essays and recommendation requirements",
                "Review international aid forms and their separate deadlines",
              ].map((t) => (
                <li key={t}>
                  <span className="empty-check" />
                  {t}
                </li>
              ))}
            </ul>
            <AddChecklist universityId={u.id} />
          </section>
          <section id="sources" className="detail-section">
            <span className="eyebrow">06 / CHECK OUR WORK</span>
            <h2>Sources, dates, and open questions.</h2>
            <p>
              Each finding has its own evidence. A general policy is not
              automatically a verified Fall 2027 rule.
            </p>
            <div className="unknowns">
              <h3>
                <Info size={17} />
                What still needs an answer
              </h3>
              <ul>
                {u.unknowns.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
            <div className="source-list">
              {u.sources.map((s) => (
                <article id={`source-${s.id}`} key={s.id}>
                  <div>
                    <span
                      className={`tag ${s.status === "verified" ? "green" : "amber"}`}
                    >
                      {s.status === "verified"
                        ? "Official source"
                        : "Needs rechecking"}
                    </span>
                    <span>Checked {dateLabel(s.checkedAt)}</span>
                  </div>
                  <ExternalLink href={s.url}>{s.title}</ExternalLink>
                  <p>{s.note}</p>
                  <small>
                    Supports: {s.fields.join(", ")} · Cycle:{" "}
                    {s.cycle || "General policy"}
                  </small>
                </article>
              ))}
            </div>
          </section>
        </div>
        <aside className="detail-aside">
          <div className="panel">
            <span className="icon-box">
              <CompassArrow />
            </span>
            <h3>Go to the source.</h3>
            <p>
              Confirm your requirements with the university before making a
              decision or submitting an application.
            </p>
            <ExternalLink className="button button-primary" href={u.website}>
              Visit official university website
            </ExternalLink>
            <hr />
            <Link href={`/calculator?university=${u.id}`}>
              <span>Understand your funding gap</span>
              <ArrowRight size={16} />
            </Link>
            <Link href="/planner">
              <span>Open application planner</span>
              <ArrowRight size={16} />
            </Link>
          </div>
          <div className="sidebar-note">
            <ShieldCheck size={21} />
            <strong>Your ambition is more than a score.</strong>
            <p>
              AidMap does not predict admission or label institutions as
              “safeties.” Explore a balanced range of options.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
function CompassArrow() {
  return <ArrowUpRight size={22} />;
}
