# Contributing to AidMap

Keep the product trustworthy before expanding its directory.

- Keep UI, domain rules, evidence records and persistence separate.
- Use strict types and Zod boundaries; unknown information must remain null.
- Read [the data methodology](docs/DATA_METHODOLOGY.md) before changing any admissions or funding claim. A general policy is not a verified date or individual award.
- Explain a recommendation in plain language. Never add admission probabilities or “safety” labels from test scores.
- Don’t introduce analytics, applicant uploads, account requirements or external services without a deliberate privacy review and product decision.
- Add tests for meaningful domain changes, especially monetary calculations and imported data. Do not duplicate purely presentational implementation in tests.
- Verify the core journey at desktop and mobile widths. Keep no-op controls out of the UI.

Before submitting a change, run:

```sh
pnpm lint
pnpm typecheck
pnpm validate:data
pnpm test
pnpm test:e2e
pnpm build
```

Use `pnpm format` for code formatting. Review generated changes and never commit browser storage exports, applicant data, `node_modules`, `.next`, screenshots containing private data, or temporary test traces. No project license has been selected.
