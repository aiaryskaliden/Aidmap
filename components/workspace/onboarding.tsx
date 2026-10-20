"use client";
import { useState } from "react";
import Link from "next/link";
import {
  blankProfile,
  profileSchema,
  type ApplicantProfile,
} from "@/types/domain";
import { academicFields, universities } from "@/data/universities";
import { useApp } from "@/components/providers";
import { PageHeading, LocalNote } from "@/components/ui/shared";
import { Button } from "@/components/ui/button";
import { discoverUniversities } from "@/lib/search";
import { UniversityCard } from "@/components/universities/card";
import { matchUniversity } from "@/lib/matching/match";
export default function Onboarding() {
  const { ready } = useApp();
  return ready ? (
    <Steps />
  ) : (
    <div className="page-container">Loading your preferences…</div>
  );
}
function Steps() {
  const { state, update, blocked, toast } = useApp();
  const [draft, setDraft] = useState<ApplicantProfile>(
    state.profile ?? { ...blankProfile },
  );
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const field = <K extends keyof ApplicantProfile>(
    k: K,
    v: ApplicantProfile[K],
  ) => setDraft((p) => ({ ...p, [k]: v, isDemo: false }));
  const number = (v: string) => (v.trim() === "" ? null : Number(v));
  const filters = {
    major: draft.major,
    intake: `Fall ${draft.entryYear}`,
    aid:
      draft.aidPreference === "Merit"
        ? "merit"
        : draft.aidPreference === "Need-based"
          ? "international"
          : "",
    includeUnknown: "yes",
  };
  const found = discoverUniversities(universities, filters);
  const advance = () => {
    const parsed = profileSchema.safeParse(draft);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setError("");
    setStep((s) => Math.min(3, s + 1));
  };
  return (
    <div className="page-container onboarding-page">
      <PageHeading
        eyebrow="OPTIONAL / YOUR FIRST STEPS"
        title="Find your starting point."
        description="A few optional details help explain relevant opportunities. You can browse freely and edit your preferences later."
      >
        <LocalNote />
      </PageHeading>
      <ol className="onboarding-progress">
        {[
          "Study interests",
          "Your background",
          "Funding needs",
          "Explore options",
        ].map((s, i) => (
          <li key={s} aria-current={step === i ? "step" : undefined}>
            {i + 1}. {s}
          </li>
        ))}
      </ol>
      <section className="panel onboarding-panel">
        {step === 0 && (
          <>
            <h2>What would you like to study?</h2>
            <p>
              We use verified undergraduate fields to narrow your research. Your
              entry year keeps historical dates separate.
            </p>
            <div className="form-grid">
              <label className="field-label">
                Intended subject
                <select
                  value={draft.major}
                  onChange={(e) => field("major", e.target.value)}
                >
                  <option value="">Still exploring</option>
                  {academicFields.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
              <label className="field-label">
                Entry year
                <select
                  value={draft.entryYear}
                  onChange={(e) => field("entryYear", Number(e.target.value))}
                >
                  {[2027, 2028, 2029].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
            </div>
            <p className="tiny-note">
              The catalogue currently focuses on Fall 2027. Later intakes need a
              fresh policy and deadline check.
            </p>
          </>
        )}
        {step === 1 && (
          <>
            <h2>Your academic background</h2>
            <p>
              These details help you review conditions. We do not calculate
              admission chances or convert grades.
            </p>
            <div className="form-grid">
              <label className="field-label">
                Citizenship (optional)
                <input
                  maxLength={100}
                  value={draft.citizenship}
                  onChange={(e) => field("citizenship", e.target.value)}
                  placeholder="Some scholarships restrict citizenship"
                />
              </label>
              <label className="field-label">
                SAT (optional)
                <input
                  type="number"
                  min="400"
                  max="1600"
                  value={draft.sat ?? ""}
                  onChange={(e) => field("sat", number(e.target.value))}
                />
              </label>
              <label className="field-label">
                ACT (optional)
                <input
                  type="number"
                  min="1"
                  max="36"
                  value={draft.act ?? ""}
                  onChange={(e) => field("act", number(e.target.value))}
                />
              </label>
              <label className="field-label">
                English test
                <select
                  value={draft.englishTest}
                  onChange={(e) =>
                    setDraft((p) => ({
                      ...p,
                      englishTest: e.target
                        .value as ApplicantProfile["englishTest"],
                      englishScore: null,
                    }))
                  }
                >
                  <option value="">Not provided</option>
                  <option>IELTS</option>
                  <option>TOEFL</option>
                  <option>Duolingo</option>
                </select>
              </label>
              {draft.englishTest === "TOEFL" && (
                <label className="field-label">
                  TOEFL score scale
                  <select
                    value={draft.toeflScale ?? "120"}
                    onChange={(e) =>
                      setDraft((p) => ({
                        ...p,
                        toeflScale: e.target.value as "120" | "6",
                        englishScore: null,
                      }))
                    }
                  >
                    <option value="120">0–120</option>
                    <option value="6">1–6</option>
                  </select>
                </label>
              )}
              <label className="field-label">
                English score (optional)
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={draft.englishScore ?? ""}
                  onChange={(e) =>
                    field("englishScore", number(e.target.value))
                  }
                />
              </label>
              <label className="field-label">
                School grading scale
                <select
                  value={draft.gradingScale}
                  onChange={(e) =>
                    field(
                      "gradingScale",
                      e.target.value as ApplicantProfile["gradingScale"],
                    )
                  }
                >
                  <option value="">Not provided</option>
                  {["4.0", "5.0", "10", "100", "Other"].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
              <label className="field-label">
                Grade as reported by your school
                <input
                  value={draft.grades}
                  maxLength={100}
                  onChange={(e) => field("grades", e.target.value)}
                />
              </label>
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <h2>What funding do you want to research?</h2>
            <p>
              Your budget stays in this browser. An institution may calculate a
              different contribution when assessing financial need.
            </p>
            <div className="form-grid">
              <label className="field-label">
                Funding preference
                <select
                  value={draft.aidPreference}
                  onChange={(e) =>
                    field(
                      "aidPreference",
                      e.target.value as ApplicantProfile["aidPreference"],
                    )
                  }
                >
                  {["Any", "Need-based", "Merit"].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
              <label className="field-label">
                Annual contribution (optional)
                <input
                  type="number"
                  min="0"
                  value={draft.budget ?? ""}
                  onChange={(e) => field("budget", number(e.target.value))}
                  placeholder="Blank means unknown"
                />
              </label>
              <label className="field-label">
                Currency
                <select
                  value={draft.currency}
                  onChange={(e) =>
                    setDraft((p) => ({
                      ...p,
                      currency: e.target.value as ApplicantProfile["currency"],
                      budget: null,
                    }))
                  }
                >
                  {["USD", "EUR", "GBP", "KZT"].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
            </div>
          </>
        )}
        {step === 3 && (
          <>
            <h2>Your research starting points</h2>
            <p>
              {found.matches.length} verified filter matches and{" "}
              {found.unknown.length} with details to check. Citizenship,
              curriculum, program and funding restrictions still need individual
              review.
            </p>
            <Button
              disabled={blocked}
              onClick={() => {
                const parsed = profileSchema.safeParse(draft);
                if (!parsed.success) {
                  setError(parsed.error.issues[0].message);
                  return;
                }
                if (update((s) => ({ ...s, profile: parsed.data })))
                  toast("Preferences saved locally.");
              }}
            >
              Save these preferences
            </Button>
            <Link
              className="button button-outline"
              href={`/explore?${new URLSearchParams(filters)}`}
            >
              Explore all matching options
            </Link>
          </>
        )}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="form-actions">
          {step > 0 && (
            <Button
              variant="outline"
              onClick={() => {
                setError("");
                setStep((s) => s - 1);
              }}
            >
              Back
            </Button>
          )}
          {step < 3 && (
            <>
              <Button onClick={advance}>Continue</Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setError("");
                  setStep((s) => s + 1);
                }}
              >
                Skip this step
              </Button>
            </>
          )}
          <Link className="text-link" href="/explore">
            Browse without onboarding →
          </Link>
        </div>
      </section>
      {step === 3 && (
        <div className="university-grid onboarding-results">
          {found.results.slice(0, 6).map(({ university: u, unknowns }) => (
            <div key={u.id}>
              <UniversityCard university={u} unknownFilters={unknowns} />
              <div className="match-panel">
                {matchUniversity(u, draft)
                  .slice(0, 3)
                  .map((r) => (
                    <p key={r.category}>
                      <strong>{r.category}: </strong>
                      {r.text}
                    </p>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
