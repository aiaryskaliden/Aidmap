// Vercel may classify a new project's first deployment as Production even
// when the CLI requests Preview. Stop before dependency installation/build
// unless the platform explicitly reports a Preview environment.
const environment = process.env.VERCEL_ENV;
const targetEnvironment = process.env.VERCEL_TARGET_ENV;

if (
  environment !== "preview" ||
  (targetEnvironment && targetEnvironment !== "preview")
) {
  console.error(
    "AidMap deployment stopped: only an explicitly identified Vercel Preview environment is authorized. No application build will run.",
  );
  process.exit(1);
}

console.log("AidMap: Preview environment confirmed.");
