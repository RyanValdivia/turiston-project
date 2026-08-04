import { test, expect } from "@playwright/test";

test("edits and saves restaurant profile fields", async ({ page }) => {
  await page.goto("/profile");
  await page.getByRole("button", { name: "Editar" }).click();

  const ciudad = page.getByLabel("Ciudad");
  await ciudad.fill("Arequipa E2E");
  await page.getByRole("button", { name: "Guardar" }).click();

  await expect(page.getByRole("button", { name: "Editar" })).toBeVisible();
  await expect(page.getByLabel("Ciudad")).toHaveValue("Arequipa E2E");
});

test("logs out and redirects to /auth", async ({ page }) => {
  await page.goto("/profile");
  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(page).toHaveURL("/auth");
});
