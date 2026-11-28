import { test, expect } from "@playwright/test";

test("discovery exposes the test policy and the linked profile shows score evidence", async ({
  page,
}, testInfo) => {
  await page.goto("/explore?q=MIT");
  const card = page
    .locator(".university-card")
    .filter({ hasText: "Massachusetts Institute of Technology" });
  await card
    .getByRole("button", {
      name: "Details for Massachusetts Institute of Technology",
    })
    .click();
  await expect(
    card.getByText("SAT / ACT required", { exact: true }),
  ).toBeVisible();
  await card.screenshot({ path: testInfo.outputPath("scores-card.png") });
  await card.getByRole("link", { name: "Requirements and sources" }).click();
  const scores = page.getByRole("region", { name: "SAT and IELTS scores" });
  await expect(scores).toBeVisible();
  await scores.screenshot({ path: testInfo.outputPath("scores-profile.png") });
  await expect(scores).toContainText("1550");
  await expect(scores).toContainText("7.0");
  await expect(scores).toContainText("7.5");
  await expect(scores).toContainText("Median · 50th percentile");
  await expect(scores).toContainText("English evidence: Recommended");
  await expect(
    scores.getByRole("link", { name: /View original institutional data/ }),
  ).toHaveAttribute("href", /^https:\/\/ir\.mit\.edu\//);
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
