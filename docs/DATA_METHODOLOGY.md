# Research and verification policy

Initial review date: **2026-10-18**. Target entry cycle: **Fall 2027**. Scope: first-year international undergraduate research, not transfer admission or graduate funding.

## How records were assembled

Official admissions, financial aid and academic department pages were opened and read. Each recorded finding retains its field, value, official URL, page title, check date, explicit cycle (or null), and a paraphrased condition/uncertainty note in `research-universities.json`. No third-party scholarship database, logos, photos or rankings were copied.

`data/universities.ts` normalizes findings into `Fact<T>` objects. A fact contains a nullable value, source IDs, cycle and note. Source entries retain supported field names, official URL, title, date, cycle and verification status. Where several source entries clarify one field (for example an aid-form exception), their notes and references are combined. The UI shows the final Regular Decision aid date; earlier-round findings remain in the source list. Aid dates are never used as admission dates.

The dataset validator rejects duplicate records/source IDs, absent references, unsupported field-to-source relationships, invalid URLs/dates, negative numeric values, and cost values without a source/cycle. Schema validity cannot prove the source is accurate: editorial source review remains essential.

## Official source starting points

These links are entry points; the raw findings retain the exact source for each claim.

| Institution | International aid policy                                                                                   | Important context                                                                                                                                                                                                                                      |
| ----------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Harvard     | [How aid works](https://college.harvard.edu/financial-aid/how-aid-works)                                   | International applicants can seek need-based aid. [Prospective-student instructions](https://college.harvard.edu/financial-aid/apply-financial-aid/prospective-students) carry 2027–28 form and aid-date details.                                      |
| Yale        | [International students](https://admissions.yale.edu/international)                                        | [Aid instructions](https://finaid.yale.edu/apply/prospective) and [FAQ](https://finaid.yale.edu/faq) require attention to the individualized international process; CSS is supplied when requested.                                                    |
| Princeton   | [International students](https://admission.princeton.edu/apply/international-students)                     | [Standardized testing](https://admission.princeton.edu/apply/standardized-testing) explicitly retains test-optional admission for Fall 2027. The aid instructions contain an inconsistent tax-year deadline table; no dated aid deadline was inferred. |
| MIT         | [International financial aid](https://sfs.mit.edu/undergraduate-students/apply-for-aid/international/)     | General policy and CSS/IDOC instructions are not silently assigned to Fall 2027.                                                                                                                                                                       |
| Amherst     | [International applicants](https://www.amherst.edu/admission/apply/international)                          | Merit policy remains unconfirmed where the available explicit source was historical. Exact reviewed URLs are retained in the raw findings.                                                                                                             |
| Dartmouth   | [International students](https://financialaid.dartmouth.edu/apply-aid/international-students)              | Country-specific document submission rules and fee-hardship alternatives require reading the detailed source notes.                                                                                                                                    |
| Bowdoin     | [International student aid](https://www.bowdoin.edu/student-aid/apply-for-aid/international-students.html) | Class of 2031 non-Canadian applicants generally follow post-admission document instructions; Canadians have a different checklist. Waitlist/transfer admission may be need-aware.                                                                      |
| Brown       | [International financial aid](https://admission.brown.edu/international/financial-aid)                     | Current first-year need-blind policy and older-cohort aid restrictions differ. The 2027–28 form instructions have CSS/IDOC and fee details.                                                                                                            |

## Unknowns and deliberate exclusions

- Every institution's Fall 2027 cost categories and total are null.
- Admission deadlines were not verified in this research; no year was attached to generic dates.
- Application platform, application fee, fee-waiver availability and application plans remain null pending independent verification.
- Full demonstrated need is **not** evidence of an explicit full-tuition or full-cost scholarship award. These award flags remain null.
- Academic subjects are a small sample verified in official directories, not a complete program inventory. An empty Business or Europe result is a coverage limitation, not a claim that no such options exist.
- Institutional policies are shown as policies. Individual competitive scholarship records, award amounts and renewal terms are not invented.
- First-year citizenship exceptions must be reviewed by the applicant; broad international aid eligibility is not a country-by-country eligibility guarantee.

## Maintenance procedure

1. Open the exact official admissions/aid page and check it applies to first-year international applicants.
2. Capture the precise field, value, caveats, URL, title and check date.
3. Assign a cycle only if the source explicitly establishes it. Keep general policy distinct from cycle-specific deadlines, amounts and forms.
4. Preserve source conflicts as notes and null values until resolved with the institution.
5. Run `pnpm validate:data`, `pnpm test` and `pnpm typecheck`; inspect the rendered profile and filters.
6. Mark historical evidence as needing rechecking rather than advancing its check date without a new review.

The initial check date does not imply indefinite freshness. Review all cycle-sensitive claims before opening the product to applicants, and again before their deadlines.
