"use client";
import { useRef, useState } from "react";
import { countLabel } from "@/lib/format";
import {
  Download,
  Upload,
  ShieldCheck,
  Trash2,
  Save,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { useApp } from "@/components/providers";
import {
  blankProfile,
  profileSchema,
  storageSchema,
  type ApplicantProfile,
  type LocalState,
} from "@/types/domain";
import {
  academicFields,
  findUniversity,
  universities,
  opportunities,
} from "@/data/universities";
import { emptyState, shortlistCSV, STORAGE_KEY } from "@/lib/storage/state";
import { PageHeading, LocalNote } from "@/components/ui/shared";
import { WorkspaceNav } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
const countries = [
  "Kazakhstan",
  "Kyrgyzstan",
  "Uzbekistan",
  "Tajikistan",
  "Turkmenistan",
  "India",
  "Pakistan",
  "China",
  "United States",
  "Canada",
  "United Kingdom",
  "Germany",
  "France",
  "Nigeria",
  "Brazil",
  "Other",
];
function download(content: string, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function PreferencesForm() {
  const { state, update, toast, blocked } = useApp();
  const [profile, setProfile] = useState<ApplicantProfile>(
    state.profile ?? { ...blankProfile },
  );
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const field = <K extends keyof ApplicantProfile>(
    key: K,
    value: ApplicantProfile[K],
  ) => {
    setProfile((p) => ({ ...p, [key]: value }));
    setSaved(false);
  };
  const number = (v: string) => (v === "" ? null : Number(v));
  function demo() {
    setProfile({
      citizenship: "Kazakhstan",
      targetCountries: ["United States"],
      major: "Computer Science",
      entryYear: 2027,
      sat: 1450,
      act: null,
      englishTest: "IELTS",
      englishScore: 7,
      gradingScale: "5.0",
      grades: "4.7",
      budget: 5000,
      currency: "USD",
      aidPreference: "Need-based",
      priorities: ["Substantial funding"],
      isDemo: true,
    });
    setSaved(false);
    setError("");
    toast("Synthetic demo loaded. Save it to use these sample preferences.");
  }
  return (
    <form
      className="profile-form panel"
      onSubmit={(e) => {
        e.preventDefault();
        const parsed = profileSchema.safeParse(profile);
        if (!parsed.success) {
          setError(parsed.error.issues.map((i) => i.message).join(" "));
          return;
        }
        update((s) => ({ ...s, profile: parsed.data }));
        setError("");
        setSaved(true);
        toast("Preferences saved locally.");
      }}
    >
      <div className="panel-heading">
        <h2>Your direction, in a few details.</h2>
        <Button type="button" variant="outline" size="sm" onClick={demo}>
          <Sparkles size={15} />
          Load demo profile
        </Button>
      </div>
      {profile.isDemo && (
        <div className="notice amber-notice">
          Synthetic demo profile · These sample values do not describe you.{" "}
          <button
            type="button"
            className="text-link"
            onClick={() => {
              setProfile({ ...blankProfile });
              setSaved(false);
            }}
          >
            Start with a blank profile
          </button>
        </div>
      )}
      <p className="muted">
        Every field is optional. Add what helps your research; we don’t infer
        admission chances or convert grades between systems.
      </p>
      <div className="form-section-label">
        <span>01</span> WHERE YOU’RE HEADING
      </div>
      <div className="form-grid">
        <label className="field-label">
          Citizenship country
          <select
            value={profile.citizenship}
            onChange={(e) => field("citizenship", e.target.value)}
          >
            <option value="">Prefer not to say / choose later</option>
            {countries.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="field-label">
          Intended undergraduate subject
          <select
            value={profile.major}
            onChange={(e) => field("major", e.target.value)}
          >
            <option value="">Still exploring</option>
            {academicFields.map((s) => (
              <option key={s}>{s}</option>
            ))}
            <option>Business</option>
            <option>Other</option>
          </select>
        </label>
        <label className="field-label">
          Entry year
          <select
            value={profile.entryYear}
            onChange={(e) => field("entryYear", Number(e.target.value))}
          >
            {[2027, 2028, 2029].map((y) => (
              <option key={y}>{y}</option>
            ))}
          </select>
          <small>Current research targets Fall 2027.</small>
        </label>
      </div>
      <fieldset>
        <legend>Target study countries</legend>
        <div className="country-checks">
          {[
            "United States",
            "United Kingdom",
            "Germany",
            "Netherlands",
            "France",
          ].map((c) => (
            <label className="check-label" key={c}>
              <input
                type="checkbox"
                checked={profile.targetCountries.includes(c)}
                onChange={() =>
                  field(
                    "targetCountries",
                    profile.targetCountries.includes(c)
                      ? profile.targetCountries.filter((x) => x !== c)
                      : [...profile.targetCountries, c],
                  )
                }
              />
              {c}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="form-section-label">
        <span>02</span> YOUR ACADEMIC CONTEXT{" "}
        <span className="tag neutral">Optional</span>
      </div>
      <div className="form-grid">
        <label className="field-label">
          SAT score
          <input
            type="number"
            min="400"
            max="1600"
            placeholder="400–1600"
            value={profile.sat ?? ""}
            onChange={(e) => field("sat", number(e.target.value))}
          />
        </label>
        <label className="field-label">
          ACT score
          <input
            type="number"
            min="1"
            max="36"
            placeholder="1–36"
            value={profile.act ?? ""}
            onChange={(e) => field("act", number(e.target.value))}
          />
        </label>
        <label className="field-label">
          English test
          <select
            value={profile.englishTest}
            onChange={(e) => {
              field(
                "englishTest",
                e.target.value as ApplicantProfile["englishTest"],
              );
              field("englishScore", null);
            }}
          >
            <option value="">Not provided</option>
            <option>IELTS</option>
            <option>TOEFL</option>
            <option>Duolingo</option>
          </select>
        </label>
        <label className="field-label">
          Recent consecutive secondary-school years taught primarily in English
          (optional)
          <input
            type="number"
            min="0"
            max="20"
            step="1"
            value={profile.englishMediumYears ?? ""}
            onChange={(e) =>
              field("englishMediumYears", number(e.target.value))
            }
          />
          <small>
            Language of instruction, not English-language classes. Each
            university defines its own exemption.
          </small>
        </label>
        <label className="field-label">
          Is English your first language? (optional)
          <select
            value={
              profile.nativeEnglish == null
                ? ""
                : profile.nativeEnglish
                  ? "yes"
                  : "no"
            }
            onChange={(e) =>
              field(
                "nativeEnglish",
                e.target.value === "" ? null : e.target.value === "yes",
              )
            }
          >
            <option value="">Not provided</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </label>
        <label className="field-label">
          English test score
          <input
            type="number"
            min="0"
            step="0.5"
            placeholder={
              profile.englishTest === "IELTS"
                ? "0–9"
                : profile.englishTest === "TOEFL"
                  ? profile.toeflScale === "6"
                    ? "1–6"
                    : "0–120"
                  : "Test score"
            }
            value={profile.englishScore ?? ""}
            onChange={(e) => field("englishScore", number(e.target.value))}
          />
        </label>
        {profile.englishTest === "TOEFL" && (
          <label className="field-label">
            TOEFL score scale
            <select
              value={profile.toeflScale ?? "120"}
              onChange={(e) => {
                field("toeflScale", e.target.value as "120" | "6");
                field("englishScore", null);
              }}
            >
              <option value="120">0–120</option>
              <option value="6">1–6</option>
            </select>
            <small>
              Use the scale on your score report. Scores are not converted.
            </small>
          </label>
        )}
        <label className="field-label">
          School grading scale
          <select
            value={profile.gradingScale}
            onChange={(e) =>
              field(
                "gradingScale",
                e.target.value as ApplicantProfile["gradingScale"],
              )
            }
          >
            <option value="">Select your actual scale</option>
            {["4.0", "5.0", "10", "100", "Other"].map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </label>
        <label className="field-label">
          Your school grade
          <input
            value={profile.grades}
            maxLength={100}
            placeholder="As reported by your school"
            onChange={(e) => field("grades", e.target.value)}
          />
        </label>
      </div>
      <div className="inline-note">
        <ShieldCheck size={17} />
        <p>
          Grades and test scores are context only. We do not convert them to a
          US GPA or predict admission.
        </p>
      </div>
      <div className="form-section-label">
        <span>03</span> FUNDING & PRIORITIES
      </div>
      <div className="form-grid">
        <label className="field-label">
          Maximum annual contribution
          <input
            type="number"
            min="0"
            max="10000000"
            placeholder="Optional planning budget"
            value={profile.budget ?? ""}
            onChange={(e) => field("budget", number(e.target.value))}
          />
        </label>
        <label className="field-label">
          Budget currency
          <select
            value={profile.currency}
            onChange={(e) => {
              field("currency", e.target.value as ApplicantProfile["currency"]);
              field("budget", null);
            }}
          >
            {["USD", "EUR", "GBP", "KZT"].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="field-label">
          Funding preference
          <select
            value={profile.aidPreference}
            onChange={(e) =>
              field(
                "aidPreference",
                e.target.value as ApplicantProfile["aidPreference"],
              )
            }
          >
            {["Any", "Need-based", "Merit"].map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
        </label>
      </div>
      <fieldset>
        <legend>What matters most?</legend>
        <div className="country-checks">
          {[
            "Substantial funding",
            "Academic interest",
            "Location",
            "Clear requirements",
          ].map((p) => (
            <label className="check-label" key={p}>
              <input
                type="checkbox"
                checked={profile.priorities.includes(p)}
                onChange={() =>
                  field(
                    "priorities",
                    profile.priorities.includes(p)
                      ? profile.priorities.filter((x) => x !== p)
                      : [...profile.priorities, p],
                  )
                }
              />
              {p}
            </label>
          ))}
        </div>
      </fieldset>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="form-actions">
        <Button type="submit" disabled={blocked}>
          <Save size={16} />
          Save preferences
        </Button>
        {saved && (
          <span className="success-text" role="status">
            Saved to this browser
          </span>
        )}
      </div>
    </form>
  );
}
function DataControls() {
  const { state, replace, toast, blocked } = useApp();
  const input = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<LocalState | null>(null);
  const [error, setError] = useState("");
  return (
    <section className="panel data-controls" id="data">
      <div className="eyebrow">YOUR WORKSPACE. YOUR CONTROL.</div>
      <h2>Privacy & saved data</h2>
      <p>
        Your preferences, shortlist, notes and budgets are stored only in this
        browser’s local storage. No account, analytics or applicant data upload
        is used. Anyone using this browser profile may be able to see them.
        Clearing site data removes them; keep an export if you want a backup.
      </p>
      <p>
        We don’t ask for identity documents, financial statements, passwords, or
        detailed family income. Opening an official source takes you to that
        site’s own privacy policy.
      </p>
      <div className="data-buttons">
        <Button
          variant="outline"
          onClick={() =>
            download(
              JSON.stringify(state, null, 2),
              "aidmap-planning-backup.json",
              "application/json",
            )
          }
        >
          <Download size={16} />
          Export planning data (JSON)
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            download(
              shortlistCSV(
                state.saved.map((s) => ({
                  name: findUniversity(s.universityId)?.name ?? s.universityId,
                  country: findUniversity(s.universityId)?.country ?? "Unknown",
                  status: s.status,
                  deadline: s.deadline,
                })),
              ),
              "aidmap-shortlist.csv",
              "text/csv;charset=utf-8",
            )
          }
        >
          <Download size={16} />
          Export shortlist (CSV)
        </Button>
        <Button variant="outline" onClick={() => input.current?.click()}>
          <Upload size={16} />
          Import a backup
        </Button>
        {blocked && (
          <Button
            variant="outline"
            onClick={() => {
              try {
                download(
                  localStorage.getItem(STORAGE_KEY) ?? "",
                  "aidmap-original-unreadable-data.json",
                  "application/json",
                );
              } catch {
                setError(
                  "Browser storage is inaccessible; the original data could not be exported.",
                );
              }
            }}
          >
            Export original unreadable data
          </Button>
        )}
      </div>
      <input
        className="sr-only"
        ref={input}
        type="file"
        accept=".json,application/json"
        aria-label="Choose planning backup"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          setPending(null);
          setError("");
          try {
            if (file.size > 1000000)
              throw new Error("Backup is too large. Use a file under 1 MB.");
            const result = storageSchema.parse(JSON.parse(await file.text()));
            const ids = new Set(universities.map((u) => u.id));
            const fundingIds = new Set(opportunities.map((o) => o.id));
            if (
              result.saved.some((u) => !ids.has(u.universityId)) ||
              result.compare.some((id) => !ids.has(id)) ||
              result.savedFunding.some((id) => !fundingIds.has(id)) ||
              result.scenarios.some(
                (s) => s.universityId && !ids.has(s.universityId),
              )
            )
              throw new Error(
                "This backup references institutions not present in this version of AidMap.",
              );
            setPending(result);
          } catch (err) {
            setError(
              err instanceof SyntaxError
                ? "This file is not valid JSON."
                : err instanceof Error && !("issues" in err)
                  ? err.message
                  : "The backup does not match AidMap’s supported version or contains invalid values.",
            );
          }
        }}
      />
      {pending && (
        <div className="import-preview">
          <h3>Review your backup</h3>
          <p>
            {countLabel(pending.saved.length, "university", "universities")} ·{" "}
            {countLabel(pending.scenarios.length, "scenario")} ·{" "}
            {countLabel(
              pending.saved.reduce((s, u) => s + u.tasks.length, 0),
              "task",
            )}
          </p>
          <p>
            Importing replaces the current workspace, including preferences and
            theme. Export your existing data first if you want to keep it.
          </p>
          <Button
            onClick={() => {
              replace(pending);
              setPending(null);
              toast("Backup imported successfully.");
            }}
          >
            Replace workspace with this backup
          </Button>
          <Button variant="ghost" onClick={() => setPending(null)}>
            Cancel
          </Button>
        </div>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="reset-data">
        <div>
          <h3>Start fresh</h3>
          <p>
            Delete all AidMap data from this browser, including preferences,
            plans and scenarios.
          </p>
        </div>
        <Button
          variant="danger"
          onClick={() => {
            if (
              confirm(
                "Delete all saved AidMap data from this browser? Export a backup first if you need it.",
              )
            ) {
              replace(emptyState());
              toast("Local data deleted. Your workspace is now empty.");
            }
          }}
        >
          <Trash2 size={16} />
          Delete all local data
        </Button>
      </div>
    </section>
  );
}
export default function Profile() {
  const { ready, state } = useApp();
  return (
    <div className="page-container workspace-page">
      <WorkspaceNav />
      <PageHeading
        eyebrow="YOUR WORKSPACE / APPLICANT PREFERENCES"
        title="A starting point that’s yours."
        description="Tell us what matters. Get research matches you can understand."
      >
        <LocalNote />
      </PageHeading>
      <div className="profile-layout">
        <div>
          {ready ? (
            <PreferencesForm key={JSON.stringify(state.profile)} />
          ) : (
            <p>Loading your local preferences…</p>
          )}
        </div>
        <aside>
          <div className="panel">
            <span className="icon-box">
              <ShieldCheck size={23} />
            </span>
            <h3>Your data stays with you.</h3>
            <p>
              No sign-up. No documents to upload. No hidden admissions score.
            </p>
            <p>
              Matches explain where your interests and institutional policies
              overlap. They do not establish citizenship-specific eligibility or
              affordability.
            </p>
            <Link href="/about#matching" className="text-link">
              How matching works
              <ArrowRight size={14} />
            </Link>
          </div>
          <div className="sidebar-note">
            <strong>Ready to explore?</strong>
            <p>
              Save your preferences, then discover institutions with your
              interests in mind.
            </p>
            <Link href="/explore">
              Explore universities
              <ArrowRight size={14} />
            </Link>
          </div>
        </aside>
      </div>
      {ready && <DataControls />}
    </div>
  );
}
