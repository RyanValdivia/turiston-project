import { test, expect } from "@playwright/test";

test("dashboard shows stat cards, weekly chart, and recent activity", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByText("Pérdida est.")).toBeVisible();
  await expect(page.getByText("Desperdicio", { exact: true })).toBeVisible();
  await expect(page.getByText("Prevención")).toBeVisible();
  await expect(page.getByText("Operaciones")).toBeVisible();
  await expect(page.getByText("Actividad reciente")).toBeVisible();
  await expect(page.getByRole("link", { name: "Registrar el día" })).toBeVisible();
});

test("assistant widget opens and shows the flow picker", async ({ page }) => {
  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Abrir asistente" }).click();
  await expect(page.getByText("¿Qué quieres registrar?")).toBeVisible();
  // Dashboard also has a "Registrar el día" <Link> CTA — scope to the flow-picker <button>.
  await expect(page.getByRole("button", { name: "Registrar el día" })).toBeVisible();
  await expect(page.getByText("Entrega a reciclador")).toBeVisible();
});
