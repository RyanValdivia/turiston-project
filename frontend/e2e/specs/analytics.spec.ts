import { test, expect } from "@playwright/test";

test("renders indicator cards and charts, and can toggle the period", async ({ page }) => {
  await page.goto("/analytics");
  await expect(page.getByText("Pérdida económica total")).toBeVisible();
  await expect(page.getByText("Valorización")).toBeVisible();
  await expect(page.getByText("Recomendaciones para este periodo")).toBeVisible();

  const toggle = page.getByRole("button", { name: /Este mes|Mes anterior/ });
  await expect(toggle).toContainText("Este mes");
  await toggle.click();
  await expect(toggle).toContainText("Mes anterior");
});

test("marks a pending recommendation as applied, if one exists this period", async ({ page }) => {
  await page.goto("/analytics");
  await expect(page.getByText("Recomendaciones para este periodo")).toBeVisible();

  const applyButton = page.getByRole("button", { name: "Marcar como aplicada" }).first();
  const hasPending = await applyButton.isVisible().catch(() => false);
  if (hasPending) {
    await applyButton.click();
    await expect(page.getByText("Marcada como aplicada").first()).toBeVisible();
  }
});
