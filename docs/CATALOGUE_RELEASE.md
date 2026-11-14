# Undergraduate catalogue and discovery

## Scope and release status

The November 14 public deployment was built from `e5aa73b` on `codex/catalogue-and-discovery`, which includes the November 10 admissions release. The three catalogue checkpoints are `c3264f8` (46), `97ba831` (58) and `75a6cd4` (70). The final review adds requirements, fees, score conditions and replacement source URLs.

The published catalogue contains 70 distinct undergraduate institutions across 14 destinations, 829 field-level source entries, and 75 funding policies or opportunities. All original 34 IDs remain available. The [live audit](research/live-profile-audit.json) found 34 named profile pages and 36 HTTP 404 responses on the owner-supplied deployment. After publication, the [public Explore page](https://aidmap-aiaryskaliden.vercel.app/explore) serves the expanded catalogue. All 70 named profiles returned HTTP 200 with their source sections on the public alias.

On November 15, all 70 public profile URLs returned their expected university name and source section without authentication. The data validator and all 167 unit tests passed again. The [methodology](DATA_METHODOLOGY.md) describes how to reproduce the 829-record total.

## Research and implementation

- The [ordered shortlist](research/CATALOGUE_SHORTLIST.md) lists the selected institutions and six alternates. The three research batches are in `data/research-expansion-*.json`. Profiles link degree, admission and funding information to official pages. Toronto is represented once, and the UBC profile describes Vancouver.
- Need-based aid is documented for 37 institutions. The funding coverage indicator includes 66 with published funding information. An award maximum for four years is stored as a condition. Tuition, living expenses, family contribution and hypothetical awards remain separate throughout the calculator.
- Nine institutions have a dated gross annual cost. Twenty have a dated Fall 2027 deadline in the coverage report and 27 have some cycle-specific admissions information. Consult the [per-institution review](DATA_REVIEW.md) for missing English requirements, documents, costs and deadlines. Only eight institutions have the more detailed core dossiers.
- Of 335 distinct source URLs, 297 responded successfully to the final check. No URL returned 404 or 410. Fourteen were access-limited, seven requests failed or timed out, and seventeen returned other responses requiring manual review. The report includes the individual URLs. Yale transfer eligibility, Rhine-Waal English certificates and Swarthmore’s 2024–25 Common Data Set now point to verified replacements.
- Explore renders the requested URL filters on the server. Search and sorting cover the whole catalogue. Explore and Funding initially show up to twelve cards and offer a button to show more. Private selections and saved scenarios keep their existing storage format. The profile destination selector preserves previously entered countries.
- The calculator uses a CSS cost bar with a labelled breakdown. Research validation runs on the server and in the standalone validator. The browser reuses bundled research without repeating the schema checks. Shared navigation avoids fetching several unrelated pages on first paint.
- Revised headings identify the action on each route. Application instructions stack vertically within a requirement card, including at double zoom. Mobile, tablet and desktop screenshots are in [the measurement directory](research/performance/).

## Performance measurements

One cold-cache run per route and width on the same Windows host and loopback production server. Desktop used 1440 px without throttling. At 375 px the browser used fourfold CPU throttling, 60 ms latency and a 10 Mbps downstream limit. The 768 px run checks final layout only. Results include route-related prefetch during the observation window. Desktop timings are sensitive to host load. A field INP measurement would require data from real visitors.

The table reports **before → after**. Blocking is the sum of each observed long task’s time over 50 ms. Ready is the first enabled theme control, a proxy for browser hydration. Navigation time is the load event. LCP can describe different content when a loading screen is replaced with rendered results. All times are milliseconds.

| Width | Route | LCP | CLS | JS (KiB) | Ready | Blocking | Navigation |
|---:|---|---:|---:|---:|---:|---:|---:|
| 1440 | /explore | 1596 → 1556 | 0.289 → 0.000 | 303.6 → 289.1 | 1237 → 1560 | 665 → 313 | 960 → 1430 |
| 1440 | /compare | 320 → 452 | 0.001 → 0.001 | 421.1 → 274.2 | 840 → 932 | 284 → 168 | 736 → 789 |
| 1440 | /universities/mit | 1068 → 1068 | 0.237 → 0.000 | 310.7 → 289.1 | 1260 → 1282 | 474 → 478 | 1018 → 1002 |
| 1440 | /funding | 748 → 488 | 0.237 → 0.002 | 301.4 → 275.0 | 1184 → 1174 | 351 → 523 | 981 → 966 |
| 1440 | /calculator | 1028 → 1268 | 0.289 → 0.000 | 409.5 → 277.4 | 658 → 807 | 160 → 419 | 534 → 619 |
| 1440 | /dashboard | 652 → 2336 | 0.160 → 0.000 | 416.5 → 302.2 | 732 → 2466 | 272 → 144 | 522 → 2320 |
| 1440 | /planner | 212 → 256 | 0.086 → 0.001 | 421.1 → 283.4 | 640 → 767 | 177 → 297 | 535 → 638 |
| 375 | /explore | 640 → 3964 | 0.431 → 0.000 | 264.1 → 277.5 | 5416 → 5591 | 5163 → 2544 | 3296 → 4364 |
| 375 | /compare | 2016 → 1048 | 0.000 → 0.005 | 267.8 → 274.2 | 5686 → 3196 | 3334 → 1418 | 4773 → 2632 |
| 375 | /universities/mit | 5972 → 4984 | 0.214 → 0.000 | 275.8 → 276.0 | 8206 → 6744 | 3296 → 1965 | 6228 → 5171 |
| 375 | /funding | 5736 → 3724 | 0.214 → 0.000 | 261.6 → 275.0 | 8838 → 5272 | 4029 → 3177 | 6658 → 3999 |
| 375 | /calculator | 5488 → 724 | 0.431 → 0.000 | 369.7 → 277.4 | 4590 → 4840 | 3623 → 4486 | 3450 → 3593 |
| 375 | /dashboard | 3240 → 3924 | 0.214 → 0.000 | 289.3 → 275.9 | 4316 → 4736 | 1919 → 2107 | 3449 → 3979 |
| 375 | /planner | 808 → 4276 | 0.102 → 0.000 | 406.3 → 283.4 | 4087 → 4164 | 2332 → 1504 | 3234 → 3392 |

At 375 px, the first Explore keystroke to two animation frames fell from 304 ms to 156 ms. On desktop it measured 39 ms and 38 ms. Mobile Explore LCP rose from 640 ms to 3,964 ms as the first meaningful screen changed. The dashboard also showed slower LCP on both widths. These are lab observations, and no uniform speedup is claimed. The mobile MIT profile exceeded the viewport before the fix. None of the 21 final route/width observations had page-level horizontal overflow.

[375 px Explore](research/performance/375-explore.png) · [768 px Calculator](research/performance/768-calculator.png) · [1440 px MIT](research/performance/1440-mit.png)

## Verification and optional Preview

On November 14, 2026 the production build, standalone data validation, lint and TypeScript checks passed. All 167 Vitest cases and all 45 Playwright cases passed. Browser tests used Microsoft Edge on desktop, tablet and mobile layouts, with keyboard and double-zoom checks. Direct local HTTP checks found the correct name and source section on all 70 profile routes. The host shell reported Node 26.13.0 and pnpm 11.25.0. The repository declares Node 24.x for deployment. The subsequent Vercel Preview build completed successfully and the public routes passed anonymous verification.

Run `pnpm validate:data`, `pnpm lint`, `pnpm typecheck`, `pnpm test` and `pnpm build`. Start the production build with `pnpm start`. In a second terminal run `pnpm test:e2e` and `node scripts/measure-catalogue.mjs after`. On this Windows host set `PLAYWRIGHT_CHANNEL=msedge` for the browser tests. Measurement uses disposable profiles without applicant information. The [raw baseline](research/performance/before.json) and [final run](research/performance/after.json) include navigation, main-thread work, the hydration proxy and transferred JavaScript for each route.

Local verification routes include [Explore](http://127.0.0.1:3000/explore), [a shared Canadian search](http://127.0.0.1:3000/explore?country=Canada), [KAIST](http://127.0.0.1:3000/universities/kaist), [Funding](http://127.0.0.1:3000/funding), and [Calculator](http://127.0.0.1:3000/calculator).

For a separate Preview when authorized, use the already-linked Vercel project. Run `vercel deploy --target preview` from the reviewed branch and inspect the returned deployment URL with `vercel inspect <deployment-url>`. Check that the target is Preview and status is Ready. On that exact URL verify `/explore?country=Canada`, `/universities/kaist`, `/universities/mit`, `/funding` and `/calculator`. The existing Preview alias and public release remain governed by the [deployment record](VERCEL_PREVIEW.md).
