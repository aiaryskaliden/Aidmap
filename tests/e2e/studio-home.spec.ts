import { expect, test } from "@playwright/test";
import { emptyState, STORAGE_KEY } from "../../lib/storage/state";
import { emptyStudio } from "../../types/studio";

test("Studio overview shows real checklist progress and upcoming planner dates", async ({
  page,
}) => {
  const activeDate = new Date(Date.now() + 14 * 86400000)
    .toISOString()
    .slice(0, 10);
  const initial = emptyState();
  const application = {
    notes: "",
    applicationType: "",
    tasks: [
      { id: "transcript", text: "Prepare transcript", done: true },
      { id: "portfolio", text: "Prepare portfolio", done: false },
    ],
  };
  initial.saved = [
    {
      ...application,
      universityId: "harvard",
      status: "Preparing",
      deadline: activeDate,
    },
    {
      ...application,
      universityId: "mit",
      status: "Researching",
      deadline: "2020-01-01",
    },
    {
      ...application,
      universityId: "yale",
      status: "Decision received",
      deadline: activeDate,
    },
  ];
  initial.studio = { ...emptyStudio, name: "Taylor" };
  await page.addInitScript(
    ({ key, workspace }) => {
      localStorage.setItem(key, JSON.stringify(workspace));
    },
    { key: STORAGE_KEY, workspace: initial },
  );
  await page.goto("/studio");
  await expect(
    page.getByRole("heading", { name: "Welcome back, Taylor" }),
  ).toBeVisible();

  const routes = page.getByRole("region", { name: "My applications" });
  await expect(routes.getByRole("article")).toHaveCount(4);
  for (const [name, slug] of [
    ["UCAS", "ucas"],
    ["University of California", "university-of-california"],
    ["Common App", "common-app"],
    ["MIT", "mit"],
  ]) {
    await expect(
      routes.getByRole("link", { name, exact: true }),
    ).toHaveAttribute("href", `/applications/${slug}`);
    await expect(
      routes.getByRole("progressbar", { name: `${name} · Preparation` }),
    ).toHaveAttribute("value", "0");
  }

  const apps = page.getByRole("region", { name: "Saved universities" });
  const harvard = apps
    .getByRole("article")
    .filter({ hasText: "Harvard University" });
  const progress = harvard.getByRole("progressbar", {
    name: "Items ready or complete",
  });
  await expect(
    harvard.getByRole("link", { name: /Common App/ }),
  ).toHaveAttribute("href", /^https:\/\//);
  await expect(
    apps.getByRole("link", { name: /MIT's own first-year application portal/ }),
  ).toBeVisible();
  await expect(progress).toHaveAttribute("value", "1");
  await expect(progress).toHaveAttribute("max", "2");
  await expect(
    apps.getByRole("heading", { name: "Yale University" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("progressbar", { name: "Setup progress" }),
  ).toHaveAttribute("value", "1");

  const deadlines = page.getByRole("region", { name: "Upcoming deadlines" });
  await expect(deadlines.getByRole("listitem")).toHaveCount(1);
  await expect(
    deadlines.getByRole("link", { name: "Harvard University" }),
  ).toBeVisible();
  await expect(deadlines.getByRole("listitem").locator("time")).toHaveAttribute(
    "datetime",
    activeDate,
  );
  await deadlines.getByText("Past due", { exact: false }).click();
  await expect(deadlines.locator("details time")).toHaveAttribute("datetime", "2020-01-01");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);

  await apps
    .getByRole("link", { name: "Open plan · Harvard University" })
    .click();
  await expect(page).toHaveURL(/\/planner#status-harvard$/);
  await expect(
    page.getByRole("combobox", {
      name: "Application status for Harvard University",
    }),
  ).toHaveValue("Preparing");
});

test("a preparation step updates only its own dashboard card after a reload", async ({
  page,
}) => {
  await page.goto("/");
  const cards = page.getByRole("region", { name: "My applications" });
  await cards.getByRole("link", { name: "Open · UCAS", exact: true }).click();
  const account = page.getByRole("checkbox").first();
  await account.check();
  await page
    .getByRole("link", { name: "My applications", exact: true })
    .click();
  await expect(page).toHaveURL("/");
  await page.reload();
  await expect(
    cards.getByRole("progressbar", { name: "UCAS · Preparation" }),
  ).toHaveAttribute("value", "17");
  await expect(
    cards.getByRole("progressbar", { name: "MIT · Preparation" }),
  ).toHaveAttribute("value", "0");
  await cards.getByRole("link", { name: "Open · UCAS", exact: true }).click();
  await expect(account).toBeChecked();
  await account.uncheck();
  await page
    .getByRole("link", { name: "My applications", exact: true })
    .click();
  await expect(
    cards.getByRole("progressbar", { name: "UCAS · Preparation" }),
  ).toHaveAttribute("value", "0");
});
