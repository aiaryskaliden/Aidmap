import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

// Captures an isolated, empty browser workspace. It never reads the user's
// normal browser profile or uploads screenshots.
const base = process.env.AIDMAP_PREVIEW_URL || "http://127.0.0.1:3000";
const browser = await chromium.launch({
  channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
});
await mkdir("docs/screenshots", { recursive: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 980 },
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(base);
  await page
    .getByRole("button", { name: "Save university", exact: true })
    .first()
    .waitFor({ state: "visible" });
  await page.waitForFunction(
    () =>
      !document.querySelector('button[aria-label="Save university"]')?.disabled,
  );
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: "docs/screenshots/home-desktop.png",
    scale: "css",
  });
  await page.goto(`${base}/explore?major=Computer+Science&aid=international`);
  await page
    .getByRole("heading", { name: "Find a place for your ambition." })
    .waitFor();
  await page.screenshot({
    path: "docs/screenshots/explore-desktop.png",
    scale: "css",
  });
  await page.goto(`${base}/universities/bowdoin`);
  await page.locator("#financial-aid").waitFor();
  await page.screenshot({
    path: "docs/screenshots/university-desktop.png",
    scale: "css",
  });
  await page.locator("#financial-aid").evaluate((section) => {
    window.scrollTo({
      top: section.getBoundingClientRect().top + window.scrollY - 100,
      behavior: "instant",
    });
  });
  await page.screenshot({
    path: "docs/screenshots/aid-policy.png",
    scale: "css",
  });
  await page.goto(`${base}/calculator`);
  await page.getByRole("button", { name: "Load illustrative example" }).click();
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.screenshot({
    path: "docs/screenshots/calculator-desktop.png",
    fullPage: true,
    scale: "css",
  });
  await page.goto(`${base}/profile`);
  await page
    .getByRole("button", { name: "Save preferences", exact: true })
    .waitFor();
  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  await page.screenshot({
    path: "docs/screenshots/preferences-dark.png",
    scale: "css",
  });
  const mobile = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
  });
  mobile.on("pageerror", (error) => errors.push(error.message));
  await mobile.goto(base);
  await mobile.waitForFunction(
    () =>
      !document.querySelector('button[aria-label="Save university"]')?.disabled,
  );
  await mobile.evaluate(() => document.fonts.ready);
  await mobile.screenshot({
    path: "docs/screenshots/home-mobile-first-screen.png",
    scale: "css",
  });
  await mobile.screenshot({
    path: "docs/screenshots/home-mobile.png",
    fullPage: true,
    scale: "css",
  });
  if (errors.length) throw new Error(errors.join("\n"));
  console.log("Captured 8 screenshots from an isolated browser workspace.");
} finally {
  await browser.close();
}
