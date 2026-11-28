import { expect, test, type Page } from "@playwright/test";

async function openSection(page: Page, label: string) {
  const menu = page.getByRole("button", { name: "Open menu", exact: true });
  if (await menu.isVisible()) await menu.click();
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: label, exact: true })
    .click();
}

test("honors and achievements share a page and save independently of activities", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByLabel("Workspace language")).toBeEnabled();
  await openSection(page, "Honors & achievements");
  await expect(
    page.getByRole("heading", { name: "Honors & achievements", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Add honor" }).click();
  await page.getByLabel("Honor name").fill("Regional science award");
  await page.getByLabel("Awarded by").fill("Robotics association");
  await page.getByLabel("Date", { exact: true }).fill("2025-11");
  await page
    .getByLabel("Award details")
    .fill("First place in the school final.");
  await page.getByRole("checkbox", { name: "School", exact: true }).check();
  await page.getByRole("checkbox", { name: "Regional", exact: true }).check();
  await page.getByRole("checkbox", { name: "11", exact: true }).check();
  await page.getByRole("button", { name: "Save entry" }).click();
  await page.getByRole("button", { name: "Add achievement" }).click();
  await page
    .getByLabel("Achievement name")
    .fill("Built a school weather station");
  await page
    .getByLabel("What did you accomplish?")
    .fill("Published 90 days of temperature readings.");
  await page.getByRole("checkbox", { name: "City", exact: true }).check();
  await page.getByRole("checkbox", { name: "12", exact: true }).check();
  await page.getByRole("button", { name: "Save entry" }).click();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Regional science award" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Built a school weather station" }),
  ).toBeVisible();
  const honor = page
    .getByRole("listitem")
    .filter({ hasText: "Regional science award" });
  const achievement = page
    .getByRole("listitem")
    .filter({ hasText: "Built a school weather station" });
  await expect(honor).toContainText("Robotics association · 2025-11");
  await expect(honor).toContainText("First place in the school final.");
  await expect(honor).toContainText("Grades · 11");
  await expect(achievement.getByText("City", { exact: true })).toBeVisible();
  await expect(achievement).toContainText("Grades · 12");
  await page
    .getByRole("button", { name: "Edit Regional science award" })
    .click();
  await expect(page.getByRole("checkbox", { name: "Regional" })).toBeChecked();
  const schoolLevel = page.getByRole("checkbox", { name: "School", exact: true });
  await expect(schoolLevel).toBeChecked();
  await expect(
    page.getByRole("checkbox", { name: "11", exact: true }),
  ).toBeChecked();
  await schoolLevel.uncheck();
  await page.getByRole("checkbox", { name: "National", exact: true }).check();
  await page.getByRole("button", { name: "Save entry" }).click();
  await expect(honor.getByText("National", { exact: true })).toBeVisible();
  await expect(honor.getByText("School", { exact: true })).toHaveCount(0);
  await openSection(page, "Activities");
  await expect(
    page.getByRole("heading", { name: "Activities", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Regional science award")).toHaveCount(0);
  await expect(page.getByText("Built a school weather station")).toHaveCount(0);
});

test("shared navigation opens discovery, the practice editor and final review", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Your application studio" }),
  ).toBeVisible();

  await openSection(page, "Scholarships");
  await page.getByLabel("Funding country").selectOption("Japan");
  await expect(page).toHaveURL(/country=Japan/);
  await expect(page.locator(".funding-card").first()).toBeVisible();
  const fund = page.locator(".funding-card").first();
  await fund.getByText("Application process & conditions").click();
  await expect(fund.locator('a[href^="https://"]')).toHaveCount(1);

  await openSection(page, "Example profiles");
  await page.getByRole("combobox", {name: "Subject", exact: true}).selectOption("Computer Science");
  await expect(page.getByRole("heading", { name: "Uriel Lin" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Gina Arnau" })).toHaveCount(0);

  await openSection(page, "Essay library");
  await page.getByRole("combobox", {name: "Situation", exact: true}).selectOption("Growing into leadership");
  await page.getByRole("link", { name: "Read guide", exact: true }).click();
  await expect(page.getByRole("link", { name: "Read the original essay" })).toHaveAttribute("href", /apply\.jhu\.edu/);
  await page.getByRole("link", { name: "Open my drafts" }).click();
  await page.getByRole("button", { name: "New essay", exact: true }).click();
  await expect(page.getByLabel("Draft title")).toBeEditable();

  await openSection(page, "Final review");
  await page.getByLabel("Choose a university").selectOption("harvard");
  await page.getByRole("button", { name: "Review application" }).click();
  await expect(
    page.getByRole("heading", { name: "Harvard University" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Published deadlines · 2027" }),
  ).toBeVisible();
});

test("Explore filters by rate and Maple shows one official source", async ({
  page,
}) => {
  await page.goto("/explore");
  await expect(
    page.getByText("150 universities", { exact: true }),
  ).toBeVisible();
  const filters = page.getByRole("button", { name: "Filters", exact: true });
  const collapsed = await filters.isVisible();
  if (collapsed) await filters.click();
  await page
    .getByRole("combobox", { name: "Acceptance rate", exact: true })
    .selectOption("10");
  if (collapsed)
    await page.getByRole("button", { name: /Show \d+ results/ }).click();
  await page.getByLabel("Search universities").fill("Harvard");
  const card = page
    .getByRole("article")
    .filter({ has: page.getByRole("heading", { name: "Harvard University" }) });
  await expect(card).toContainText("3.7%");
  await expect(card).toContainText("Fall 2026");
  await card
    .getByRole("link", { name: "View Harvard University profile" })
    .click();
  await page
    .locator(".admit-stat-profile")
    .getByText("Source", { exact: true })
    .click();
  await expect(page.locator(".admit-stat-profile a")).toHaveAttribute(
    "href",
    /college.harvard.edu\/admissions\/admissions-statistics/,
  );

  await page.goto("/advisor");
  await page
    .getByRole("textbox", { name: "Ask a question" })
    .fill("Какая доля принятых в Гарвард?");
  await page.getByRole("button", { name: "Send question" }).click();
  await expect(
    page.getByText(/^Harvard University — 3,7.*Осень 2026/),
  ).toBeVisible();
  const sources = page.locator("details").filter({
    has: page.getByRole("heading", { name: "Официальные источники" }),
  });
  await sources.getByText("Официальные источники").click();
  await expect(sources.locator('a[href^="https://"]')).toHaveCount(1);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
