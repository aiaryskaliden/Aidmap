import { test, expect } from "@playwright/test";

test("student can discover, save, compare, calculate and plan", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Save university", exact: true }).first(),
  ).toBeEnabled();
  await expect(
    page.getByRole("heading", { name: "Your future, mapped." }),
  ).toBeVisible();
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.screenshot({
    path: `test-results/${testInfo.project.name}-home.png`,
    fullPage: true,
    scale: "css",
  });
  await page
    .getByRole("link", { name: "Explore universities", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: "Find a place for your ambition." }),
  ).toBeVisible();
  if (testInfo.project.name === "mobile")
    await page.getByRole("button", { name: "Filters", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Subject", exact: true })
    .selectOption("Computer Science");
  await page
    .getByRole("textbox", { name: "Search universities", exact: true })
    .fill("Princeton");
  await expect(page.locator(".university-card")).toHaveCount(1);
  await expect(page).toHaveURL(/major=Computer/);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.screenshot({
    path: `test-results/${testInfo.project.name}-explore.png`,
    fullPage: true,
    scale: "css",
  });
  await page
    .getByRole("link", { name: "View Princeton University profile" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Princeton University", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Test optional for Fall 2027", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Save university", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Unsave university", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Compare", exact: true }).click();
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.screenshot({
    path: `test-results/${testInfo.project.name}-profile.png`,
    fullPage: true,
    scale: "css",
  });
  await page.goto("/compare");
  await page.getByLabel("Add university to comparison").selectOption("harvard");
  await expect(page.locator(".compare-table thead th")).toHaveCount(3);
  await expect(
    page.getByRole("link", { name: "Princeton University", exact: true }),
  ).toBeVisible();
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.screenshot({
    path: `test-results/${testInfo.project.name}-compare.png`,
    fullPage: true,
    scale: "css",
  });
  await page.goto("/calculator");
  await page.getByRole("button", { name: "Load illustrative example" }).click();
  await page.getByLabel("Maximum annual contribution (USD)").fill("6000");
  await expect(page.getByTestId("total-cost")).toHaveText("$71,000");
  await expect(page.getByTestId("remaining-cost")).toHaveText("$71,000");
  await expect(page.getByTestId("budget-gap")).toHaveText("$65,000");
  await expect(page.locator(".hypothetical-result")).toContainText("$15,000");
  await page.getByRole("button", { name: "Save funding scenario" }).click();
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.screenshot({
    path: `test-results/${testInfo.project.name}-calculator.png`,
    fullPage: true,
    scale: "css",
  });
  await page.goto("/dashboard");
  await expect(
    page.getByRole("link", { name: "Princeton University", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", {
      name: "Illustrative full-tuition scenario",
      exact: true,
    }),
  ).toBeVisible();
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.screenshot({
    path: `test-results/${testInfo.project.name}-dashboard.png`,
    fullPage: true,
    scale: "css",
  });
  await page.goto("/planner");
  await page
    .getByLabel("New task for Princeton University")
    .fill("Ask counselor about transcripts");
  await page.getByRole("button", { name: "Add task", exact: true }).click();
  await page
    .getByRole("checkbox", { name: "Ask counselor about transcripts" })
    .check();
  await page
    .getByRole("button", { name: "Edit task Ask counselor about transcripts" })
    .click();
  await page
    .getByLabel("Edit task text")
    .fill("Request translated transcripts");
  await page.getByRole("button", { name: "Save task edit" }).click();
  await page
    .getByLabel("Application status for Princeton University")
    .selectOption("Preparing");
  await page
    .getByLabel("Custom deadline for Princeton University")
    .fill("2026-12-01");
  await page.reload();
  await expect(
    page.getByRole("checkbox", { name: "Request translated transcripts" }),
  ).toBeChecked();
  await expect(
    page.getByLabel("Application status for Princeton University"),
  ).toHaveValue("Preparing");
  await expect(
    page.getByLabel("Custom deadline for Princeton University"),
  ).toHaveValue("2026-12-01");
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.screenshot({
    path: `test-results/${testInfo.project.name}-planner.png`,
    fullPage: true,
    scale: "css",
  });
  await expect(page.locator("body")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test("preferences, local backups, comparison limits and theme survive reloads", async ({
  page,
}) => {
  await page.goto("/profile");
  await page.getByRole("button", { name: "Load demo profile" }).click();
  await expect(page.getByText(/Synthetic demo profile/)).toBeVisible();
  await page
    .getByRole("button", { name: "Save preferences", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText(
    "Preferences saved locally.",
  );
  await page.reload();
  await expect(page.getByLabel("SAT score", { exact: true })).toHaveValue(
    "1450",
  );
  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export planning data (JSON)" })
    .click();
  const download = await downloadPromise;
  const path = await download.path();
  expect(path).toBeTruthy();
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Delete all local data" }).click();
  await expect(page.getByLabel("SAT score", { exact: true })).toHaveValue("");
  await page.getByLabel("Choose planning backup").setInputFiles(path!);
  await expect(
    page.getByRole("heading", { name: "Review your backup" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Replace workspace with this backup" })
    .click();
  await expect(page.getByLabel("SAT score", { exact: true })).toHaveValue(
    "1450",
  );
  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.goto("/compare");
  for (const u of ["harvard", "yale", "princeton", "mit"])
    await page.getByLabel("Add university to comparison").selectOption(u);
  await expect(page.getByLabel("Add university to comparison")).toBeDisabled();
  await page
    .getByRole("button", { name: "Remove Yale University from comparison" })
    .click();
  await expect(page.getByLabel("Add university to comparison")).toBeEnabled();
});

test("corrupted storage stays intact until explicitly replaced", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() =>
    localStorage.setItem("aidmap:v1", "invalid-original-data"),
  );
  await page.reload();
  await expect(page.locator(".storage-alert")).toContainText(
    "Saved data could not be read",
  );
  await page.goto("/profile");
  await expect(
    page.getByRole("button", { name: "Save preferences", exact: true }),
  ).toBeDisabled();
  expect(await page.evaluate(() => localStorage.getItem("aidmap:v1"))).toBe(
    "invalid-original-data",
  );
});

test("all product routes are usable without horizontal page overflow", async ({
  page,
}, testInfo) => {
  for (const route of [
    "/",
    "/explore?region=Europe",
    "/universities/bowdoin",
    "/funding",
    "/calculator",
    "/compare",
    "/dashboard",
    "/planner",
    "/profile",
    "/about",
  ]) {
    await page.goto(route);
    await expect(page.locator("h1")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
      `${route} overflow on ${testInfo.project.name}`,
    ).toBe(true);
  }
});
