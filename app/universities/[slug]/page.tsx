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
import {
  findUniversity,
  universities,
  opportunities,
} from "@/data/universities";
import { fieldStatus } from "@/lib/admissions";
import { Help } from "@/components/ui/help";
import { DeadlineTable } from "@/components/universities/deadlines";
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
            : (text ??
              (typeof field.value === "boolean"
                ? field.value
                  ? "Available; check conditions"
                  : "Not available under this policy"
                : String(field.value)))}
        </strong>
        <Evidence university={u} field={field} />
        {field.scope && (
          <p>
            <strong>
              Applies to: {field.scope.program} · {field.scope.purpose}
            </strong>
          </p>
        )}
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
  const awards = opportunities.filter((o) => o.universityId === u.id);
  const currentSourceIds = new Set(
    Object.values(u).flatMap((value) =>
      value && typeof value === "object" && "sourceIds" in value
        ? (value.sourceIds as string[])
        : [],
    ),
  );
  const displayedSources = u.sources.filter(
    (s) => currentSourceIds.has(s.id) || u.costSourceIds.includes(s.id),
  );
  const admissionsUrl =
    u.sources.find((s) =>
      [
        "admissionEligibility",
        "applicationPlatform",
        "requirements",
        "testPolicy",
      ].some((f) => s.fields.includes(f)),
    )?.url ?? u.website;
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
            {u.city}
            {u.state ? `, ${u.state}` : ""} · {u.country}
          </p>
        </div>
        <UniversityActions id={u.id} />
      </div>
      <div className="detail-quick-stats">
        <div>
          <span>International student aid</span>
          <strong>
            {u.internationalAid.value
              ? "Need-based aid"
              : awards.length
                ? "Scholarships / fee support"
                : "Not yet verified"}
          </strong>
        </div>
        <div>
          <span>Admission policy</span>
          <strong>
            {u.needBlind.value
              ? "Need-blind, with conditions"
              : u.needBlind.value === false
                ? "Need-aware"
                : "Not yet verified"}
          </strong>
        </div>
        <div>
          <span>
            Annual cost baseline · {u.annualCost.cycle ?? "year not verified"}
          </span>
          <strong>
            {u.annualCost.value === null
              ? "Not yet verified"
              : money(u.annualCost.value, u.costCurrency)}
          </strong>
        </div>
        <div>
          <span>Research checked</span>
          <strong>
            {dateLabel(
              [...u.sources]
                .map((s) => s.checkedAt)
                .sort()
                .at(-1) ?? null,
            )}
          </strong>
        </div>
      </div>
      <PolicyNote />
      <nav className="detail-nav" aria-label="Profile sections">
        {[
          "Overview",
          "Admissions",
          "Financial aid",
          "Estimated cost",
          "Deadlines",
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
            <p className="program-conditions">{u.programs.note}</p>
            <Help term="selectivity" />
            <MatchPanel university={u} />
          </section>
          <section id="admissions" className="detail-section">
            <span className="eyebrow">02 / KNOW WHAT’S REQUIRED</span>
            <h2>Admissions, with the details.</h2>
            <p>
              Review the requirements that apply to your curriculum, program and
              intake before submitting an application.
            </p>
            <Help term="testing" />
            <Help term="english" />
            <dl>
              <FactRow
                u={u}
                field={u.admissionEligibility}
                label="Applicant and curriculum conditions"
              />
              <FactRow u={u} field={u.testPolicy} label="SAT / ACT policy" />
              <FactRow
                u={u}
                field={u.englishPolicy}
                label="English proficiency"
              />
              <FactRow
                u={u}
                field={u.englishWaiver}
                label="English test exemption"
                text={
                  u.englishWaiver.value
                    ? "Possible under the conditions below"
                    : "No exemption verified under this policy"
                }
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
                    : money(u.applicationFee.value, u.costCurrency)
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
            {u.englishMinimums.value && (
              <div className="requirements-list">
                <h3>Published English scores</h3>
                <p>
                  Minimums and recommendations have different meanings. Use the
                  correct version and score scale; these are not admission
                  guarantees.
                </p>
                {u.englishMinimums.value.map((m, i) => (
                  <div className="requirement-item" key={i}>
                    <strong>
                      {m.test}: {m.score} · {m.kind}
                    </strong>
                    <p>{m.condition}</p>
                  </div>
                ))}
                <Evidence university={u} field={u.englishMinimums} />
              </div>
            )}
            <h3>Documents to prepare</h3>
            {u.requirements.scope && (
              <p className="notice amber-notice">
                This checklist applies to {u.requirements.scope.program}. Other
                programs may have different requirements.
              </p>
            )}
            {u.requirements.value ? (
              <>
                <ul className="requirements-list">
                  {u.requirements.value.map((r, i) => (
                    <li className="requirement-item" key={i}>
                      <strong>{r.label}</strong>{" "}
                      <span className="tag neutral">{r.status}</span>
                      <p>
                        {r.condition ??
                          "Check the applicant-specific instructions."}
                      </p>
                    </li>
                  ))}
                </ul>
                <Evidence university={u} field={u.requirements} />
              </>
            ) : (
              <p>
                Not yet verified. Check the official application instructions
                for transcripts, essays, recommendations and translations.
              </p>
            )}
            <ExternalLink href={admissionsUrl}>
              Official admissions instructions
            </ExternalLink>
          </section>
          <section id="financial-aid" className="detail-section">
            <span className="eyebrow">03 / UNDERSTAND THE POSSIBILITIES</span>
            <h2>Funding is personal. Policies are a start.</h2>
            <Help term="needBlind" />
            <Help term="fullNeed" />
            <dl>
              <FactRow
                u={u}
                field={u.internationalAid}
                label="International aid eligibility"
                text={
                  u.internationalAid.value
                    ? "Eligible international applicants may apply for need-based aid"
                    : "Institutional need-based aid is not available under this policy"
                }
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
                text={
                  u.meetsFullNeed.value
                    ? "Meets full institution-calculated need"
                    : "Does not promise to meet full demonstrated need"
                }
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
            {awards
              .filter((o) => o.kind !== "Institutional policy")
              .map((o) => (
                <article className="profile-award panel" key={o.id}>
                  <h3>{o.name}</h3>
                  <p>{o.coverage}</p>
                  <p>
                    <strong>Eligibility: </strong>
                    {o.eligibleCitizenships?.join(", ") ??
                      "Citizenship and applicant conditions must be checked individually."}
                  </p>
                  <p>{o.source.note}</p>
                  <p>
                    <strong>Apply: </strong>
                    {o.separateApplication ?? "Not yet verified"}
                  </p>
                  <p>
                    <strong>Renewal: </strong>
                    {o.renewal ?? "Not yet verified"}
                  </p>
                  <small>
                    {o.source.cycle ?? "Intake not specified"} · checked{" "}
                    {dateLabel(o.source.checkedAt)}
                  </small>
                  <ExternalLink href={o.source.url}>
                    Official award terms
                  </ExternalLink>
                </article>
              ))}
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
              {u.costCurrency} ·{" "}
              {u.costCycle ?? "Academic year not yet verified"}. Costs are a
              planning baseline. Missing expenses remain unknown.
            </p>
            {u.annualCost.value !== null && (
              <div className="notice amber-notice">
                <div>
                  <strong>
                    Official cost baseline:{" "}
                    {money(u.annualCost.value, u.costCurrency)} ·{" "}
                    {u.annualCost.cycle}
                  </strong>
                  <p>{u.annualCost.note}</p>
                  <p>
                    {fieldStatus(u.annualCost, u) === "verified_current"
                      ? "Check the included expenses and your individual circumstances."
                      : "Fall 2027 / 2027–28 costs are not yet verified. This older baseline is not your final price."}
                  </p>
                  <Evidence university={u} field={u.annualCost} />
                </div>
              </div>
            )}
            <details>
              <summary>Cost categories and missing expenses</summary>
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
                  <span>Complete itemized total</span>
                  <strong>
                    {costKeys.some((k) => u.costs[k] === null)
                      ? "Not yet known"
                      : money(
                          costKeys.reduce((s, k) => s + u.costs[k]!, 0),
                          u.costCurrency,
                        )}
                  </strong>
                </div>
              </div>
            </details>
            <Link
              className="button button-primary"
              href={`/calculator?university=${u.id}`}
            >
              Build your own funding scenario
              <ArrowRight size={16} />
            </Link>
          </section>
          <section id="deadlines" className="detail-section">
            <h2>Application and funding deadlines</h2>
            <DeadlineTable university={u} />
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
            <Help term="sources" />
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
            <details>
              <summary>
                Sources and verification ({displayedSources.length})
              </summary>
              <div className="source-list">
                {displayedSources.map((s) => (
                  <article id={`source-${s.id}`} key={s.id}>
                    <div>
                      <span className="tag neutral">
                        {s.status === "verified"
                          ? "Official source"
                          : "Needs rechecking"}
                      </span>
                      <span>Checked {dateLabel(s.checkedAt)}</span>
                    </div>
                    <ExternalLink href={s.url}>{s.title}</ExternalLink>
                    <p>{s.note}</p>
                    <small>
                      {s.cycle ||
                        "General official policy; intake not specified"}
                    </small>
                  </article>
                ))}
              </div>
            </details>
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
            <ExternalLink
              className="button button-primary"
              href={admissionsUrl}
            >
              Visit official admissions website
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
