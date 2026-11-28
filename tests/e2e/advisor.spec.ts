import { test, expect } from "@playwright/test";

test("a school name resolves a pending test question and the next turn can change language", async ({
  page,
}) => {
  await page.goto("/advisor");
  const input = page.getByRole("textbox", { name: "Ask a question" });
  await input.fill("Какой нужен TOEFL?");
  await input.press("Enter");
  await expect(page.locator('article[lang="ru"]').last()).toContainText(
    "О каком университете",
  );
  await input.fill("MIT");
  await input.press("Enter");
  const answer = page
    .locator("article")
    .filter({
      has: page.getByRole("link", {
        name: "Massachusetts Institute of Technology",
      }),
    })
    .first();
  await expect(answer).toContainText("TOEFL");
  await expect(answer).toContainText("0–120");
  await expect(answer).toContainText("1–6");
  await input.fill("What is the ACT policy for international applicants?");
  await input.press("Enter");
  await expect(page.locator('article[lang="en"]').last()).toContainText(
    "SAT or ACT required",
  );
  await input.fill("Эссе үлгілерін оқығым келеді");
  await input.press("Enter");
  await expect(
    page
      .locator('article[lang="kk"]')
      .last()
      .getByRole("link", { name: "Эссе үлгілері" }),
  ).toHaveAttribute("href", "/essays");
});

test("advisor compares catalogue records, opens sources and fits the viewport", async ({
  page,
}) => {
  await page.goto("/advisor");
  await expect(
    page.getByRole("heading", { name: "Admissions Advisor" }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "Compare MIT and Princeton based on my profile",
    })
    .click();
  await page.getByRole("button", { name: "Send question" }).click();
  await expect(page.getByRole("table")).toBeVisible();
  await expect(
    page
      .getByRole("table")
      .getByRole("link", { name: /Massachusetts Institute of Technology/ }),
  ).toHaveAttribute("href", "/universities/mit");
  await expect(
    page.getByRole("table").getByRole("link", { name: /Princeton University/ }),
  ).toHaveAttribute("href", "/universities/princeton");
  await page.getByRole("button", { name: "Profiles", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Official sources" }),
  ).toBeVisible();
  await expect(
    page.locator('li[id^="advisor-source-0-"] a').first(),
  ).toHaveAttribute("href", /^https:\/\//);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole("heading", { name: "Princeton University", exact: true })
    .getByRole("link")
    .click();
  await expect(page).toHaveURL(/\/universities\/princeton$/);
});

test("advisor accepts localized questions and keeps the selected university from a profile", async ({
  page,
}) => {
  await page.goto("/universities/mit");
  await page.getByRole("link", { name: "Open Advisor" }).click();
  await expect(page).toHaveURL(/\/advisor\?university=mit$/);
  await page.getByLabel("Workspace language").selectOption("kk");
  await page.getByLabel("Сұрақ қою").fill("Өтінім беру жоспарын құрастыр");
  await page.getByRole("button", { name: "Сұрақты жіберу" }).click();
  await expect(page.getByText(/қабылдау раундын/).first()).toBeVisible();
  await expect(
    page.getByRole("link", {
      name: "Massachusetts Institute of Technology",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByText("Келесі қадамдар", { exact: true }),
  ).toBeVisible();
});
