import type { ApplicantProfile, University } from "@/types/domain";
import { englishAdvice, normalizeMajor } from "@/lib/admissions";
import { findDossier } from "@/data/core-admissions";
import { languageContext, scorePosition } from "@/lib/academic-context";
export function matchUniversity(
  university: University,
  profile: ApplicantProfile | null,
) {
  const reasons: { category: string; text: string }[] = [];
  if (!profile) return reasons;
  if (profile.targetCountries.includes(university.country))
    reasons.push({
      category: "Country preference",
      text: `Located in ${university.country}, one of your preferred destinations.`,
    });
  else if (profile.targetCountries.length)
    reasons.push({
      category: "Destination mismatch",
      text: `${university.country} is outside your selected destinations.`,
    });
  if (
    profile.major &&
    university.programs.value?.some(
      (p) =>
        normalizeMajor(p).toLowerCase() ===
        normalizeMajor(profile.major).toLowerCase(),
    )
  )
    reasons.push({
      category: "Academic interest match",
      text: `Offers ${profile.major}. Check the department's curriculum and degree requirements.`,
    });
  else if (profile.major)
    reasons.push({
      category: "Subject not confirmed",
      text: `A matching undergraduate option for ${profile.major} is not confirmed in the researched subject list. Review the academic directory; related fields and minors are distinct from majors.`,
    });
  if (
    university.internationalAid.value === true &&
    profile.aidPreference !== "Merit"
  )
    reasons.push({
      category: "Funding policy match",
      text: "Provides need-based aid to eligible international applicants. Your individual award is unknown.",
    });
  if (profile.aidPreference === "Merit" && university.meritAid.value === false)
    reasons.push({
      category: "Funding preference mismatch",
      text: "This institution does not offer institutional merit scholarships.",
    });
  if (university.internationalAid.value === null)
    reasons.push({
      category: "Funding information unavailable",
      text: "International aid eligibility has not been verified.",
    });
  if (profile.budget !== null)
    reasons.push({
      category: "Affordability not established",
      text: "Your budget cannot establish affordability until complete costs and an individual award are known. No currency conversion is assumed.",
    });
  const dossier = findDossier(university.id);
  if (dossier) {
    const position = scorePosition(profile.sat, dossier.scores.satComposite);
    const actPosition = scorePosition(profile.act, dossier.scores.actComposite);
    reasons.push({
      category: "Historical score context",
      text: position
        ? `Your SAT is ${position.toLowerCase()} the published middle 50% (${dossier.scores.satComposite!.join("–")}; ${dossier.scores.cohort}). ${dossier.scores.population}. This does not predict admission.`
        : actPosition
          ? `Your ACT is ${actPosition.toLowerCase()} the published middle 50% (${dossier.scores.actComposite!.join("–")}; ${dossier.scores.cohort}). ${dossier.scores.population}. This does not predict admission.`
          : "No comparison is available for your entered scores and the published composite ranges. Section distributions cannot be added into a composite range.",
    });
  }
  reasons.push({
    category: "English requirement",
    text: dossier
      ? `${languageContext(dossier, profile)} ${dossier.english.text}`
      : englishAdvice(
          university,
          profile.englishTest,
          profile.englishScore,
          profile.major,
        ),
  });
  reasons.push({
    category: "Requirements need verification",
    text: "Review cycle-specific tests, deadlines and citizenship restrictions. This is a research match, not an admission prediction.",
  });
  return reasons;
}
