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
  const [universityId, setUniversityId] = useState(
    saved?.universityId ?? params.get("university") ?? "",
  );
  const [currency, setCurrency] = useState<Currency>(saved?.currency ?? "USD");
  const [costs, setCosts] = useState<CostItems>(
    saved?.costs ?? findUniversity(universityId)?.costs ?? { ...emptyCosts },
  );
  const [contribution, setContribution] = useState(
    saved?.contribution ??
      (state.profile?.currency === "USD" ? (state.profile?.budget ?? 0) : 0),
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
  const [isExample, setIsExample] = useState(false);
  const u = findUniversity(universityId);
  let error = "";
  let result: ReturnType<typeof calculateFunding> | null = null;
  let hypotheticalResult: ReturnType<typeof hypotheticalFunding> | null = null;
  try {
    result = calculateFunding(
      costs,
      currency,
      contribution,
      attested && confirmed !== null
        ? { amount: confirmed, currency, kind: "confirmed" }
        : null,
    );
    if (hypothetical !== null)
      hypotheticalResult = hypotheticalFunding(
        costs,
        currency,
        contribution,
        hypothetical,
      );
    if (confirmed !== null && !amountSchema.safeParse(confirmed).success)
      throw new Error(
        "Confirmed awards must be between 0 and 1 trillion in the selected currency.",
      );
  } catch (e) {
    error = e instanceof Error ? e.message : "Check your values.";
  }
  const readNumber = (v: string) => (v.trim() === "" ? null : Number(v));
  function resetAmounts(next: Currency) {
    setCurrency(next);
    setCosts({ ...emptyCosts });
    setContribution(0);
    setConfirmed(null);
    setAttested(false);
    setHypothetical(null);
    setIsExample(false);
    toast("Currency changed. Amounts cleared; no exchange rate was applied.");
  }
  function loadScenario(s: FundingScenario) {
    setUniversityId(s.universityId);
    setCurrency(s.currency);
    setCosts(s.costs);
    setContribution(s.contribution);
    setConfirmed(s.confirmedAward);
    setAttested(s.confirmedAward !== null);
    setHypothetical(s.hypotheticalAward);
    setName(s.name);
    setIsExample(false);
  }
  return (
    <div className="page-container calculator-page">
      <PageHeading
        eyebrow="AIDMAP / THE WHOLE FINANCIAL PICTURE"
        title="Big plans. Clear numbers."
        description="Understand what’s covered, what remains, and what still needs an answer."
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
                setCosts({ ...emptyCosts });
                setConfirmed(null);
                setHypothetical(null);
                setContribution(0);
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
                value={universityId}
                onChange={(e) => {
                  setUniversityId(e.target.value);
                  setCosts({ ...emptyCosts });
                  setConfirmed(null);
                  setAttested(false);
                  setHypothetical(null);
                  setIsExample(false);
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
            Fall 2027 institutional costs are not yet verified. Enter your own
            annual estimates; enter 0 only when a cost is genuinely zero.
          </p>
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
              value={contribution}
              onChange={(e) => setContribution(Number(e.target.value))}
            />
          </label>
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
              onChange={(e) => setConfirmed(readNumber(e.target.value))}
            />
          </label>
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
              onChange={(e) => setHypothetical(readNumber(e.target.value))}
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
                ? `${result.missing.length} cost categories still unknown. Known subtotal: ${money(result.knownCost, currency)}.`
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
                  {attested && confirmed !== null
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
                <strong>{money(contribution, currency)}</strong>
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
                  : result.aboveBudget! > 0
                    ? "This scenario leaves a gap above your budget. Additional confirmed support or a lower-cost option would be needed."
                    : "Your entered amounts fit your stated budget. Verify costs, award conditions, renewal and payment timing before making a commitment."}
                {result?.awardUnknown &&
                  " No individual award is known; the base case subtracts no speculative aid."}
              </p>
            </div>
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
              disabled={!!error || !name.trim() || blocked}
              onClick={() => {
                const scenario: FundingScenario = {
                  id: crypto.randomUUID(),
                  name: name.trim(),
                  universityId,
                  currency,
                  costs,
                  contribution,
                  confirmedAward: attested ? confirmed : null,
                  hypotheticalAward: hypothetical,
                  createdAt: new Date().toISOString(),
                };
                const accepted = update((s) => ({
                  ...s,
                  scenarios: [...s.scenarios, scenario],
                }));
                if (accepted)
                  toast("Funding scenario saved to your dashboard.");
              }}
            >
              <Bookmark size={16} />
              Save funding scenario
            </Button>
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
                setUniversityId("");
                setCurrency("USD");
                setCosts({ ...exampleCosts });
                setConfirmed(null);
                setAttested(false);
                setHypothetical(50000);
                setContribution(5000);
                setName("Illustrative full-tuition scenario");
                setIsExample(true);
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
