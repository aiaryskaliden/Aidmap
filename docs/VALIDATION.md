# Validation record

Validated locally on **October 18, 2026** using Node **24.19.0**, pnpm **11.25.0**, Next.js **16.4.2**, React **19.3.1**, and Microsoft Edge through Playwright.

| Command                                           | Result                                                                                          |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `pnpm lint`                                       | Passed, no warnings or errors                                                                   |
| `pnpm typecheck`                                  | Passed, strict TypeScript                                                                       |
| `pnpm validate:data`                              | Passed: 8 universities, 81 field-level evidence entries                                         |
| `pnpm test`                                       | Passed: 37 unit tests                                                                           |
| `$env:PLAYWRIGHT_CHANNEL='msedge'; pnpm test:e2e` | Passed: 8 tests, desktop and mobile viewport                                                    |
| `pnpm build`                                      | Passed with Webpack; 20 generated pages including framework pages and eight university profiles |
| `pnpm start --port 3002`                          | Production server started successfully for local preview                                        |

## What the automated tests establish

- Financial arithmetic, decimal precision, full-tuition vs total costs, unknown costs/awards, hypothetical isolation, same-currency handling, invalid/oversized values.
- Search and combined filters, international aid filtering, conservative full-tuition and cost/deadline filters, explainable matching without admissions probabilities.
- Shortlist persistence, four-school comparison cap, task editing/completion/status, JSON round-trips, corrupt/unsupported data fallback, duplicate validation and CSV escaping.
- Eight source-backed records with field references; negative values, duplicate IDs, unsupported evidence relationships and missing cost metadata fail validation.
- A desktop/mobile student can open the home page, discover/filter Princeton, open its profile, save it, compare it with Harvard, enter a contribution, inspect the funding breakdown, save a scenario, see it on the dashboard, add/edit/complete a task, set a status/date, and reload without losing the work.
- Demo preferences, export/import with confirmation preview, data reset, theme persistence, comparison limits and corrupt-data preservation work in the browser.
- All ten product routes were checked for document-level horizontal overflow at desktop and mobile viewport sizes. Internal comparison/board scrolling is intentional.
- The main student journey captures console errors and uncaught page exceptions; the passing run reported none.

## Visual review

Playwright screenshots cover desktop and mobile home, filtered explorer, university details, comparison, calculator, populated dashboard and application tracker. Files from automated journeys are in ignored `test-results/`; curated screenshots are in `docs/screenshots/`.

The curated capture script was also run against the production server on port 3002, with an isolated browser workspace. It captured eight desktop/mobile and dark-theme screenshots without uncaught page exceptions.

The desktop preferences page initially overflowed because a global input rule overrode the hidden file input's width. An explicit accessible visually-hidden class fixed it, and both viewport suites subsequently passed. The long filter panel now scrolls within a bounded desktop sidebar or collapsible mobile panel. Final screenshot review also identified an external-link rule overriding the official-site button's text color; restricting that rule to non-button links restored the label's contrast.

## Verification limits

- Mobile testing uses Chromium device/viewport emulation, not physical hardware or Safari. Firefox and screen-reader audits are not completed.
- Automated data validation establishes schema consistency, not independent editorial correctness. Official source claims and cycle-specific caveats still require institutional review before application decisions.
- A protected Vercel Preview was subsequently deployed and verified; see [VERCEL_PREVIEW.md](VERCEL_PREVIEW.md). Its remote production-mode build passed. Anonymous requests redirect to authentication, an authenticated homepage request returned 200, and the owner-authorized temporary initialization placeholder was deleted. No applicant data was uploaded.
- Turbopack's production CSS worker failed on this Windows host. `pnpm build` uses the supported Webpack option and completes successfully. Development uses the default Next.js bundler.
- Managed Windows sandbox networking initially prevented loopback browser testing; the successful tests ran in the approved local execution environment.
