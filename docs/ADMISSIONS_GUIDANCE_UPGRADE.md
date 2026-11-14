# AidMap admissions guidance upgrade — November 2026

## User-facing changes

- **Application roadmaps** on every university profile distinguish student-owned tasks from school/counselor/teacher submissions. Required and conditional tasks remain separate; a draft is never marked as submitted.
- **SAT score context** adds official 2025 enrolled first-year SAT-submitters' 25th, median, and 75th percentile profiles for MIT, Princeton and Dartmouth. Other previously researched ranges remain as dated references. These statistics are **not cutoffs or probabilities**.
- **MBZUAI screening exam**: 1400+ SAT composite AND 760+ SAT Math are both required for its SAT-based *possible screening-exam waiver*, not undergraduate admission. The waiver requires verifiable proof and an institutional decision. Alternative Olympiad/ACT routes may apply. A screening waiver may also qualify for an application-fee waiver.
- **Academic profile**: optional SAT Math score (no existing profile migration required).
- **Matching**: score is now aligned evidence points from 100 possible criteria points; unverified items earn no points and no 100% scores from partial evidence. Evidence coverage remains separate. Neither measure predicts admission.
- **Advice**: saved-school SAT comparison, exam waiver route, and next verified admission deadline added to generic CV/essay/recommender preparation checklists.

## AI Advisor: code staged but NOT activated

- UI lives inside `/improve` and each university profile.
- `GET /api/advisor` returns whether a model and key are configured, without exposing credentials.
- `POST /api/advisor` requires the student to explicitly opt in and sends **only the text they type and selected institution's public research**.
- No passport, transcript, profile, SAT/IELTS result, notes or applicant documents are sent automatically. Do not enter sensitive information into the question.
- External model must stick to supplied official links, mark uncertainty, provide concrete action steps, and never produce an unsupported chance-of-admission percentage.
- Auth uses server-only `AI_GATEWAY_API_KEY`; provider/model selection uses `AI_GATEWAY_MODEL`. Neither should be added to Git or pasted into chat.
- There is a small in-memory rate limiter, but it **does not work reliably across distributed serverless instances**. Before public activation, configure a proper shared rate limiter or Vercel Firewall, AI Gateway team/project spend cap, and abuse monitoring.
- To activate: owner chooses a current text model after reviewing official Gateway model catalog and data handling, creates a restricted key in Vercel, sets `AI_GATEWAY_API_KEY` and `AI_GATEWAY_MODEL` in Vercel project environment settings and configures spending limits. Then test in protected Preview and monitor costs. **Do not enable a paid service without approval.**

## Source records

- MIT CDS 2025-26: https://ir.mit.edu/projects/2025-26-common-data-set/
- Princeton CDS 2025-26: https://ir.princeton.edu/sites/g/files/toruqf2041/files/documents/CDS_2526_Princeton_v2.pdf
- Dartmouth CDS 2025-26: https://www.dartmouth.edu/oir/pdfs/cds_2025-26.pdf
- MBZUAI admissions: https://mbzuai.ac.ae/admissions/undergraduate-admissions

Data is from enrolled first-year score submitters and is not a current applicant threshold. Universities outside the American CDS ecosystem may use different reporting schemes or publish no median. Missing data must remain labeled as missing rather than guessed.

## Validation before any release

Run `pnpm lint`, `pnpm typecheck`, `pnpm validate:data`, `pnpm test`, `pnpm build` and browser tests including mobile. Verify no regression in local profile, backups, school reporting, and scholarship data. Existing public site must not be replaced until tested and owner-approved.
