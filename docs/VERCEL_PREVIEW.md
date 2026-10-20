# AidMap Preview access

Current state, October 20, 2026: the owner explicitly requested public access, then selected **only the already deployed version**. Vercel Authentication was disabled for the AidMap project (`ssoProtection: null`); no new deployment or Production promotion was performed. The existing site is public at https://aidmap-aiaryskaliden.vercel.app. AidMap 2.0 remains local and requires separate deployment permission.

Anonymous GET requests to `/`, `/explore`, `/calculator`, `/planner` and `/dashboard` returned HTTP 200 without login redirects. A fresh browser successfully searched Princeton and loaded the illustrative calculator result ($71,000), with no page exceptions. The assistant's separate web retrieval tool could not read either URL; this is not proof that every GPT browsing mode can access it. Application source/build logs were not made public, and no applicant browser data was uploaded.

The protected-deployment details below are the **October 18 history**, superseded only for website access by the explicit October 20 request. Do not infer permission to upload AidMap 2.0 or future changes. Before a future deployment, separately confirm the intended access settings.

- Preferred URL: https://aidmap-aiaryskaliden.vercel.app
- Original deployment URL: https://aidmap-px86r0bds-musorlegend-1144.vercel.app
- Deployment: `dpl_9maj9pFnQgh7qxXHUj3wwCAkd86q`.
- CLI inspection: `target: preview`, `readyState: READY`.
- Anonymous HEAD requests to `/`, `/explore` and `/dashboard` on both addresses: HTTP 302 redirects to Vercel authentication.
- Authenticated Vercel CLI request to `/`: HTTP 200. The CLI generated its standard automation bypass credential; it was not printed or uploaded with application files.
- Exactly one Ready Preview deployment remains, now with the owner-requested `aidmap-aiaryskaliden.vercel.app` alias. Vercel Authentication protects all URLs (`ssoProtection.deploymentType = all`). Both the aborted first attempt and the explicitly authorized temporary Production placeholder were removed.

## Local preparation

- `pnpm build` completed successfully on October 18, 2026, including strict TypeScript checks and 20 generated pages.
- Node.js is pinned to the supported `24.x` major version.
- `vercel.json` selects Next.js, installs with `pnpm install --frozen-lockfile`, and builds with `pnpm build`. Both commands first run `scripts/require-preview.mjs`, which refuses missing, Production or conflicting Vercel environment metadata.
- `public: false` keeps deployment source and build logs private. **It does not protect access to the website.** Website access requires project-level Vercel Authentication.
- `.vercelignore` uses an explicit allowlist for application source and build inputs. Local environments, credentials, browser exports, screenshots, reports, caches, Git metadata and CLI tools are excluded.
- `.vercel/`, `.vercel-tools/` and `.vercel-bootstrap/` are ignored by Git and excluded from application uploads.
- The Preview guard was checked against four environments: Preview allowed; Production, missing metadata and a conflicting target blocked. ESLint passed for the guard script.

## Privacy review

The reviewed upload set contains application code, package/build configuration and the public university evidence dataset. The source scan found no credential patterns, personal applicant records or local Windows profile paths. Demo profile values are synthetic and explicitly labelled.

Applicant profiles, saved universities, budgets and tasks are initialized empty and persisted only in the visitor's browser storage. The application has no applicant upload endpoint or analytics integration. A deployment does not copy the localhost browser workspace to the Preview origin. JSON/CSV exports remain user-managed local files and are excluded from deployment.

This is a scoped source and build-output review, not a guarantee against every possible vulnerability. Recheck the upload set whenever files are added.

## Deployment procedure

1. Sign in to the Vercel CLI personally; do not paste credentials into the repository or chat.
2. Create or select only the intended AidMap project and confirm its team scope.
3. Inspect project protection and preserve Vercel Authentication for **all deployment URLs**, including aliases (`ssoProtection.deploymentType = all`), before uploading source.
4. Inspect `vercel deploy --dry --json` and confirm the upload manifest.
5. **Preserve the existing Preview:** Vercel assigns an empty project's first deployment to Production even when Preview is requested. With this initialized project, run `vercel deploy --target preview`. Do not use `--prod`, `--target production`, `--temporary`, public bypass links or production promotion commands for the AidMap application.
6. Wait for the deployment to reach Ready, record the exact URL, and verify unauthenticated requests are blocked by Vercel Authentication.

The CLI is installed locally in the ignored `.vercel-tools/` directory because this workstation's temporary pnpm CLI cache produced missing-dependency errors. Invoke it from the project root with:

```powershell
node .vercel-tools/node_modules/vercel/dist/vc.js --help
```

The local production build and Vercel's Linux build both passed, including TypeScript and all 20 generated pages. The remote install and build both logged confirmation that their environment was Preview.

## Initialization and cleanup record — October 18, 2026

- The owner completed CLI login personally.
- Created only the `aidmap` project in the owner's Hobby scope; no other projects existed or were modified.
- Confirmed Vercel Authentication was enabled with `ssoProtection.deploymentType = all_except_custom_domains` before upload.
- Vercel's final authenticated `deploy --dry --json` confirmed 50 application/build files totaling 519,194 bytes, including the Preview guard. It excluded environments, local CLI files, browser data, screenshots, the placeholder and reports.
- `vercel deploy --target preview --scope musorlegend-1144 --yes --logs` was nevertheless classified as **Production** by Vercel. The exact newly created deployment was immediately removed while its build was unfinished.
- Follow-up CLI listings initially returned zero deployments and zero aliases, confirming cleanup of the unexpected first attempt.
- The temporary `.env.local` OIDC file created by `vercel link` was removed without reading or printing its value; it was never uploaded.
- [Vercel's implementation note](https://github.com/vercel/vercel/pull/17206) confirms the first-deployment classification. [Vercel support's workaround](https://community.vercel.com/t/vercel-cli-ignores-target-preview-and-creates-production-deployment/46384/10) requires a staged Production placeholder with `--prod --skip-domain`, then a separate Preview.

The owner then explicitly authorized a temporary, protected Production placeholder. Only an inert prebuilt page saying "Application unavailable" was uploaded from ignored `.vercel-bootstrap/`; it contained no AidMap code, dependencies, secrets or applicant data. Its command included `--prod --skip-domain`. Vercel nevertheless assigned an alias; that alias was immediately removed. The placeholder's generated URL was verified to redirect unauthenticated requests to Vercel login, and the alias list was confirmed empty before deploying the application.

The subsequent AidMap deployment was correctly classified as Preview, passed its environment guard, completed the remote build and reached Ready. The placeholder (`dpl_9ojqk2yu87jNSQjs3H16uy7DgJAq`) was then deleted. Final listings confirmed only the actual Preview remains. The temporary Production exception does not authorize future Production deployments or public sharing.

## Personalized address — October 18, 2026

The owner requested their name in the site address. Before assigning the alias, project protection was strengthened from `all_except_custom_domains` to `all` and independently read back. Vercel CLI then assigned `aidmap-aiaryskaliden.vercel.app` to the existing deployment without rebuilding or promoting it. Inspecting the alias confirmed the same deployment ID, `target: preview` and `readyState: READY`. Anonymous requests to the alias on `/`, `/explore` and `/dashboard` each returned a 302 redirect to Vercel authentication. The account and team names were not changed.

Official references: [Preview deployment CLI](https://vercel.com/docs/cli/deploy), [Vercel Authentication](https://vercel.com/docs/deployment-protection/methods-to-protect-deployments/vercel-authentication), [deployment allowlists](https://vercel.com/docs/deployments/vercel-ignore), [deployment aliases](https://vercel.com/docs/cli/alias).
