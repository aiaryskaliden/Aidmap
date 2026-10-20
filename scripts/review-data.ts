import { readFile, writeFile } from "node:fs/promises";
import { universities, opportunities } from "../data/universities";
import { currentDeadlines, fieldStatus } from "../lib/admissions";
import type { Fact } from "../types/domain";
async function main() {
  const reviewDate = new Date().toISOString().slice(0, 10);
  const isFact = (v: unknown): v is Fact<unknown> =>
    !!v && typeof v === "object" && "value" in v && "sourceIds" in v;
  const rows = universities.map((u) => ({
    id: u.id,
    name: u.name,
    country: u.country,
    programs: !!u.programs.value?.length,
    internationalNeedAid: u.internationalAid.value,
    internationalFundingEvidence:
      u.internationalAid.value !== null ||
      opportunities.some((o) => o.universityId === u.id),
    currentAdmission:
      [
        u.satPolicy,
        u.actPolicy,
        u.applicationPlatform,
        u.admissionEligibility,
      ].some((f) => fieldStatus(f, u) === "verified_current") ||
      currentDeadlines(u).length > 0,
    historical:
      Object.values(u).some(
        (f) => isFact(f) && fieldStatus(f, u) === "verified_previous_cycle",
      ) ||
      (u.deadlines.value ?? []).some(
        (d) => d.cycle && d.cycle !== "Fall 2027" && d.date,
      ),
    costBaseline: u.annualCost.value !== null,
    costYear: u.annualCost.cycle,
    currentDates: currentDeadlines(u).length,
    review: [
      ...(u.satPolicy.value === null ? ["SAT policy"] : []),
      ...(u.englishTests.value === null ||
      u.englishTests.scope?.purpose === "scholarship"
        ? ["English admission evidence"]
        : []),
      ...(u.annualCost.value === null ? ["annual cost"] : []),
      ...(!currentDeadlines(u).length ? ["Fall 2027 deadlines"] : []),
      ...(u.requirements.value === null ? ["application documents"] : []),
      ...(u.meritAid.value === null ? ["merit eligibility"] : []),
    ],
  }));
  const summary = {
    reviewDate,
    previousUniversityCount: 8,
    universityCount: universities.length,
    us: universities.filter((u) => u.region === "United States").length,
    europe: universities.filter((u) => u.region === "Europe").length,
    countries: [...new Set(universities.map((u) => u.country))],
    withInternationalFundingEvidence: rows.filter(
      (r) => r.internationalFundingEvidence,
    ).length,
    withInternationalNeedBasedAid: rows.filter(
      (r) => r.internationalNeedAid === true,
    ).length,
    withVerifiedUndergraduatePrograms: rows.filter((r) => r.programs).length,
    withCurrentAdmissionInformation: rows.filter((r) => r.currentAdmission)
      .length,
    withPreviousCycleReferences: rows.filter((r) => r.historical).length,
    withDatedCostBaselines: rows.filter((r) => r.costBaseline).length,
    withCurrentDatedDeadlines: rows.filter((r) => r.currentDates > 0).length,
    fieldEvidenceRecords: universities.reduce(
      (n, u) => n + u.sources.length,
      0,
    ),
    fundingOpportunities: opportunities.length,
  };
  const urls = [
    ...new Set([
      ...universities.flatMap((u) => u.sources.map((s) => s.url)),
      ...opportunities.map((o) => o.source.url),
    ]),
  ];
  const links: { url: string; status: number | null; result: string }[] = [];
  let linkCheckDate: string | null = null;
  if (process.argv.includes("--check-links")) {
    linkCheckDate = reviewDate;
    let index = 0;
    await Promise.all(
      Array.from({ length: 6 }, async () => {
        while (index < urls.length) {
          const url = urls[index++];
          try {
            let response = await fetch(url, {
              method: "HEAD",
              redirect: "follow",
              signal: AbortSignal.timeout(12000),
            });
            if (response.status === 405 || response.status === 501)
              response = await fetch(url, {
                signal: AbortSignal.timeout(12000),
              });
            links.push({
              url,
              status: response.status,
              result: response.ok
                ? "reachable"
                : response.status === 404 || response.status === 410
                  ? "broken or moved"
                  : response.status === 403 || response.status === 429
                    ? "access limited; manual check"
                    : "manual check",
            });
            await response.body?.cancel();
          } catch {
            links.push({
              url,
              status: null,
              result: "request failed or timed out; manual check",
            });
          }
        }
      }),
    );
  }
  if (
    process.argv.includes("--keep-link-results") &&
    !process.argv.includes("--check-links")
  ) {
    const previous = JSON.parse(
      await readFile("docs/DATA_REVIEW.json", "utf8"),
    );
    links.push(
      ...previous.links.filter((l: { url: string }) => urls.includes(l.url)),
    );
    linkCheckDate = previous.linkCheckDate ?? previous.summary.reviewDate;
  }
  const report = {
    summary,
    linkCheckDate,
    universities: rows,
    links: links.sort((a, b) => a.url.localeCompare(b.url)),
  };
  await writeFile(
    "docs/DATA_REVIEW.json",
    JSON.stringify(report, null, 2) + "\n",
  );
  const markdown = `# AidMap data coverage review\n\nGenerated ${reviewDate}. A researched profile does not mean every field is complete or Fall 2027-confirmed. International funding evidence includes restricted scholarships and explicit no-aid policies; it does not establish an applicant's eligibility.\n\n\`\`\`json\n${JSON.stringify(summary, null, 2)}\n\`\`\`\n\n| Institution | Country | Current admission info | Cost year | Details to review |\n|---|---|---|---|---|\n${rows.map((r) => `| ${r.name} | ${r.country} | ${r.currentAdmission ? "Some fields" : "Not confirmed"} | ${r.costYear ?? "Unknown"} | ${r.review.join(", ") || "Individual conditions and renewal"} |`).join("\n")}\n\n## Source link checks\n\n${
    links.length
      ? `${links.filter((l) => l.result === "reachable").length}/${links.length} URLs returned successful responses. HTTP access limitations do not prove a link is broken. Review these URLs manually:\n\n${links
          .filter((l) => l.result !== "reachable")
          .map(
            (l) =>
              `- [Source](${l.url}): ${l.status ?? "no status"} — ${l.result}`,
          )
          .join("\n")}`
      : "Not run. Use pnpm exec tsx scripts/review-data.ts --check-links to check reachability. A successful response is not a content verification."
  }\n`;
  await writeFile("docs/DATA_REVIEW.md", markdown);
  console.log(JSON.stringify(summary, null, 2));
  if (links.length)
    console.log(
      `Link checks: ${links.filter((l) => l.result === "reachable").length}/${links.length} reachable; ${links.filter((l) => l.result === "broken or moved").length} broken/moved; other failures require manual review. See docs/DATA_REVIEW.md.`,
    );
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
