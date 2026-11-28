import { expect, test } from "@playwright/test";

test("Pro workspace separates drafts and shares checklist progress", async ({
  page,
  context,
}) => {
  const path = "/universities/harvard/apply";
  await page.goto(path);
  await expect(
    page.getByRole("link", { name: "Compare plans" }),
  ).toHaveAttribute(
    "href",
    "/pricing?return=%2Funiversities%2Fharvard%2Fapply",
  );
  await expect(
    page.getByRole("button", { name: "Checklist", exact: true }),
  ).toHaveCount(0);

  await context.addCookies([
    {
      name: "aidmap-preview-membership",
      value: "pro",
      url: new URL("/", page.url()).href,
      httpOnly: true,
    },
  ]);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Profile fit review" }),
  ).toBeVisible();
  await expect(page.getByText("Loading your workspace…")).toHaveCount(0);
  const checklist = page.getByRole("button", {
    name: "Checklist",
    exact: true,
  });
  await checklist.click();
  const application = page.getByRole("combobox", {
    name: "Application, activities and personal essay",
  });
  await application.selectOption("Prepared");
  await page.reload();
  await expect(page.getByText("Loading your workspace…")).toHaveCount(0);
  await checklist.click();
  await expect(application).toHaveValue("Prepared");
  await page.getByRole("button", { name: "Funding & dates" }).click();
  await expect(
    page.getByRole("heading", { name: "Cost and funding" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Essays", exact: true }).click();
  await page.getByRole("button", { name: "New essay" }).click();
  await expect(page.getByLabel("University", { exact: true })).toHaveValue(
    "Harvard University",
  );
  await page.getByLabel("Draft title").fill("Harvard personal statement");
  await page.getByRole("button", { name: "Save draft" }).click();
  await expect(page.getByText("Draft saved on this device.")).toBeVisible();

  await page.goto("/universities/yale/apply");
  await expect(page.getByText("Loading your workspace…")).toHaveCount(0);
  await page.getByRole("button", { name: "Essays", exact: true }).click();
  await expect(page.getByRole("button", { name: "New essay" })).toBeVisible();
  await expect(page.getByText("Harvard personal statement")).toHaveCount(0);
});
