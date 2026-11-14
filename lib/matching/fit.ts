import { fieldStatus, normalizeMajor } from "@/lib/admissions";
import type { ApplicantProfile, Fact, University } from "@/types/domain";

export type FitSignal = {
  label: string;
  status: "match" | "check" | "mismatch";
  detail: string;
  weight: number;
};

export type FitAssessment = {
  score: number | null;
  coverage: number;
  signals: FitSignal[];
  nextSteps: string[];
};

function usable<T>(field: Fact<T>, university: University) {
  const status = fieldStatus(field, university);
  return status === "verified_current" || status === "official_general";
}

/**
 * Fit is an explanatory checklist, NOT an estimate of admission probability.
 * Unknown/previous-cycle criteria do not count as verified evidence.
 */
export function assessUniversityFit(
  university: University,
  profile: ApplicantProfile | null,
): FitAssessment {
  if (!profile || profile.isDemo)
    return {
      score: null,
      coverage: 0,
      signals: [],
      nextSteps: ["Save your real preferences to see an evidence-backed match checklist."],
    };

  const signals: FitSignal[] = [];
  const steps: string[] = [];
  let earned = 0;
  let evaluated = 0;
  const add = (
    label: string,
    weight: number,
    status: FitSignal["status"],
    detail: string,
    earnedPoints = weight,
  ) => {
    signals.push({ label, weight, status, detail });
    if (status !== "check") {
      evaluated += weight;
      if (status === "match") earned += earnedPoints;
    }
  };

  if (!profile.major) {
    add("Intended subject", 30, "check", "Choose an intended subject in your profile.");
    steps.push("Choose a field of study so the matcher can check published program options.");
  } else if (
    usable(university.programs, university) &&
    university.programs.value?.some((p) => normalizeMajor(p) === normalizeMajor(profile.major))
  ) {
    add("Subject", 30, "match", "Your subject appears in the university's sourced undergraduate subject list. Confirm the exact degree.");
  } else {
    add("Subject", 30, "check", "Your subject is not confirmed in the selected program list; this does not establish that it is unavailable.");
    steps.push(`Confirm that ${university.name} offers your exact intended degree and study track.`);
  }

  if (profile.targetCountries.length) {
    if (profile.targetCountries.includes(university.country))
      add("Location", 15, "match", "This university is in one of your preferred countries.");
    else
      add("Location", 15, "mismatch", "This location is outside your selected countries.");
  } else add("Location", 15, "check", "Add preferred countries if location is important to you.");

  if (
    profile.sat !== null &&
    university.satPolicy.value !== "not-accepted" &&
    usable(university.satMinimum, university) &&
    university.satMinimum.value !== null
  ) {
    const enough = profile.sat >= university.satMinimum.value;
    add("SAT published minimum", 20, enough ? "match" : "mismatch",
      `Your SAT ${profile.sat} vs published minimum ${university.satMinimum.value}. This is a threshold comparison, not a selection forecast.`);
    if (!enough) steps.push("Check alternative admission routes and the institution's current testing rules.");
  } else {
    add("SAT evidence", 20, "check",
      university.satPolicy.value === "not-accepted"
        ? "SAT is not considered under this policy."
        : "No applicable current/general SAT minimum has been verified for a score comparison.");
    if (profile.sat === null) steps.push("Add SAT/ACT information only if it is relevant to the university's application route.");
  }

  const hasLanguageScopeConflict =
    university.englishMinimums.scope?.purpose !== undefined &&
    (university.englishMinimums.scope.purpose !== "admission" ||
      (profile.major &&
        !university.englishMinimums.scope.subjects.includes(normalizeMajor(profile.major))));

  const matchingMinimum = usable(university.englishMinimums, university) && !hasLanguageScopeConflict
    ? university.englishMinimums.value?.find(
        (entry) => entry.test === profile.englishTest && entry.kind === "minimum",
      )
    : undefined;

  if (
    profile.englishTest &&
    profile.englishScore !== null &&
    matchingMinimum
  ) {
    const enough = profile.englishScore >= matchingMinimum.score;
    add("English minimum", 20, enough ? "match" : "mismatch",
      `${profile.englishTest} ${profile.englishScore} vs published minimum ${matchingMinimum.score}. Confirm test version, sub-score and exemption conditions.`);
    if (!enough) steps.push("Review the English-test requirements and plan a retake or qualifying alternative.");
  } else {
    add("English requirements", 20, "check",
      "No directly comparable, verified admission minimum for your test and degree is available.");
    steps.push("Confirm accepted English tests, section minimums and any exemptions on the official admissions page.");
  }

  const aid = profile.aidPreference === "Need-based"
    ? university.internationalAid
    : profile.aidPreference === "Merit"
      ? university.meritAid
      : university.meritAid.value === true
        ? university.meritAid
        : university.internationalAid;
  if (usable(aid, university) && aid.value !== null) {
    add("Scholarship policy", 15, aid.value ? "match" : "mismatch",
      aid.value
        ? "A relevant type of funding is documented; individual eligibility, amount and award remain unknown."
        : "This funding type is not offered under the cited policy.");
  } else {
    add("Scholarships", 15, "check", "Relevant funding and its applicant-specific conditions need verification.");
  }

  steps.push("Check the official deadline, required documents, scholarship coverage and renewal conditions.");
  steps.push("Strengthen your application with verifiable project outcomes, thoughtful essays and evidence of sustained work.");

  const coverage = Math.round(evaluated);
  return {
    score: evaluated >= 45 ? Math.round(earned) : null,
    coverage,
    signals,
    nextSteps: [...new Set(steps)],
  };
}
