import { fieldStatus, normalizeMajor, TARGET_INTAKE } from "@/lib/admissions";
import {
  getAdmissionRate,
  ratePercentage,
  type AdmissionRate,
} from "@/lib/admission-rates";
import { cdsSAT2025, researchedSATContext } from "@/data/cds-sat-2025";
import {
  shortlistGroups,
  type ApplicantProfile,
  type ShortlistGroup,
  type University,
} from "@/types/domain";
import {
  checkApplicantReadiness,
  type ApplicantReadinessSchool,
  type Copy,
} from "./reviews";

export const shortlistBands = shortlistGroups;
export type ShortlistBand = ShortlistGroup;

export type ShortlistFitSchool = ApplicantReadinessSchool & {
  id: string;
  satBenchmark: { lowerQuartile: number; year: number } | null;
};

export function shortlistFitSchool(school: University): ShortlistFitSchool {
  const {
    id,
    programs,
    satPolicy,
    satMinimum,
    ielts,
    englishTests,
    annualCost,
    costCurrency,
    costSourceIds,
    sources,
  } = school;
  const sourceIds = new Set([
    ...programs.sourceIds,
    ...satPolicy.sourceIds,
    ...satMinimum.sourceIds,
    ...ielts.sourceIds,
    ...englishTests.sourceIds,
    ...annualCost.sourceIds,
    ...costSourceIds,
  ]);
  const scoreRange = researchedSATContext(school);
  const year = scoreRange?.cohort.match(/\b20\d{2}\b/)?.[0];
  const sourcedRange =
    Object.hasOwn(cdsSAT2025, id) ||
    (!school.satMiddle50.scope &&
      fieldStatus(school.satMiddle50, { sources }) !== "unverified");

  return {
    id,
    programs,
    satPolicy,
    satMinimum,
    ielts,
    englishTests,
    annualCost,
    costCurrency,
    costSourceIds,
    sources: sources.filter((source) => sourceIds.has(source.id)),
    satBenchmark:
      scoreRange && year && sourcedRange
        ? { lowerQuartile: scoreRange.p25, year: Number(year) }
        : null,
  };
}

const reachThreshold = 15;
const defaultEntryYear = Number(TARGET_INTAKE.slice(-4));

function comparableRate(rate: AdmissionRate | undefined, entryYear: number) {
  if (
    rate?.scope === "first-year undergraduate · all applicants" &&
    !rate.scopeNote &&
    !rate.metric &&
    (!rate.term || rate.term === "fall") &&
    rate.year >= entryYear - 3 &&
    rate.year < entryYear
  ) {
    return ratePercentage(rate);
  }
  return null;
}

const reasons = {
  institutionalReach: [
    "The published first-year admit rate is 15% or lower.",
    "В опубликованной статистике доля зачисленных на первый курс — 15% или ниже.",
    "Жарияланған бірінші курсқа қабылдау үлесі 15% немесе одан төмен.",
  ],
  scoreReach: [
    "Your SAT is below the published range for past enrolled SAT submitters.",
    "Ваш SAT ниже опубликованного диапазона баллов поступивших, которые подавали SAT.",
    "SAT балыңыз бұрын оқуға қабылданып, SAT тапсырған студенттердің жарияланған ауқымынан төмен.",
  ],
  target: [
    "Your subject and test evidence support this option. Confirm your exact entry route.",
    "Направление и результаты тестов подходят для рассмотрения. Сверьте требования выбранной программы.",
    "Бағытыңыз бен тест нәтижелеріңіз бұл нұсқаны қарастыруға негіз болады. Нақты бағдарлама шарттарын тексеріңіз.",
  ],
  profile: [
    "Add your academic profile to see your checks.",
    "Заполните учебный профиль, чтобы сверить требования.",
    "Талаптарды тексеру үшін оқу профиліңізді толтырыңыз.",
  ],
  insufficient: [
    "Check programme requirements and funding before grouping this university.",
    "Уточните требования программы и финансирование, чтобы выбрать группу.",
    "Университетті топқа қосар алдында бағдарлама талаптары мен қаржыландыруды тексеріңіз.",
  ],
  funding: [
    "Verify current costs and funding before relying on this option.",
    "Прежде чем рассчитывать на этот вариант, уточните текущую стоимость и финансирование.",
    "Осы нұсқаға сүйенер алдында қазіргі оқу құны мен қаржыландыруды тексеріңіз.",
  ],
} satisfies Record<string, Copy>;

export function shortlistFit(
  school: ShortlistFitSchool,
  profile: ApplicantProfile | null,
) {
  const applicant = profile && !profile.isDemo ? profile : null;
  const entryYear = applicant?.entryYear ?? defaultEntryYear;
  const checks = checkApplicantReadiness(school, applicant);
  const rate = getAdmissionRate(school.id);
  const overallRate = comparableRate(rate, entryYear);
  const result = (suggestedBand: ShortlistBand, reason: Copy) => ({
    suggestedBand,
    aligned: checks.filter((item) => item.state === "aligned").length,
    checked: checks.filter((item) => item.state !== "unknown").length,
    total: checks.length,
    reason,
    rate,
  });

  if (overallRate !== null && overallRate <= reachThreshold) {
    return result("reach", reasons.institutionalReach);
  }
  if (!applicant) return result("unsure", reasons.profile);

  const concern = checks.find((check) => check.state === "review");
  if (concern) return result("unsure", concern.message);

  const satStatus = fieldStatus(school.satPolicy, school, `Fall ${entryYear}`);
  const policyYear = school.satPolicy.cycle?.match(/\b20\d{2}\b/)?.[0];
  const policyScope = school.satPolicy.scope;
  const satRelevant =
    (satStatus === "verified_current" || satStatus === "official_general") &&
    (!policyYear || Number(policyYear) === entryYear) &&
    (school.satPolicy.value === "required" ||
      school.satPolicy.value === "optional") &&
    (!policyScope ||
      (policyScope.purpose === "admission" &&
        policyScope.subjects.includes(normalizeMajor(applicant.major))));
  const benchmark = school.satBenchmark;
  const score = applicant.sat;
  const benchmarkApplies =
    score !== null &&
    benchmark !== null &&
    satRelevant &&
    benchmark.year >= entryYear - 3 &&
    benchmark.year < entryYear;
  if (
    benchmarkApplies &&
    score < benchmark.lowerQuartile &&
    school.satPolicy.value === "required" &&
    applicant.act === null
  ) {
    return result("reach", reasons.scoreReach);
  }

  const supported = (key: (typeof checks)[number]["key"]) =>
    checks.some((check) => check.key === key && check.state === "aligned");
  const academicEvidence =
    (satRelevant && supported("scores")) ||
    (benchmarkApplies && score >= benchmark.lowerQuartile);
  const budgetMatters =
    applicant.budget !== null ||
    applicant.priorities.includes("Substantial funding") ||
    applicant.aidPreference !== "Any";
  if (
    overallRate !== null &&
    rate?.stage === "cohort-summary" &&
    supported("program") &&
    academicEvidence
  ) {
    if (budgetMatters && !supported("annual"))
      return result("unsure", reasons.funding);
    return result("target", reasons.target);
  }

  // Safety remains a user-chosen planning label.
  return result("unsure", reasons.insufficient);
}
