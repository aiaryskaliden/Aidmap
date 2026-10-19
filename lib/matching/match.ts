import type { ApplicantProfile, University } from "@/types/domain";
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
  if (
    profile.major &&
    university.programs.value?.some(
      (p) => p.toLowerCase() === profile.major.toLowerCase(),
    )
  )
    reasons.push({
      category: "Academic interest match",
      text: `Offers ${profile.major}. Check the department's curriculum and degree requirements.`,
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
  reasons.push({
    category: "Requirements need verification",
    text: "Review cycle-specific tests, deadlines and citizenship restrictions. This is a research match, not an admission prediction.",
  });
  return reasons;
}
