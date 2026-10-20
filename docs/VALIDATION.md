# AidMap 2.0 validation record

Local verification: **October 20, 2026**. Node 24.19.0, pnpm 11.25.0, Next.js 16.4.2, Microsoft Edge through Playwright. The starting source was preserved in local Git checkpoint `1335cba`; no remote push or deployment was performed for this review.

| Command | Observed result |
|---|---|
| `pnpm test` | 68 passed: 37 existing/domain tests and 31 review regression tests |
| `pnpm validate:data` | 30 universities and 397 field-level evidence records validated |
| `pnpm lint` | Passed without warnings or errors |
| `pnpm typecheck` | Passed against generated production route types |
| `pnpm build` | Passed with Webpack; 43 generated pages, including 30 university profiles |
| `pnpm start` | Production server ran on http://127.0.0.1:3000 |
| `$env:PLAYWRIGHT_CHANNEL = 'msedge'; pnpm test:e2e` | 27 passed against the production build in 2.4 minutes: 9 scenarios at each of 3 sizes |
| `$env:PLAYWRIGHT_CHANNEL = 'msedge'; node scripts/capture-preview.mjs` | 8 updated curated screenshots; no uncaught page exceptions |
| `pnpm exec tsx scripts/review-data.ts --check-links` | 152 URLs checked: 129 successful HTTP responses, 1 HTTP 404, 22 access-limited/failed/manual checks |
| `pnpm exec tsx scripts/review-data.ts --keep-link-results` | Coverage refreshed after the source-status correction; retained the October 20 HTTP results |
| `git diff --check` | Passed |

The last source edit marks Swarthmore merit eligibility unknown after a historical PDF returned 404. Unit tests, data validation and the production build were rerun after that change; no interaction behavior changed. The full browser run covered the final interface and application logic before this single data-status correction.

## Covered behavior

- AM-004: blank contribution stays unknown; explicit zero means zero. Saved blank scenarios restore as blank.
- AM-005: invalid contribution leaves known cost totals intact, displays an error and blocks saving.
- AND across filter groups, OR within groups, SAT/ACT enums, English alternatives and exemptions, source/program scope, unknown result inclusion, reset, URL reload persistence and mobile drawer focus/Escape.
- SAT medians/ranges never become eligibility cutoffs. Scholarship English minimums never become admission evidence. No cross-currency cost comparisons.
- Current intake, historical/yearless dates, conflicting dates and source relationships. Past or unverified dates cannot be added as upcoming planner deadlines. Confirmation cancellation and acceptance are both exercised.
- Save/compare/calculate/plan end-to-end; custom dates persist after navigation, reload, JSON export, reset and restore.
- Actual downloaded JSON and CSV contents are inspected. JSON is restored and compared with the original workspace. Invalid import preserves stored data. Only isolated test contexts are reset; the user's own browser data is not accessed.
- Four-school comparison limit, task updates, preferences and theme persistence, corrupted storage protection.
- Desktop 1440×900, tablet 768×1024, mobile 390×844. Route overflow, native help keyboard operation, mobile dialog focus, and 200% CSS zoom reflow on the university profile.

## Failures found and resolved during work

The baseline unit suite passed 37 tests. The first browser attempt was blocked by sandbox child-process/loopback behavior, so it was not reported as a pass. Local browser tests then ran in the approved execution environment.

Intermediate runs exposed a controlled-checkbox update delay and zoom overflow. Filters now subscribe synchronously to URL changes while retaining Next navigation integration; the header, footer and long buttons reflow. TypeScript inference errors in the report and tests were corrected. Test locators were aligned with actual accessible labels, and the historical-date test uses Szeged's historical admission deadline (Luiss has a valid current admission date).

One development run captured a Next Fast Refresh router initialization error while files were being reformatted. The final complete run used the stable production server and reported no captured console/page errors in the main journey. No failed result was relabeled as a success.

## Visual and privacy checks

Reviewed desktop/tablet/mobile explorer and calculator captures. Improved secondary text sizes and removed an empty error banner. Updated curated home, explorer, profile, calculator and dark-theme images in `docs/screenshots/`; all use empty or explicitly synthetic test workspaces.

Scoped source review found no applicant-upload endpoint, analytics integration, outbound application fetch, embedded private key, common API token pattern or personal applicant data. Runtime applicant information remains browser-local. `.vercelignore` continues to exclude local credentials, exports, screenshots, documentation and caches. This is a scoped review, not a comprehensive penetration test or dependency vulnerability audit.

## Limits

Chromium emulation is not physical-device, Safari, Firefox or screen-reader certification. Automated data validation proves structure and evidence relationships, not the correctness of every admissions claim. Reachable URLs can still have anti-bot pages; 200 is not content verification. See `DATA_REVIEW.md` for all gaps, including the unresolved Swarthmore PDF and other access failures.

The existing protected Vercel URL still serves the previous deployment. This version was not uploaded, promoted or made public. A new protected Preview requires owner permission and a fresh protection/upload-manifest check.

Final post-build smoke check: `/universities/swarthmore` returned HTTP 200, the institutional merit row rendered `Not yet verified`, and the isolated browser reported no page exceptions. The final local production server was left running on port 3000 for review.

## Subsequent access change — October 20, 2026

The owner authorized public access to the already deployed version only. Its existing deployment and alias were retained; Vercel Authentication was disabled and confirmed by API readback. Anonymous checks passed on five routes and an isolated browser verified search/calculator without page errors. AidMap 2.0 remains local; no upload or deployment occurred. See VERCEL_PREVIEW.md for current access and historical protection records.
