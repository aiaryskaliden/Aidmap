# Contributing to AidMap

Keep the product trustworthy before expanding its directory.

- Keep UI, domain rules, evidence records and persistence separate.
- Use strict types and Zod boundaries; unknown information must remain null.
- Read [the data methodology](docs/DATA_METHODOLOGY.md) before changing any admissions or funding claim. A general policy is not a verified date or individual award.
- Explain a recommendation in plain language. Never add admission probabilities or “safety” labels from test scores.
- Don’t introduce analytics, applicant uploads, account requirements or external services without a deliberate privacy review and product decision.
- Add tests for meaningful domain changes, especially monetary calculations and imported data. Do not duplicate purely presentational implementation in tests.
- Verify the core journey at desktop and mobile widths. Keep no-op controls out of the UI.

Install dependencies with `pnpm install --frozen-lockfile` and run the checks used by [GitHub Actions](.github/workflows/verify.yml):

```sh
pnpm lint
pnpm typecheck
pnpm validate:data
pnpm test
pnpm exec playwright install chromium
pnpm test:e2e
pnpm build
```

Format changed files with `pnpm exec prettier --write <files>`. Keep local secrets in an ignored `.env.local` file and use [.env.example](.env.example) for variable names. Review generated changes and never commit browser storage exports, applicant data, screenshots containing private data, or temporary test traces. No project license has been selected.
