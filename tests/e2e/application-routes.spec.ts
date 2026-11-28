import { expect, test } from "@playwright/test";
import { applicationRoutes } from "../../lib/studio/application-routes";

test("each application route opens its portal and retains a separate preparation checklist", async ({
  page,
}) => {
  for (const route of applicationRoutes) {
    await page.goto(route.href);
    await expect(
      page.getByRole("heading", { name: route.name, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Open official portal" }),
    ).toHaveAttribute("href", route.portal);
    const progress = page.getByRole("progressbar", {
      name: "Preparation checklist",
    });
    await expect(progress).toHaveAttribute("value", "0");
    const item = page.getByText(route.steps[0].label[0], { exact: true });
    await item.click();
    await expect(progress).toHaveAttribute("value", "1");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.goto(applicationRoutes[0].href);
  await expect(page.getByRole("checkbox").first()).toBeChecked();
  await page.getByRole("checkbox").first().focus();
  await page.keyboard.press("Space");
  await expect(page.getByRole("progressbar")).toHaveAttribute("value", "0");
});
