import { chromium, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";

// Synthetic, isolated storage only. Does not open or read the user's browser profile.
const base = "http://127.0.0.1:3000";
const directory = "docs/screenshots/core-mvp";
await mkdir(directory, { recursive: true });
await mkdir("tmp", { recursive: true });
const browser = await chromium.launch({
  channel: process.env.PLAYWRIGHT_CHANNEL || "msedge",
});
const errors = [];
try {
  for (const [name, viewport] of Object.entries({
    desktop: { width: 1440, height: 900 },
    tablet: { width: 768, height: 1024 },
    mobile: { width: 390, height: 844 },
  })) {
    const context = await browser.newContext({
      viewport,
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`${base}/universities/mit`);
    await expect(
      page.getByRole("button", { name: "Switch to dark theme" }),
    ).toBeEnabled();
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({
      path: `${directory}/${name}-profile-light.png`,
      scale: "css",
    });
    await page.getByRole("button", { name: "Switch to dark theme" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await page.screenshot({
      path: `${directory}/${name}-profile-dark.png`,
      scale: "css",
    });
    await page
      .getByRole("button", {
        name: "Add sourced checklist to my planner",
        exact: true,
      })
      .click();
    await page
      .getByLabel("Application round", { exact: true })
      .selectOption("Regular Action");
    await page.goto(`${base}/planner`);
    await page
      .getByRole("button", { name: "Requirements matrix", exact: true })
      .click();
    await page.screenshot({
      path: `${directory}/${name}-matrix.png`,
      scale: "css",
    });
    if (name === "desktop") {
      await page
        .getByRole("button", { name: "Timeline & tasks", exact: true })
        .click();
      await page
        .getByLabel("Notes for Massachusetts Institute of Technology", {
          exact: true,
        })
        .fill("SYNTHETIC PRIVATE NOTE — must not print");
      await page
        .getByRole("button", { name: "Print brief", exact: true })
        .click();
      await page.emulateMedia({ media: "print" });
      await expect(page.locator(".print-brief")).toBeVisible();
      await expect(page.locator(".print-brief")).not.toContainText(
        "SYNTHETIC PRIVATE NOTE",
      );
      await page.pdf({
        path: "tmp/aidmap-application-brief.pdf",
        format: "A4",
        printBackground: true,
      });
      await page.emulateMedia({ media: "screen" });
    }
    await page.goto(`${base}/calculator`);
    await page
      .getByRole("button", { name: "Load illustrative example" })
      .click();
    await page.evaluate(() => {
      document.activeElement?.blur?.();
      window.scrollTo({ top: 0, behavior: "instant" });
    });
    await page.screenshot({
      path: `${directory}/${name}-calculator.png`,
      fullPage: true,
      scale: "css",
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.goto(`${base}/compare`);
    await page.getByLabel("Add university to comparison").selectOption("mit");
    await page
      .getByLabel("Add university to comparison")
      .selectOption("bowdoin");
    await page.getByLabel("Show differences only").check();
    await expect(
      page.locator("tbody th").filter({ hasText: /Country$/ }),
    ).toHaveCount(0);
    await expect(
      page
        .locator("tbody th")
        .filter({ hasText: /^Admission & financial need$/ }),
    ).toHaveCount(0);
    await expect(
      page
        .locator("tbody th")
        .filter({ hasText: /^Aid scope and exceptions$/ }),
    ).toBeVisible();
    await page
      .getByRole("combobox", { name: "Comparison section" })
      .selectOption("APPLICATION REQUIREMENTS");
    await expect(
      page.locator("tbody th").filter({ hasText: /SAT \/ ACT/ }),
    ).toBeVisible();
    await expect(
      page
        .locator("tbody th")
        .filter({ hasText: /^Aid scope and exceptions$/ }),
    ).toHaveCount(0);
    await page.screenshot({
      path: `${directory}/${name}-compare.png`,
      scale: "css",
    });
    await context.close();
  }
  expect(errors).toEqual([]);
  console.log(
    "Captured 15 screenshots across desktop/tablet/mobile and a synthetic print brief; section and differences-only comparisons passed.",
  );
} finally {
  await browser.close();
}
