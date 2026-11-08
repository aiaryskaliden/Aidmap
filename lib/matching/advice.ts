import { fieldStatus } from "@/lib/admissions";
import type { ApplicantProfile, University } from "@/types/domain";

export type ApplicationAdvice = {
  id: string;
  title: string;
  priority: "High" | "Medium";
  explanation: string;
  checklist: string;
};

/** Privacy-first advice. No documents or profile data are sent to an AI service. */
export function applicationAdvice(
  profile: ApplicantProfile | null,
  shortlisted: University[],
): ApplicationAdvice[] {
  const a: ApplicationAdvice[] = [];
  const add = (id: string, title: string, priority: ApplicationAdvice["priority"], explanation: string, checklist: string) =>
    a.push({ id, title, priority, explanation, checklist });

  add(
    "cv",
    "Evidence-based CV and project portfolio",
    "High",
    "Show what you personally built, your technical decisions, measurable outcomes and working links. Keep rankings and awards accurate and verifiable.",
    "CV updated; two relevant projects link to a working demo or repository and clearly distinguish completed from planned functionality.",
  );

  const englishShortfall = shortlisted.some(
    (u) => profile?.englishTest && profile.englishScore !== null &&
      u.englishMinimums.scope?.purpose !== "scholarship" &&
      (fieldStatus(u.englishMinimums, u) === "verified_current" ||
        fieldStatus(u.englishMinimums, u) === "official_general") &&
      (u.englishMinimums.value ?? []).some(
        (m) => m.test === profile.englishTest && m.kind === "minimum" &&
          profile.englishScore! < m.score,
      ),
  );
  if (!profile?.englishTest || profile.englishScore === null || englishShortfall) {
    add(
      "language",
      "Confirm English proficiency requirements",
      "High",
      englishShortfall
        ? "At least one saved university has a published minimum higher than your recorded score. Review acceptable tests and section requirements."
        : "Check whether your saved universities accept your test, have section minima, or allow an exemption.",
      "Official English rules checked; exam dates and result reporting planned where needed.",
    );
  } else {
    add(
      "language",
      "Double-check English score reporting",
      "Medium",
      "Meeting an overall minimum is not the same as meeting every section, program or scholarship condition. Check report delivery and validity dates.",
      "Valid report and section requirements confirmed for each application.",
    );
  }

  add(
    "essays",
    "Personal statement and university fit",
    "High",
    "Use one credible experience to explain what you learned, what changed, and why this particular university or major makes sense. Avoid lists of achievements or generic praise.",
    "School-specific essay reviewed against its prompt and word limit, with concrete examples and accurate institutional references.",
  );
  add(
    "recommendations",
    "Recommendation letters",
    "High",
    "Choose referees who know your development firsthand. Send them a short context sheet and verify any required signature, upload method and deadline.",
    "Referees confirmed; letters meet the target university rules and have the necessary signatures.",
  );
  add(
    "academics",
    "Transcripts and qualifications",
    "High",
    "Confirm that grades, predicted results, school name, graduation date and translations match official records. Different admission routes can require different documents.",
    "Required transcripts, graduation/enrollment proof and certified translations prepared where required.",
  );
  add(
    "achievements",
    "Awards, impact and real users",
    "Medium",
    "A working, tested product with real user feedback is usually stronger evidence than another generic certificate. Document what you tested and improved; do not imply awards before they are confirmed.",
    "Evidence portfolio contains verifiable awards, honest project metrics, and feedback or test notes from actual users.",
  );
  add(
    "scholarships",
    "Separate scholarship requirements",
    "High",
    "An admission offer and an award are not the same decision. Verify what is paid for, separate forms, restrictions, annual renewal and deadlines for every saved institution.",
    "Scholarship eligibility, application steps, coverage and renewal rules checked with official sources.",
  );
  if (shortlisted.length === 0)
    add(
      "shortlist",
      "Build a balanced shortlist",
      "Medium",
      "Save a mix of universities that suit your academic goals and practical funding needs. A high match score is not a chance of admission.",
      "Initial shortlist saved with official application and scholarship pages.",
    );
  else
    add(
      "shortlist",
      "Turn saved options into submitted applications",
      "Medium",
      "Track submission status, requirements and personal dates in your planner. Verify deadlines by cycle rather than relying on old calendars.",
      "Every saved university has an application stage, required-document checklist and verified deadline or explicit reminder to confirm it.",
    );
  return a;
}
