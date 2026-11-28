import { expect, test } from "@playwright/test";

test("My List uses shared saves, shows evidence and persists group changes", async ({
  page,
}) => {
  await page.goto("/explore?q=Harvard");
  await page
    .getByRole("button", { name: "Save university", exact: true })
    .click();

  const menu = page.getByRole("button", { name: "Open menu", exact: true });
  if (await menu.isVisible()) await menu.click();
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "My List", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "My List", exact: true }),
  ).toBeVisible();

  const reach = page.locator('section[data-group="reach"]');
  const target = page.locator('section[data-group="target"]');
  const safety = page.locator('section[data-group="safety"]');
  const harvard = page
    .getByRole("article")
    .filter({
      has: page.getByRole("link", { name: "Harvard University", exact: true }),
    });
  await expect(reach.locator("article")).toContainText("Harvard University");
  await expect(harvard).toContainText("3.7%");
  await expect(harvard).toContainText("Fall 2026");
  await harvard.getByText("Basis & source").click();
  await expect(
    harvard.getByRole("link", { name: "Official admission data" }),
  ).toHaveAttribute(
    "href",
    /college.harvard.edu\/admissions\/admissions-statistics/,
  );

  const group = page.getByRole("combobox", {
    name: "List group for Harvard University",
    exact: true,
  });
  await group.selectOption("safety");
  await expect(safety.locator("article")).toContainText("Harvard University");
  await harvard.getByRole("button", { name: /Add to comparison/ }).click();
  await expect(
    harvard.getByRole("button", { name: /Remove from comparison/ }),
  ).toHaveAttribute("aria-pressed", "true");

  await page
    .getByRole("button", { name: "Add to Target", exact: true })
    .click();
  const picker = page.getByRole("dialog");
  await picker.getByRole("searchbox").fill("Yale");
  await picker
    .getByRole("button", { name: "Add Yale University", exact: true })
    .click();
  await picker.getByRole("button", { name: "Close", exact: true }).click();

  await page.reload();
  await expect(safety.locator("article")).toContainText("Harvard University");
  await expect(target.locator("article")).toContainText("Yale University");
  await expect(target.locator("article")).toContainText("4.4%");
  await group.selectOption("");
  await expect(reach.locator("article")).toContainText("Harvard University");
  await target
    .getByRole("button", {
      name: "Remove from My List · Yale University",
      exact: true,
    })
    .click();
  await expect(target.locator("article")).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
