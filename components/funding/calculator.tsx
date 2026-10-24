"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Bookmark,
  Calculator as CalculatorIcon,
  CircleHelp,
  Info,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { universities, findUniversity } from "@/data/universities";
import {
  costKeys,
  costLabels,
  emptyCosts,
  amountSchema,
  type CostItems,
  type Currency,
  type FundingScenario,
} from "@/types/domain";
import { calculateFunding, hypotheticalFunding } from "@/lib/funding/calculate";
import { money } from "@/lib/utils";
import { useApp } from "@/components/providers";
import { PageHeading, LocalNote } from "@/components/ui/shared";
import { Button } from "@/components/ui/button";
import { ScenarioComparison } from "@/components/funding/scenario-comparison";
import { findDossier } from "@/data/core-admissions";
import { countLabel } from "@/lib/format";
const colors = [
  "#465bea",
  "#7988ed",
  "#108d82",
  "#58b4a7",
  "#d9a44d",
  "#b7a0d5",
  "#9da7ba",
];
const exampleCosts: CostItems = {
  tuition: 50000,
  fees: 1000,
  housing: 10000,
  food: 5000,
  insurance: 2000,
  books: 1500,
  transportation: 1500,
};
export default function Calculator() {
  const { ready } = useApp();
  return ready ? (
    <CalculatorBody />
  ) : (
    <div className="page-container">Loading your local funding workspace…</div>
  );
}
function CalculatorBody() {
  const params = useSearchParams();
  const { state, update, toast, blocked } = useApp();
  const saved = state.scenarios.find((s) => s.id === params.get("scenario"));
  const [editingId, setEditingId] = useState<string | null>(saved?.id ?? null);
  const [universityId, setUniversityId] = useState(
    saved?.universityId ?? params.get("university") ?? "",
  );
  const [currency, setCurrency] = useState<Currency>(
    saved?.currency ?? findUniversity(universityId)?.costCurrency ?? "USD",
  );
  const [costs, setCosts] = useState<CostItems>(
    saved?.costs ?? { ...emptyCosts },
  );
  const [contribution, setContribution] = useState<number | null>(
    saved
      ? saved.contribution
      : state.profile?.currency === currency
        ? state.profile.budget
        : null,
  );
  const [confirmed, setConfirmed] = useState<number | null>(
    saved?.confirmedAward ?? null,
  );
  const [attested, setAttested] = useState(
    saved?.confirmedAward !== null && saved?.confirmedAward !== undefined,
  );
  const [hypothetical, setHypothetical] = useState<number | null>(
    saved?.hypotheticalAward ?? null,
  );
  const [name, setName] = useState(saved?.name ?? "My funding scenario");
  const [costYear, setCostYear] = useState(saved?.costYear ?? "");
  const [provenance, setProvenance] = useState(
    saved?.provenance ?? "Your own estimates",
  );
  const [restrictions, setRestrictions] = useState(saved?.restrictions ?? "");
  const [isExample, setIsExample] = useState(false);
  const u = findUniversity(universityId);
  let error = "";
  let result: ReturnType<typeof calculateFunding> | null = null;
  let hypotheticalResult: ReturnType<typeof hypotheticalFunding> | null = null;
  const awardError =
    confirmed !== null && !amountSchema.safeParse(confirmed).success
      ? "Enter a confirmed grant from 0 to 1 trillion, or leave it blank."
      : "";
  const hypotheticalError =
    hypothetical !== null && !amountSchema.safeParse(hypothetical).success
      ? "Enter a hypothetical total award from 0 to 1 trillion, or leave it blank."
      : "";
  try {
    result = calculateFunding(
      costs,
      currency,
      contribution,
      attested && confirmed !== null && !awardError
        ? { amount: confirmed, currency, kind: "confirmed" }
        : null,
    );
    if (attested && awardError)
      result = { ...result, remaining: null, aboveBudget: null };
    if (hypothetical !== null && !hypotheticalError)
      hypotheticalResult = hypotheticalFunding(
        costs,
        currency,
        contribution,
        hypothetical,
      );
  } catch (e) {
    error = e instanceof Error ? e.message : "Check your values.";
  }
  const readNumber = (v: string) => (v.trim() === "" ? null : Number(v));
  function resetAmounts(next: Currency) {
    setEditingId(null);
    setCurrency(next);
    setCosts({ ...emptyCosts });
    setContribution(null);
    setConfirmed(null);
    setAttested(false);
    setHypothetical(null);
    setIsExample(false);
    setCostYear("");
    setProvenance("Your own estimates");
    setRestrictions("");
    toast("Currency changed. Amounts cleared; no exchange rate was applied.");
  }
  function loadScenario(s: FundingScenario) {
    setEditingId(s.id);
    setUniversityId(s.universityId);
    setCurrency(s.currency);
    setCosts(s.costs);
    setContribution(s.contribution);
    setConfirmed(s.confirmedAward);
    setAttested(s.confirmedAward !== null);
    setHypothetical(s.hypotheticalAward);
    setName(s.name);
    setCostYear(s.costYear ?? "");
    setProvenance(s.provenance ?? "Legacy scenario; source not recorded");
    setRestrictions(s.restrictions ?? "");
    setIsExample(false);
  }
  return (
    <div className="page-container calculator-page">
      <PageHeading
        eyebrow="AIDMAP / THE WHOLE FINANCIAL PICTURE"
        title="Big plans. Clear numbers."
        description="Estimate expenses that funding may leave uncovered. This is a planning tool, not an official financial aid offer."
      >
        <LocalNote />
      </PageHeading>
      <div className="calculator-layout">
        <section className="calculator-inputs panel">
          <div className="panel-heading">
            <h2>
              <CalculatorIcon size={20} />
              Build your annual scenario
            </h2>
            <button
              className="text-link"
              onClick={() => {
                setEditingId(null);
                setCosts({ ...emptyCosts });
                setConfirmed(null);
                setHypothetical(null);
                setContribution(null);
                setAttested(false);
                setIsExample(false);
              }}
            >
              <RotateCcw size={14} />
              Reset
            </button>
          </div>
          <div className="form-grid">
            <label className="field-label">
              University
              <select
                aria-label="University"
                value={universityId}
                onChange={(e) => {
                  setEditingId(null);
                  setUniversityId(e.target.value);
                  setCosts({ ...emptyCosts });
                  setConfirmed(null);
                  setAttested(false);
                  setHypothetical(null);
                  setIsExample(false);
                  setCostYear("");
                  setProvenance("Your own estimates");
                  setRestrictions("");
                }}
              >
                <option value="">Custom scenario</option>
                {universities.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-label">
              Currency
              <select
                aria-label="Currency"
                value={currency}
                onChange={(e) => resetAmounts(e.target.value as Currency)}
              >
                {["USD", "EUR", "GBP", "KZT"].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
          </div>
          {u && (
            <div className="inline-note">
              <ShieldCheck size={16} />
              <p>
                {u.name}:{" "}
                {u.meetsFullNeed.value
                  ? "meets institution-calculated need"
                  : "funding policy needs verification"}
                . This does not establish your award.{" "}
                <Link href={`/universities/${u.id}#financial-aid`}>
                  View policy
                </Link>
              </p>
            </div>
          )}
          <div className="form-section-label">
            <span>01</span> COST OF ATTENDANCE{" "}
            <span className="tag neutral">Your estimates · {currency}</span>
          </div>
          <p className="tiny-note">
            Enter annual estimates in one currency. Leave an unknown cost blank;
            enter 0 only when it is genuinely zero. Published cost baselines and
            their years are on university profiles.
          </p>
          <div className="form-grid">
            <label className="field-label">
              Cost academic year
              <input
                value={costYear}
                maxLength={100}
                placeholder="For example, 2027–28"
                onChange={(e) => setCostYear(e.target.value)}
              />
            </label>
            <label className="field-label">
              Cost source / assumptions
              <textarea
                value={provenance}
                maxLength={2000}
                onChange={(e) => setProvenance(e.target.value)}
              />
            </label>
          </div>
          {u && findDossier(u.id) && (
            <p className="tiny-note">
              Published reference: {findDossier(u.id)!.costs.year} ·{" "}
              {findDossier(u.id)!.costs.total === null
                ? "Total not verified"
                : money(findDossier(u.id)!.costs.total!, u.costCurrency)}
              .{" "}
              <Link href={`/universities/${u.id}#estimated-cost`}>
                Review components and exclusions before entering estimates
              </Link>
              .
            </p>
          )}
          <div className="form-grid">
            {costKeys.map((k) => (
              <label className="field-label" key={k}>
                {costLabels[k]}
                <div className="amount-input">
                  <span>{currency}</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    aria-label={costLabels[k]}
                    placeholder="Unknown"
                    value={costs[k] ?? ""}
                    onChange={(e) => {
                      setCosts({ ...costs, [k]: readNumber(e.target.value) });
                      setIsExample(false);
                    }}
                  />
                </div>
              </label>
            ))}
          </div>
          <div className="form-section-label">
            <span>02</span> YOUR CONTRIBUTION
          </div>
          <label className="field-label">
            Maximum annual contribution ({currency})
            <input
              type="number"
              min="0"
              step="0.01"
              value={contribution ?? ""}
              placeholder="Unknown"
              aria-describedby={
                result?.contributionError
                  ? "contribution-help contribution-error"
                  : "contribution-help"
              }
              aria-invalid={!!result?.contributionError}
              onChange={(e) => setContribution(readNumber(e.target.value))}
            />
          </label>
          <p className="tiny-note" id="contribution-help">
            The amount you or your family can pay each year. Blank means
            unknown; 0 means no contribution. Your budget gap needs this amount,
            but your cost total does not.
          </p>
          {result?.contributionError && (
            <p id="contribution-error" className="form-error" role="alert">
              {result?.contributionError}
            </p>
          )}
          <div className="form-section-label">
            <span>03</span> YOUR FUNDING
          </div>
          <label className="field-label">
            Confirmed annual grant / scholarship ({currency})
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Unknown — no award received"
              value={confirmed ?? ""}
              aria-invalid={!!awardError}
              aria-describedby={awardError ? "award-error" : undefined}
              onChange={(e) => setConfirmed(readNumber(e.target.value))}
            />
          </label>
          {awardError && (
            <p id="award-error" className="form-error" role="alert">
              {awardError}
            </p>
          )}
          <label className="check-label">
            <input
              type="checkbox"
              checked={attested}
              onChange={(e) => setAttested(e.target.checked)}
            />
            I have a written award offer for this annual amount and currency.
          </label>
          <p className="tiny-note">
            Self-reported from your offer; AidMap does not verify award
            documents. Eligibility, loans and student employment are not
            confirmed grants.
          </p>
          <label className="field-label hypothetical-input">
            Optional hypothetical total award ({currency})
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Explore a what-if scenario"
              value={hypothetical ?? ""}
              aria-invalid={!!hypotheticalError}
              aria-describedby={
                hypotheticalError ? "hypothetical-error" : undefined
              }
              onChange={(e) => setHypothetical(readNumber(e.target.value))}
            />
          </label>
          {hypotheticalError && (
            <p id="hypothetical-error" className="form-error" role="alert">
              {hypotheticalError}
            </p>
          )}
          <label className="field-label">
            Grant restrictions and renewal assumptions
            <textarea
              value={restrictions}
              maxLength={2000}
              placeholder="For example, tuition-only; renewal subject to annual review"
              onChange={(e) => setRestrictions(e.target.value)}
            />
          </label>
          <p className="tiny-note">
            Shown separately. This is a hypothetical total award, not an
            addition to a confirmed award.
          </p>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
        </section>
        <aside className="calculator-output">
          <div className="panel funding-result">
            <div className="result-heading">
              <span className="eyebrow">YOUR FUNDING PICTURE</span>
              <span className="tag neutral">ANNUAL · {currency}</span>
            </div>
            {isExample && (
              <div className="notice amber-notice">
                Illustrative example only. These are synthetic numbers, not
                university costs.
              </div>
            )}
            <span className="result-label">
              Total estimated cost of attendance
            </span>
            <strong className="result-total" data-testid="total-cost">
              {result?.total === null || !result
                ? "Not yet known"
                : money(result.total, currency)}
            </strong>
            <p className="tiny-note">
              {result?.missing.length
                ? `${countLabel(result.missing.length, "cost category", "cost categories")} still unknown. Known subtotal: ${money(result.knownCost, currency)}.`
                : "Based on your entered estimates, not verified institutional costs."}
            </p>
            {result?.total !== null && result && !error && result.total > 0 && (
              <div
                className="cost-chart"
                role="img"
                aria-label={costKeys
                  .map(
                    (k) =>
                      `${costLabels[k]}: ${money(costs[k] ?? 0, currency)}`,
                  )
                  .join("; ")}
              >
                <ResponsiveContainer width="100%" height={40} minWidth={0}>
                  <BarChart
                    layout="vertical"
                    data={[{ ...costs }]}
                    margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                  >
                    <XAxis type="number" hide />
                    <YAxis type="category" hide />
                    <Tooltip formatter={(v) => money(Number(v), currency)} />
                    {costKeys.map((k, i) => (
                      <Bar
                        key={k}
                        dataKey={k}
                        name={costLabels[k]}
                        stackId="cost"
                        fill={colors[i]}
                        isAnimationActive={false}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="cost-legend">
              {costKeys.map((k, i) => (
                <div key={k}>
                  <span style={{ background: colors[i] }} />
                  {costLabels[k]}
                  <strong>
                    {costs[k] === null ? "Unknown" : money(costs[k]!, currency)}
                  </strong>
                </div>
              ))}
            </div>
            <div className="funding-math">
              <div>
                <span>Confirmed award applied</span>
                <strong>
                  {attested && awardError
                    ? "Check award entry"
                    : attested && confirmed !== null
                      ? money(confirmed, currency)
                      : "No confirmed award"}
                </strong>
              </div>
              <div>
                <span>Remaining unfunded cost</span>
                <strong data-testid="remaining-cost">
                  {result?.remaining == null || error
                    ? "Insufficient information"
                    : money(result.remaining, currency)}
                </strong>
              </div>
              <div>
                <span>Your annual contribution</span>
                <strong>
                  {result?.contributionError
                    ? "Check your entry"
                    : contribution === null
                      ? "Unknown"
                      : money(contribution, currency)}
                </strong>
              </div>
              <div className="gap-row">
                <span>Above your stated budget</span>
                <strong data-testid="budget-gap">
                  {result?.aboveBudget == null || error
                    ? "Unknown"
                    : money(result.aboveBudget, currency)}
                </strong>
              </div>
            </div>
            <div className="risk-note">
              <Info size={17} />
              <p>
                {!result || result.total === null
                  ? "Add every cost category to estimate the funding gap. Missing costs cannot be assumed to be zero."
                  : attested && awardError
                    ? "Your total costs are calculated above. Correct the confirmed award to calculate remaining cost."
                    : result.contributionUnknown
                      ? "Your expenses are calculated above. Enter a valid annual contribution to calculate your budget gap."
                      : result.aboveBudget! > 0
                        ? "This scenario leaves a gap above your budget. Additional confirmed support or a lower-cost option would be needed."
                        : "Your entered amounts fit your stated budget. Verify costs, award conditions, renewal and payment timing before making a commitment."}
                {result?.awardUnknown &&
                  " No individual award is known; the base case subtracts no speculative aid."}
              </p>
            </div>
            {result?.remaining != null &&
              result.aboveBudget != null &&
              !error && (
                <p className="calculation-summary">
                  Your estimated annual expenses after confirmed aid are{" "}
                  {money(result.remaining, currency)}. Your stated contribution
                  is {money(contribution!, currency)}, leaving a{" "}
                  {money(result.aboveBudget, currency)} funding gap.
                </p>
              )}
            {hypotheticalResult && (
              <div className="hypothetical-result">
                <span className="tag amber">WHAT IF · NOT CONFIRMED</span>
                <h3>
                  With a hypothetical {money(hypothetical!, currency)} award
                </h3>
                <p>
                  Remaining cost:{" "}
                  <strong>
                    {hypotheticalResult.remaining === null
                      ? "Unknown"
                      : money(hypotheticalResult.remaining, currency)}
                  </strong>
                </p>
                <p>
                  Above budget:{" "}
                  <strong>
                    {hypotheticalResult.aboveBudget === null
                      ? "Unknown"
                      : money(hypotheticalResult.aboveBudget, currency)}
                  </strong>
                </p>
                <small>
                  This assumption does not change the base calculation above.
                </small>
              </div>
            )}
            <label className="field-label">
              Scenario name
              <input
                value={name}
                maxLength={100}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <Button
              className="full-width"
              disabled={
                !!error ||
                !!awardError ||
                !!hypotheticalError ||
                !!result?.contributionError ||
                !name.trim() ||
                blocked
              }
              onClick={() => {
                const scenario: FundingScenario = {
                  id: editingId ?? crypto.randomUUID(),
                  name: name.trim(),
                  universityId,
                  currency,
                  costs,
                  contribution,
                  confirmedAward: attested ? confirmed : null,
                  hypotheticalAward: hypothetical,
                  createdAt:
                    state.scenarios.find((s) => s.id === editingId)
                      ?.createdAt ?? new Date().toISOString(),
                  costYear,
                  provenance,
                  restrictions,
                };
                const accepted = update((s) => ({
                  ...s,
                  scenarios: s.scenarios.some((item) => item.id === editingId)
                    ? s.scenarios.map((item) =>
                        item.id === editingId ? scenario : item,
                      )
                    : [...s.scenarios, scenario],
                }));
                if (accepted) {
                  setEditingId(scenario.id);
                  toast("Funding scenario saved to your dashboard.");
                }
              }}
            >
              <Bookmark size={16} />
              {editingId ? "Update funding scenario" : "Save funding scenario"}
            </Button>
            {editingId && (
              <button className="text-link" onClick={() => setEditingId(null)}>
                Create a separate scenario from these assumptions
              </button>
            )}
          </div>
          <div className="panel example-panel">
            <CircleHelp size={21} />
            <h3>Want to see how it works?</h3>
            <p>
              Try a clearly labeled example with synthetic annual costs and a
              hypothetical full-tuition award.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditingId(null);
                setUniversityId("");
                setCurrency("USD");
                setCosts({ ...exampleCosts });
                setConfirmed(null);
                setAttested(false);
                setHypothetical(50000);
                setContribution(5000);
                setName("Illustrative full-tuition scenario");
                setIsExample(true);
                setCostYear("Illustrative year");
                setProvenance("Synthetic example, not university costs");
                setRestrictions("Hypothetical award; no renewal assumed.");
              }}
            >
              Load illustrative example
              <ArrowRight size={14} />
            </Button>
          </div>
          {state.scenarios.length > 0 && (
            <div className="panel">
              <h3>Your saved scenarios</h3>
              {state.scenarios.map((s) => (
                <button
                  className="saved-scenario-link"
                  key={s.id}
                  onClick={() => loadScenario(s)}
                >
                  {s.name}
                  <ArrowRight size={14} />
                </button>
              ))}
            </div>
          )}
        </aside>
      </div>
      <ScenarioComparison onLoad={loadScenario} />
      <div className="notice">
        <ShieldCheck size={18} />
        <p>
          One currency per scenario. Changing the currency clears amounts;
          AidMap does not convert them. An institutional need assessment can
          differ from the amount you can comfortably contribute.
        </p>
      </div>
    </div>
  );
}
