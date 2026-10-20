"use client";
import { useId } from "react";
import { CircleHelp } from "lucide-react";
export const explanations = {
  needBlind: [
    "Need-blind / need-aware",
    "Need-blind: your ability to pay is not considered when admission is decided. Need-aware: your financial situation may be considered. Neither policy guarantees admission or an award.",
  ],
  fullNeed: [
    "Full need, tuition and full cost",
    "Full demonstrated need means the university may cover the need it calculates. Full tuition covers tuition only. A full-cost award covers additional expenses under its official terms; check exclusions.",
  ],
  testing: [
    "SAT and ACT policies",
    "Required usually means SAT OR ACT, not both. Test-optional means scores are not required under that policy. Flexible means other tests may qualify. A median or middle-50% range describes past students; it is not an eligibility cutoff.",
  ],
  english: [
    "English tests and exemptions",
    "An accepted test is one way to provide evidence, not necessarily a requirement for everyone. Schools may accept alternatives or exempt applicants based on schooling or language of instruction. Check the program and test version.",
  ],
  rounds: [
    "Application rounds",
    "Early Decision is usually binding if admitted, subject to the institution’s agreement. Early Action is generally non-binding but may restrict other early applications. Regular Decision has a fixed round; rolling admission reviews applications over a period.",
  ],
  priority: [
    "Financial aid priority deadline",
    "A recommended date for submitting financial aid materials. It may differ from the admission deadline. Late applications may have reduced funding options; check the university’s policy.",
  ],
  costs: [
    "Contribution and funding gap",
    "Contribution is what you or your family can pay annually. The funding gap is the cost remaining after confirmed aid and that contribution. Unknown amounts stay unknown. Hypothetical awards are shown separately.",
  ],
  sources: [
    "Current and historical information",
    "Verified for Fall 2027 means the source explicitly covers that intake. Previous-cycle data is a reference only. A general official policy still needs an intake check. Published costs use academic years, not application years.",
  ],
  selectivity: [
    "Admission and scholarship selection",
    "Meeting minimum requirements does not guarantee admission. Winning a competitive scholarship is a separate decision. AidMap does not assign admissions chances or label a university safe.",
  ],
} as const;
export function Help({ term }: { term: keyof typeof explanations }) {
  const id = useId();
  const [title, text] = explanations[term];
  return (
    <span className="context-help">
      <button
        type="button"
        className="help-button"
        popoverTarget={id}
        aria-label={`Explain ${title}`}
      >
        <CircleHelp size={16} />
        <span>{title}</span>
      </button>
      <span id={id} popover="auto" className="help-popover">
        <strong>{title}</strong>
        <span>{text}</span>
        <button type="button" popoverTarget={id} popoverTargetAction="hide">
          Close explanation
        </button>
      </span>
    </span>
  );
}
