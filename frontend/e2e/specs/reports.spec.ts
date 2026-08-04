import { test, expect } from "@playwright/test";

test("generates a report and downloads it as CSV", async ({ page }) => {
  await page.goto("/reports");
  await page.getByRole("button", { name: /Generate/ }).click();
  await expect(page.getByText("Download CSV").first()).toBeVisible({ timeout: 15_000 });

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByText("Download CSV").first().click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/\.csv$/i);
});
