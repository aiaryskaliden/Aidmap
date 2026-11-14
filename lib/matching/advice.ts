import { fieldStatus, nextAdmissionDeadline } from "@/lib/admissions";
import { researchedSATContext } from "@/data/cds-sat-2025";
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

  const mbzuai = shortlisted.find((u) => u.id === "mbzuai");
  if (mbzuai) {
    const total = profile?.sat ?? null;
    const math = profile?.satMath ?? null;
    if (total !== null && math !== null && total >= 1400 && math >= 760) {
      add(
        "mbzuai-waiver",
        "MBZUAI — request a screening exam waiver",
        "High",
        "Your reported SAT total and Math scores satisfy the published numerical criteria for a possible screening-exam waiver. Approval requires the university to review verifiable evidence. This is not a guarantee of admission.",
        "Provide verified SAT evidence and confirm the screening-exam waiver decision through the official MBZUAI process.",
      );
    } else {
      add(
        "mbzuai-waiver",
        "MBZUAI — review the screening exam pathway",
        "High",
        "MBZUAI lists a possible waiver for SAT total 1400+ together with SAT Math 760+, plus alternative qualifying routes. SAT is optional for admission. Check both scores and the other exemption rules.",
        "Review official screening-exam criteria and prepare the exam or valid waiver evidence.",
      );
    }
  }

  const historicalBelow = shortlisted
    .map((u) => ({ u, data: researchedSATContext(u) }))
    .filter(({ data }) => profile?.sat !== null && profile?.sat !== undefined &&
      !!data && profile.sat < data.p25);
  if (historicalBelow.length) {
    const example = historicalBelow[0];
    add(
      "sat-context",
      "SAT context — review one of your saved schools",
      "Medium",
      `Your recorded SAT is below the 25th percentile of enrolled score-submitters at ${example.u.name} (${example.data!.p25}). This is historical context, not a cutoff or a rejection prediction. Improving SAT may be useful if time allows, but do not ignore essays, grades, recommendations or other application factors.`,
      "Check the university\u2019s current test policy and the official 25th–75th percentile data before deciding whether to retake a test.",
    );
  }

  const verifiedDates = shortlisted
    .map((u) => ({ u, date: nextAdmissionDeadline(u)?.date }))
    .filter((x): x is { u: University; date: string } => !!x.date)
    .sort((a, b) => a.date.localeCompare(b.date));
  if (verifiedDates.length) {
    const nearest = verifiedDates[0];
    add(
      "deadline",
      `Nearest sourced application date — ${nearest.u.shortName}`,
      "High",
      `The next verified admission date recorded for ${nearest.u.name} is ${nearest.date}. Confirm its exact round, time zone and applicant route on the official page; scholarship deadlines can be earlier or separate.`,
      "Review official application and scholarship deadlines; add personal reminders to the planner.",
    );
  }

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
