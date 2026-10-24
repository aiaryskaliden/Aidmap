import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";

test("sourced progress survives refresh and rounds without changing notes or personal dates", async ({
  page,
}) => {
  await page.goto("/universities/bowdoin#checklist");
  await page
    .getByLabel("Application round", { exact: true })
    .selectOption("Early Decision");
  await page
    .getByRole("button", {
      name: "Add sourced checklist to my planner",
      exact: true,
    })
    .click();
  const teacher = page.getByLabel(
    "Your progress: One junior- or senior-year core-subject teacher recommendation",
    { exact: true },
  );
  await teacher.selectOption("Prepared");
  const before = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("aidmap:v1")!).saved[0]
        .requirementProgress,
  );
  await page
    .getByRole("button", { name: "Refresh sourced checklist", exact: true })
    .click();
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("aidmap:v1")!).saved[0]
          .requirementProgress,
    ),
  ).toEqual(before);
  await page
    .getByLabel("Application round", { exact: true })
    .selectOption("Regular Decision");
  await expect(
    page.getByRole("heading", {
      name: "ED agreement: student, parent and school signatures",
      exact: true,
    }),
  ).toHaveCount(0);
  await expect(teacher).toHaveValue("Prepared");
  const translation = page
    .locator(".requirement-card")
    .filter({
      has: page.getByRole("heading", {
        name: "English translation of academic record",
        exact: true,
      }),
    });
  await translation
    .getByLabel("Why this condition does not apply (if relevant)")
    .fill("My school transcript is in English.");
  await translation.getByRole("combobox").selectOption("Not applicable");
  await page.goto("/planner");
  await page
    .getByLabel("Notes for Bowdoin College", { exact: true })
    .fill("Құжат — 家族 private note");
  await page
    .getByLabel("Custom deadline for Bowdoin College")
    .fill("2026-12-20");
  await page.reload();
  await expect(
    page.getByLabel("Notes for Bowdoin College", { exact: true }),
  ).toHaveValue("Құжат — 家族 private note");
  await expect(
    page.getByLabel("Custom deadline for Bowdoin College"),
  ).toHaveValue("2026-12-20");
  await page
    .getByRole("button", { name: "Requirements matrix", exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "Shortlist requirements matrix" }),
  ).toContainText("Bowdoin");
  await page.getByRole("button", { name: "Print brief", exact: true }).click();
  await expect(page.locator(".brief-private-notes")).toHaveCount(0);
  await page.emulateMedia({ media: "print" });
  await expect(page.locator(".print-brief")).toBeVisible();
  await expect(page.locator(".print-brief")).not.toContainText("private note");
  await expect(page.locator(".print-brief")).toContainText(
    "https://www.bowdoin.edu",
  );
});

test("relative aid dates need a trigger; selected ICS preserves separate personal target", async ({
  page,
}) => {
  await page.goto("/universities/bowdoin#checklist");
  await page
    .getByRole("button", {
      name: "Add sourced checklist to my planner",
      exact: true,
    })
    .click();
  await page.goto("/planner");
  await page
    .getByLabel("Custom deadline for Bowdoin College")
    .fill("2026-12-20");
  await page
    .getByRole("button", { name: "Deadline calendar", exact: true })
    .click();
  const aid = page.getByRole("checkbox", {
    name: "Export bowdoin Non-Canadian international aid materials",
    exact: true,
  });
  await expect(aid).toBeDisabled();
  await page
    .getByLabel("Your event date: Admission offer", { exact: true })
    .fill("2027-03-15");
  await expect(aid).toBeEnabled();
  await aid.check();
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export 1 date (.ics)", exact: true })
    .click();
  const data = await readFile((await (await download).path())!, "utf8");
  const unfolded = data.replace(/\r\n /g, "");
  expect(unfolded).toContain("DTSTART;VALUE=DATE:20270322");
  expect(unfolded).toContain(
    "UID:bowdoin-international-aid-after-offer@aidmap.local",
  );
  expect(unfolded).toContain("Source: https://www.bowdoin.edu");
  expect(unfolded).not.toContain("VALARM");
  expect(unfolded).not.toContain("20261220");
  await page.reload();
  await page
    .getByRole("button", { name: "Deadline calendar", exact: true })
    .click();
  await expect(
    page.getByLabel("Your event date: Admission offer", { exact: true }),
  ).toHaveValue("2027-03-15");
});

test("calculator keeps independent results and compares currencies without conversion", async ({
  page,
}) => {
  await page.goto("/calculator");
  for (const [label, value] of Object.entries({
    Tuition: "45000",
    "Mandatory fees": "0",
    Housing: "10000",
    "Food & meals": "5000",
    "Health insurance": "0",
    "Books & personal expenses": "0",
    Transportation: "0",
  }))
    await page
      .getByRole("spinbutton", { name: label, exact: true })
      .fill(value);
  await expect(page.getByTestId("total-cost")).toHaveText("$60,000");
  const budget = page.getByLabel("Maximum annual contribution (USD)");
  await budget.fill("");
  await expect(page.getByTestId("budget-gap")).toHaveText("Unknown");
  await page
    .getByLabel("Confirmed annual grant / scholarship (USD)")
    .fill("45000");
  await page
    .getByRole("checkbox", {
      name: "I have a written award offer for this annual amount and currency.",
    })
    .check();
  await expect(page.getByTestId("remaining-cost")).toHaveText("$15,000");
  await budget.fill("-100");
  await expect(page.getByTestId("total-cost")).toHaveText("$60,000");
  await expect(page.getByTestId("remaining-cost")).toHaveText("$15,000");
  await expect(page.getByTestId("budget-gap")).toHaveText("Unknown");
  await budget.fill("0");
  await page.getByLabel("Optional hypothetical total award (USD)").fill("-1");
  await expect(page.getByTestId("remaining-cost")).toHaveText("$15,000");
  await page
    .getByLabel("Optional hypothetical total award (USD)")
    .fill("45000");
  await expect(page.locator(".hypothetical-result")).toContainText("$15,000");
  await page.getByLabel("Cost academic year").fill("2026–27");
  await page.getByLabel("Scenario name").fill("USD baseline");
  await page
    .getByRole("button", { name: "Save funding scenario", exact: true })
    .click();
  await page.getByLabel("Currency", { exact: true }).selectOption("EUR");
  await expect(
    page.getByRole("spinbutton", { name: "Tuition", exact: true }),
  ).toHaveValue("");
  await page.getByRole("button", { name: "Load illustrative example" }).click();
  // Illustrative example deliberately uses USD; select EUR again and enter a complete EUR scenario.
  await page.getByLabel("Currency", { exact: true }).selectOption("EUR");
  for (const label of [
    "Tuition",
    "Mandatory fees",
    "Housing",
    "Food & meals",
    "Health insurance",
    "Books & personal expenses",
    "Transportation",
  ])
    await page
      .getByRole("spinbutton", { name: label, exact: true })
      .fill(label === "Tuition" ? "10000" : "0");
  await page.getByLabel("Cost academic year").fill("2027–28 estimate");
  await page.getByLabel("Scenario name").fill("EUR baseline");
  await page
    .getByRole("button", { name: "Save funding scenario", exact: true })
    .click();
  await page.getByLabel("USD baseline · USD", { exact: true }).check();
  await page.getByLabel("EUR baseline · EUR", { exact: true }).check();
  const table = page.getByRole("region", {
    name: "Saved funding scenario comparison",
  });
  await expect(table).toContainText("2026–27");
  await expect(table).toContainText("2027–28 estimate");
  await expect(
    page.getByText(
      "Different currencies: amounts are not ranked, added or converted.",
    ),
  ).toBeVisible();
  await table.getByRole("button", { name: "Edit assumptions" }).first().click();
  await expect(
    page.getByLabel("Confirmed annual grant / scholarship (USD)"),
  ).toHaveValue("45000");
  await expect(page.getByTestId("remaining-cost")).toHaveText("$15,000");
  await page.getByLabel("Scenario name").fill("USD baseline updated");
  await page
    .getByRole("button", { name: "Update funding scenario", exact: true })
    .click();
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("aidmap:v1")!).scenarios.length,
    ),
  ).toBe(2);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "USD baseline updated", exact: true }),
  ).toBeVisible();
});

test("funding URL state, researched profiles, keyboard and reflow remain usable", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const remote: string[] = [];
  page.on("request", (r) => {
    if (
      /^https?:/.test(r.url()) &&
      !r.url().startsWith("http://127.0.0.1:3000")
    )
      remote.push(new URL(r.url()).origin);
  });
  await page.goto("/funding");
  await page.getByLabel("Search funding", { exact: true }).fill("MIT");
  await expect(page).toHaveURL(/q=MIT/);
  await page.reload();
  await expect(page.getByLabel("Search funding", { exact: true })).toHaveValue(
    "MIT",
  );
  for (const id of [
    "harvard",
    "yale",
    "princeton",
    "mit",
    "amherst",
    "dartmouth",
    "bowdoin",
    "brown",
  ]) {
    await page.goto("/universities/" + id);
    await expect(page.locator(".program-grid article").first()).toBeVisible();
    await expect(page.locator("#estimated-cost .cost-total")).not.toContainText(
      "Not verified",
    );
    await expect(page.locator("#selection")).toContainText(
      "What matters in admission",
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      id,
    ).toBe(true);
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  await page.goto("/universities/mit");
  await page
    .getByRole("button", { name: "Explain SAT and ACT policies" })
    .focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".help-popover:popover-open")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.screenshot({
    path: `test-results/${info.project.name}-core-dark.png`,
    fullPage: false,
  });
  await page.setViewportSize({ width: 780, height: 844 });
  await page.evaluate(() => (document.body.style.zoom = "2"));
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
  expect(remote).toEqual([]);
});
