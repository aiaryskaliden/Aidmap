import { expect, test } from "@playwright/test";

test("both libraries offer two free guides; bookmarks and situation filters survive reload", async ({ page }) => {
  for (const [path, count] of [["/essays", 6], ["/profiles", 7]] as const) {
    await page.goto(path);
    const cards = page.getByRole("article");
    await expect(cards).toHaveCount(count);
    await page.getByLabel("Guide access").selectOption("free");
    await expect(cards).toHaveCount(2);
    await cards.first().getByRole("button", { name: /^Bookmark / }).click();
    await page.getByRole("button", { name: "Saved by me" }).click();
    await page.reload();
    await expect(cards).toHaveCount(1);
    await cards.getByRole("link", { name: "Read guide" }).click();
    await expect(page.getByRole("link", { name: /^Read the original/ })).toHaveAttribute("href", /^https:\/\//);
    await expect(page.getByText("For your own application")).toBeVisible();
  }
  await page.goto("/essays");
  await page.getByRole("combobox", { name: "Situation", exact: true }).selectOption("Work experience");
  await page.reload();
  await expect(page.getByRole("heading", { name: "In the Belly of the Ship" })).toBeVisible();
  await expect(page.getByRole("article")).toHaveCount(1);
});

test("a locked reading guide opens after upgrading and stays gated again after returning to Free", async ({ page }) => {
  const path = "/profiles/uriel-lin";
  await page.goto(path);
  await expect(page.getByRole("heading", { name: "Read this guide with AidMap Pro" })).toBeVisible();
  await expect(page.getByText("For your own application", { exact: true })).toHaveCount(0);
  await page.getByRole("link", { name: "See Pro plans" }).click();
  await expect(page.getByRole("navigation", { name: "Main navigation" })).toHaveCount(0);
  await page.getByRole("button", { name: "Try Pro preview" }).click();
  await expect(page).toHaveURL(/\/profiles\/uriel-lin/);
  await expect(page.getByRole("link", { name: "Read the original profile" })).toHaveAttribute("href", /princeton.edu/);
  await expect(page.getByRole("heading", { name: "What to look for in this profile" })).toBeVisible();
  await page.goto("/essays/belly-of-the-ship");
  await expect(page.getByRole("link", { name: "Read the original essay" })).toBeVisible();
  await page.goto("/pricing");
  await page.getByRole("button", { name: "Switch to Free preview" }).click();
  await page.goto(path);
  await expect(page.getByRole("link", { name: "See Pro plans" })).toBeVisible();
});
