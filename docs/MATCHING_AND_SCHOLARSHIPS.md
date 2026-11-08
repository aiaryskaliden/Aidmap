# AidMap matching and scholarship design (Nov 2026)

## Scope and safeguards
- The `/match` page compares saved, optional academic preferences with source-backed criteria. It is **not** an admission-chance estimator and never produces a calibrated admission probability.
- Formula: subject 30, preferred country 15, SAT *verified minimum* 20, English *verified admission minimum* 20, documented relevant scholarship policy 15. A category with insufficient evidence is excluded from the numerator and denominator. A fit percentage appears only if **at least 45 of the 100 available evidence points** can be evaluated. Evidence coverage is displayed separately; low coverage does not imply a good match.
- Meeting test thresholds does not guarantee selection. A short researched subject list is not an exhaustive university catalogue, and a missing program does not prove that it is unavailable. No unsupported conversion of GPA, award amount or chance of admission is performed.
- `/improve` gives private, rule-based advice for real projects, academic records, test score reporting, essays, CVs, recommendations and scholarship processes. Checkmarks use the existing browser-local `preparation` field; no API upload or account is involved.
- Source-based funding coverage, application steps and renewal information appear on each university page. The existing cost calculator is optional and remains backward-compatible, but is no longer a primary navigation item.

## Newly researched institutions
- **CUHK-Shenzhen (China)** — qualifications, English standards, 2027 regular/late application rounds, merit scholarships: https://intladmissions.cuhk.edu.cn/en/page/190 and https://intladmissions.cuhk.edu.cn/en/page/18
- **MBZUAI (UAE)** — BSc AI, English minimum, regular decision and possible merit/need award coverage: https://mbzuai.ac.ae/admissions/undergraduate-admissions
- **Nazarbayev University (Kazakhstan)** — CS/AI tracks and separate 2027 financial-support process: https://nu.edu.kz/admissions/how-to-apply/foundation-undergraduate/financial-aid-end-scholarships/
- **HKU (Hong Kong)** — undergraduate Computing & Data Science, international application fee and historical, year-qualified scholarship reference: https://www.admissions.hku.hk/programmes/undergraduate-programmes/computing-and-data-science

All source checks are dated 2026-11-08 and preserve program/aid distinctions where relevant. Data is a *starting set*, not a claim that full tuition, eligibility, deadlines, scholarship renewals or fees have all been verified. Unknown fields remain null. The 2026 HKU merit reference is not used as current-cycle evidence in matching.

## Future work
- Real admission probabilities would require outcome-labelled cohorts, program-specific calibration, hold-out validation, disclosure of uncertainty/bias, and user testing. Do not label the fit percentage as chance of admission.
- AI API document feedback requires the owner's service choice, secured server-side key, cost limits, content/safety checks, explicit opt-in before sharing submitted text, and a transparent retention policy. No service is connected today.
- Add more countries, verify all entry-cycle requirements, gather feedback from actual applicants, add accessible mobile browser tests, and preserve local data before any future account sync.
- Run `pnpm lint`, `pnpm typecheck`, `pnpm validate:data`, `pnpm test`, `pnpm test:e2e` and `pnpm build` on a machine with dependencies available. Do not deploy to the existing public alias without a separate review/authorization.
