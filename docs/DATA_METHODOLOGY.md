# Research and verification policy

Review dates: **2026-10-18 through 2026-10-20**. Target entry cycle: **Fall 2027**. Scope: first-year international undergraduate research, not transfer admission or graduate funding. The current catalogue has 30 institutions in six countries; see [DATA_REVIEW.md](DATA_REVIEW.md) for generated coverage and gaps.

## How records were assembled

Official admissions, financial aid and academic department pages were opened and read. Each recorded finding retains its field, value, official URL, page title, check date, explicit cycle (or null), and a paraphrased condition/uncertainty note in `research-universities.json` and `data/research-*-v2.json`. No third-party scholarship database, logos, photos or rankings were copied. HTTP availability alone is not content verification.

`data/universities.ts` normalizes findings into `Fact<T>` objects. A fact contains a nullable value, source IDs, cycle, note and optional program/purpose scope. Source entries retain supported field names, official URL, title, date, cycle and verification status. Later findings supersede earlier ones for the same field; supplemental notes remain attached. Undergraduate programs use a shared taxonomy with documented degree names in the notes. The profile lists sources supporting displayed claims; the raw research retains the evidence history.

Admission, scholarship and financial aid dates retain their labels and intake. Only explicitly dated, source-backed entries for the selected intake can be imported, after confirmation. Passed, yearless and historical dates cannot be imported as upcoming deadlines. Scholarship/aid dates do not qualify for admission-date filters. General policy, Fall 2026 and Fall 2027 remain distinct. Cost baselines use their published academic year; they are never silently relabeled Fall 2027.

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

- Eight institutions have dated 2026–27 annual cost baselines. Some omit travel, insurance or personal amounts; exclusions remain explicit. No complete Fall 2027 budget is inferred from these totals. Partial tuition does not become total annual cost or a fabricated category breakdown.
- Six profiles have current-cycle dated deadlines of some kind, including scholarship dates. Many others retain historical/yearless references or unknown dates. Fourteen have some current admission information; this does not mean all fields are confirmed.
- Application platform, fee, waiver and document coverage vary by institution. Program-specific requirements stay scoped; an Amsterdam scholarship English threshold does not become an undergraduate admission minimum.
- Full demonstrated need is **not** evidence of an explicit full-tuition or full-cost scholarship award. Such flags require separately published award coverage. Hungarian housing/living stipends do not establish full expense coverage.
- Academic subjects are samples from official undergraduate directories, not complete inventories. Economics is not automatically Business, and an MBA is not undergraduate evidence. Unknown fields produce reviewable unknown results rather than hidden eligibility decisions.
- Competitive scholarships preserve citizenship, applicant-category, income, renewal and separate-application conditions. A null citizenship list is unknown or conditional, never universal eligibility. Erasmus statutory-fee support is EEA-restricted; non-EU applicants must not assume eligibility. Retired Vanderbilt Chancellor awards are excluded from current opportunities.
- First-year citizenship exceptions must be reviewed by the applicant; broad international aid eligibility is not a country-by-country eligibility guarantee.

## Maintenance procedure

1. Open the exact official admissions/aid page and check it applies to first-year international applicants.
2. Capture the precise field, value, caveats, URL, title and check date.
3. Assign a cycle only if the source explicitly establishes it. Keep general policy distinct from cycle-specific deadlines, amounts and forms.
4. Preserve source conflicts as notes and null values until resolved with the institution.
5. Run `pnpm validate:data`, `pnpm test` and `pnpm typecheck`; inspect the rendered profile and filters.
6. Run `pnpm exec tsx scripts/review-data.ts --check-links` to regenerate coverage and reachability reports. Manually investigate HTTP failures; timeouts/403/429 are inconclusive.
7. Mark historical evidence as needing rechecking rather than advancing its check date without a new review. Source conflicts stay explicit; a successful HTTP response does not resolve them.

The initial check date does not imply indefinite freshness. Review all cycle-sensitive claims before opening the product to applicants, and again before their deadlines.
