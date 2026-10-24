# SAT and IELTS benchmarks

Implemented on 23 October 2026 and included in the owner-authorized public Preview release. The personalized website URL was updated on 24 October. See [the release record](VERCEL_PREVIEW.md).

Every university card and profile now has a SAT/IELTS summary, with matching comparison rows. Profile summaries link directly to official evidence. SAT medians, middle-50% ranges and route-specific minimums have separate labels. IELTS guidance distinguishes minimum, recommendation, typical range and expected minimum; English-evidence applicability is displayed independently of the score.

## Verified coverage

- All 30 catalog universities render a summary, including explicit unknowns.
- SAT: 15 published composite medians, 17 middle-50% ranges, and 2 route-specific minimums.
- IELTS: 26 universities have sourced policy guidance; 19 have numerical guidance. The others do not receive an invented score.
- New research and exact source URLs are stored in `data/research-testing.json`. Existing core evidence remains in the three core research files.

Historical figures refer to the named cohort, not the Fall 2027 applicant pool. SAT submitter statistics are not international-only. Duke and Brown use admitted-student ranges; CDS figures describe enrolled score submitters. UChicago, Notre Dame and Swarthmore currently use verified 2024–25 CDS baselines. Harvard and Wesleyan section statistics are not summed into a composite median.

IELTS guidance for Swarthmore, UChicago, Bologna and Luiss remains unverified in this view. Some official admissions/CDS pages could not be retrieved. Program and route scope is retained for European universities; Bocconi's English-taught program certificate threshold is an enrollment condition. Amsterdam admission guidance is distinct from the existing scholarship evidence. Notre Dame's conflicting recommended/required wording is disclosed.

## Validation

Unit coverage checks source references, score bounds, unknown handling, median/range separation, IELTS minimum/recommendation/typical semantics, strict “above 7” wording and program/enrollment scope. Browser coverage exercises discovery links, profile evidence and comparisons on desktop, tablet and mobile.

Published-minimum filtering uses the same sourced IELTS data. Recommendations are not treated as minima; program-specific values require a matching selected subject, and enrollment-only thresholds do not become admission thresholds. Unknown numeric guidance remains unknown.
