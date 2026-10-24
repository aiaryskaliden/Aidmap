import type { AdmissionsDossier } from "@/types/admissions";
import type { ApplicantProfile } from "@/types/domain";
export function scorePosition(
  score: number | null,
  range: [number, number] | null,
) {
  if (score === null || !range) return null;
  return score < range[0] ? "Below" : score > range[1] ? "Above" : "Within";
}
export function languageContext(
  d: AdmissionsDossier,
  p: ApplicantProfile | null,
) {
  const rule = d.english.waiver;
  if (!p || !rule)
    return "Your individual English-test applicability is unresolved. Review the university’s conditions below.";
  if (rule.nativeEnglish && p.nativeEnglish === true)
    return "Your self-reported first language may meet this exemption. Confirm the university’s definition and reporting instructions.";
  if (rule.englishMediumYears !== null && p.englishMediumYears != null) {
    if (p.englishMediumYears >= rule.englishMediumYears)
      return `You report ${p.englishMediumYears} recent consecutive years of secondary education taught in English. This may meet the ${rule.englishMediumYears}-year duration condition; check all conditions and any waiver request below.`;
    return `Your reported English-medium schooling is shorter than this university’s ${rule.englishMediumYears}-year condition. Other exemptions may apply.`;
  }
  return "Add optional language-of-instruction context in Preferences to compare the duration condition. Citizenship alone does not establish an exemption.";
}
