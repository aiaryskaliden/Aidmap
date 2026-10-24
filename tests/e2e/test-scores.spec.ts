import { test, expect } from "@playwright/test";

test("test scores are visible on discovery cards and linked profiles", async ({
  page,
}, testInfo) => {
  await page.goto("/explore?q=MIT");
  const card = page
    .locator(".university-card")
    .filter({ hasText: "Massachusetts Institute of Technology" });
  await expect(card).toContainText("1550");
  await expect(card).toContainText("7.0");
  await expect(card).toContainText("7.5");
  await expect(card).toContainText("recommended");
  await card.screenshot({ path: testInfo.outputPath("scores-card.png") });
  await card
    .getByRole("link", { name: "Score context, conditions & sources" })
    .click();
  const scores = page.getByRole("region", { name: "SAT and IELTS scores" });
  await expect(scores).toBeVisible();
  await scores.screenshot({ path: testInfo.outputPath("scores-profile.png") });
  await expect(scores).toContainText("Median · 50th percentile");
  await expect(scores).toContainText("English evidence: Recommended");
  await expect(
    scores.getByRole("link", { name: /Official score data/ }),
  ).toHaveAttribute("href", /mit\.edu/);
  await expect(page.locator("body")).toHaveJSProperty(
    "scrollWidth",
    await page.evaluate(() => document.body.clientWidth),
  );
});

test("program scope and comparison keep IELTS meanings and SAT populations", async ({
  page,
}) => {
  await page.goto("/universities/amsterdam#test-scores");
  const scores = page.getByRole("region", { name: "SAT and IELTS scores" });
  await expect(scores).toContainText("6.5");
  await expect(scores).toContainText(
    "BSc Economics and Business Economics only · admission",
  );
  await expect(scores).toContainText("at least 6.0 in every subscore");
  await page.goto("/compare");
  await page.getByLabel("Add university to comparison").selectOption("mit");
  await page
    .getByLabel("Add university to comparison")
    .selectOption("dartmouth");
  const row = page.getByRole("row").filter({ hasText: "IELTS score guidance" });
  await expect(row).toContainText("7.0 minimum");
  // Long conditions are collapsed; their full, sourced text stays available.
  await expect(row).toContainText(">7.0 typical, not a cutoff");
  await expect(
    page.getByRole("row").filter({ hasText: "SAT score benchmark" }),
  ).toContainText("1550");
});
