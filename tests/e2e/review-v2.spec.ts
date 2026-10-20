import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
async function filters(page: Page) {
  const button = page.getByRole("button", { name: "Filters", exact: true });
  if (await button.isVisible()) await button.click();
}
async function closeFilters(page: Page) {
  const button = page.getByRole("button", { name: "Close filters" });
  if (await button.isVisible()) await button.click();
}
test("AM-004 and AM-005 preserve expense totals and distinguish blank from zero", async ({
  page,
}) => {
  await page.goto("/calculator");
  await page.getByRole("button", { name: "Load illustrative example" }).click();
  const contribution = page.getByLabel("Maximum annual contribution (USD)");
  await contribution.fill("");
  await expect(page.getByTestId("total-cost")).toHaveText("$71,000");
  await expect(page.getByTestId("budget-gap")).toHaveText("Unknown");
  await page.getByRole("button", { name: "Save funding scenario" }).click();
  await page.goto("/dashboard");
  await page
    .getByRole("link", {
      name: "Illustrative full-tuition scenario",
      exact: true,
    })
    .click();
  await expect(contribution).toHaveValue("");
  await contribution.fill("0");
  await expect(page.getByTestId("budget-gap")).toHaveText("$71,000");
  await contribution.fill("-1");
  await expect(contribution).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#contribution-error")).toContainText(
    "Enter a contribution",
  );
  await expect(page.getByTestId("total-cost")).toHaveText("$71,000");
  await expect(page.getByTestId("remaining-cost")).toHaveText("$71,000");
  await expect(page.getByTestId("budget-gap")).toHaveText("Unknown");
  await expect(
    page.getByRole("button", { name: "Save funding scenario" }),
  ).toBeDisabled();
});
test("filters persist in URL, unknowns stay distinct, reset and mobile focus work", async ({
  page,
}) => {
  await page.goto("/explore?country=Netherlands&test=required");
  await expect(page.locator(".university-card")).toHaveCount(0);
  await page
    .getByLabel("Include universities with unknown requirements")
    .check();
  await expect(page.locator(".university-card")).toHaveCount(2);
  await expect(page.locator(".unknown-match").first()).toContainText(
    "SAT policy",
  );
  await page.reload();
  await expect(
    page.getByLabel("Include universities with unknown requirements"),
  ).toBeChecked();
  await expect(page.locator(".university-card")).toHaveCount(2);
  await page.getByRole("button", { name: "Remove SAT: required" }).click();
  await expect(page).not.toHaveURL(/test=/);
  await page
    .locator(".active-filters")
    .getByRole("button", { name: "Reset all", exact: true })
    .click();
  await expect(page.locator(".university-card")).toHaveCount(30);
  await filters(page);
  await page
    .getByRole("combobox", { name: "Subject", exact: true })
    .selectOption("Business / Management");
  await closeFilters(page);
  await expect(page).toHaveURL(/major=/);
  await expect(
    page.getByRole("link", { name: "Harvard University", exact: true }),
  ).toHaveCount(0);
  await filters(page);
  await page
    .getByText("Testing & English requirements", { exact: true })
    .filter({ visible: true })
    .click();
  await page
    .getByRole("checkbox", { name: "IELTS accepted", exact: true })
    .filter({ visible: true })
    .check();
  await closeFilters(page);
  await page.reload();
  await expect(page).toHaveURL(/english=IELTS/);
  const mobile = page.getByRole("button", { name: "Filters", exact: true });
  if (await mobile.isVisible()) {
    await mobile.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).not.toBeVisible();
    await expect(mobile).toBeFocused();
  }
});
test("U02 JSON and CSV downloads contain full data; invalid imports preserve storage", async ({
  page,
}) => {
  await page.goto("/universities/princeton");
  await page
    .getByRole("button", { name: "Save university", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Add research checklist to my planner",
      exact: true,
    })
    .click();
  await page.goto("/planner");
  await page
    .getByLabel("Custom deadline for Princeton University")
    .fill("2026-12-19");
  await page
    .getByLabel("Application status for Princeton University")
    .selectOption("Preparing");
  await page.goto("/profile");
  const jsonPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export planning data (JSON)" })
    .click();
  const json = await jsonPromise;
  const jsonPath = (await json.path())!;
  const parsed = JSON.parse(await readFile(jsonPath, "utf8"));
  expect(parsed.version).toBe(1);
  expect(parsed.saved[0]).toMatchObject({
    universityId: "princeton",
    deadline: "2026-12-19",
    status: "Preparing",
  });
  expect(parsed.saved[0].tasks.length).toBe(5);
  expect(parsed.saved[0].tasks[0].sourceUrl).toMatch(/^https:/);
  const csvPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export shortlist (CSV)" }).click();
  const csv = await csvPromise;
  const content = await readFile((await csv.path())!, "utf8");
  expect(content).toContain('"Princeton University"');
  expect(content).toContain('"Preparing","2026-12-19"');
  const before = await page.evaluate(() => localStorage.getItem("aidmap:v1"));
  await page.getByLabel("Choose planning backup").setInputFiles({
    name: "invalid.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"version":99}'),
  });
  await expect(page.locator(".data-controls .form-error")).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("aidmap:v1"))).toBe(
    before,
  );
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Delete all local data" }).click();
  await page.getByLabel("Choose planning backup").setInputFiles(jsonPath);
  await page
    .getByRole("button", { name: "Replace workspace with this backup" })
    .click();
  await page.reload();
  expect(
    JSON.parse((await page.evaluate(() => localStorage.getItem("aidmap:v1")))!),
  ).toEqual(parsed);
  await page.goto("/planner");
  await expect(
    page.getByLabel("Custom deadline for Princeton University"),
  ).toHaveValue("2026-12-19");
});
test("source dates require confirmation and historical deadlines stay references", async ({
  page,
}) => {
  await page.goto("/universities/amherst#deadlines");
  const add = page.getByRole("button", { name: "Add to planner" }).first();
  await expect(add).toBeEnabled();
  page.once("dialog", (d) => d.dismiss());
  await add.click();
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("aidmap:v1") || '{"saved":[]}').saved,
    ),
  ).toHaveLength(0);
  page.once("dialog", (d) => d.accept());
  await add.click();
  await page.goto("/planner");
  await expect(page.locator(".planner-form-grid")).toContainText("Fall 2027");
  await page.reload();
  await expect(page.locator(".planner-form-grid")).toContainText(
    "Review deadline source",
  );
  await page.goto("/universities/szeged#deadlines");
  const historicalRows = page
    .locator("#deadlines tr")
    .filter({ hasText: "Previous-cycle reference" });
  await expect(historicalRows.first()).toBeVisible();
  await expect(
    historicalRows.getByRole("button", { name: "Add to planner" }),
  ).toHaveCount(0);
  await expect(page.locator("#deadlines")).toContainText(
    "Previous-cycle reference",
  );
});
test("optional onboarding, accessible explanations and text reflow", async ({
  page,
}) => {
  await page.goto("/start");
  await page.getByLabel("Intended subject").selectOption("Computer Science");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Skip this step" }).click();
  await page.getByLabel("Annual contribution (optional)").fill("");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Save these preferences" }).click();
  await page.goto("/profile");
  await expect(
    page.getByRole("combobox", {
      name: "Intended undergraduate subject",
      exact: true,
    }),
  ).toHaveValue("Computer Science");
  await page.goto("/universities/mit");
  const help = page.getByRole("button", {
    name: "Explain SAT and ACT policies",
  });
  await help.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".help-popover:popover-open")).toContainText(
    "median",
  );
  await page.keyboard.press("Escape");
  await expect(page.locator(".help-popover:popover-open")).toHaveCount(0);
  await page.setViewportSize({ width: 720, height: 900 });
  await page.evaluate(() => (document.body.style.zoom = "2"));
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
