import { expect, test } from "@playwright/test";

test("pricing leaves the workspace and offers a direct return to the library", async ({
  page,
}) => {
  await page.goto("/pricing?return=%2Fessays");
  await expect(
    page.getByRole("navigation", { name: "Main navigation" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Back to essays" }),
  ).toHaveAttribute("href", "/essays");
  await expect(
    page.getByText("2 essay reading guides", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("2 student profile guides", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Yearly", exact: true }).click();
  await expect(page.getByText("$84", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Try Pro preview" }).click();
  await expect(page).toHaveURL(/\/essays\?billing=preview$/);
  await expect(page.locator('nav[aria-label="Main navigation"]')).toHaveCount(
    1,
  );
});

test("a university plan opens with Pro and keeps drafts and tasks across plan changes", async ({
  page,
}) => {
  await page.goto("/explore?q=harvard");
  await expect(
    page.getByRole("textbox", { name: "Search universities" }),
  ).toBeEnabled();
  const school = page
    .getByRole("article")
    .filter({ hasText: "Harvard University" });
  await expect(school).toContainText("3.7%");
  await school.getByRole("link", { name: "Plan application" }).click();
  await expect(
    page.getByRole("heading", { name: "Harvard University", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Checklist", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("link", { name: "Compare plans" }).click();
  await page.getByRole("button", { name: "Yearly", exact: true }).click();
  await expect(page.getByText("$84", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Try Pro preview" }).click();
  await expect(page).toHaveURL(/\/universities\/harvard\/apply/);
  await expect(
    page.getByRole("heading", { name: "Profile fit review" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Checklist", exact: true }).click();
  const documentStatus = page
    .getByRole("combobox")
    .filter({
      has: page.getByRole("option", { name: "Prepared", exact: true }),
    })
    .first();
  await expect(documentStatus).toBeEnabled();
  await documentStatus.selectOption("Prepared");
  await expect(
    page.getByRole("progressbar", { name: "Checklist progress" }),
  ).toHaveAttribute("value", "1");
  await page.getByRole("button", { name: "Funding & dates" }).click();
  await expect(
    page.getByRole("heading", { name: "Application and aid deadlines" }),
  ).toBeVisible();

  const sections = page.getByRole("group", { name: "Application sections" });
  await sections.getByRole("button", { name: "Essays", exact: true }).click();
  await page.getByRole("button", { name: "New essay" }).click();
  await expect(
    page.getByRole("textbox", { name: "University", exact: true }),
  ).toHaveValue("Harvard University");
  await page.getByLabel("Draft title").fill("Harvard environmental project");
  await page
    .getByRole("textbox", { name: /^Your draft/ })
    .fill("I tested water quality in the stream near my school.");
  await page.getByRole("button", { name: "Save draft" }).click();
  await expect(
    page.getByRole("status").getByText(/draft saved/i),
  ).toBeVisible();

  await page.goto("/pricing?return=%2Funiversities%2Fharvard%2Fapply");
  await page.getByRole("button", { name: "Switch to Free preview" }).click();
  await expect(page.getByRole("link", { name: "Compare plans" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Checklist", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("link", { name: "Compare plans" }).click();
  await page.getByRole("button", { name: "Try Pro preview" }).click();
  await page.getByRole("button", { name: "Checklist", exact: true }).click();
  await expect(documentStatus).toHaveValue("Prepared");
  await sections.getByRole("button", { name: "Essays", exact: true }).click();
  await expect(
    page.getByText("Harvard environmental project", { exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
