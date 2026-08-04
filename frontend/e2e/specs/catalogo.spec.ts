import { test, expect } from "@playwright/test";
import { acceptNextDialog } from "../utils/dialogs";

test("adds and deletes a producto", async ({ page }) => {
  const nombre = `E2E Producto ${Date.now()}`;
  await page.goto("/catalogo");

  const section = page.locator("section", { has: page.getByRole("heading", { name: "Productos" }) });
  await section.getByPlaceholder("Nombre del producto").fill(nombre);
  await section.getByPlaceholder("Costo S/").fill("9.99");
  const submit = section.getByRole("button", { name: "Agregar" });
  await expect(submit).toBeEnabled();
  await submit.click();

  const row = section.locator("li", { hasText: nombre });
  await expect(row).toHaveCount(1);
  await expect(row).toContainText("S/ 9.99");

  acceptNextDialog(page);
  await row.getByRole("button", { name: "Eliminar producto" }).click();
  await expect(section.getByText(nombre)).toHaveCount(0);
});

test("adds a colaborador, toggles capacitado, then deletes", async ({ page }) => {
  const nombre = `E2E Colaborador ${Date.now()}`;
  await page.goto("/catalogo");

  const section = page.locator("section", {
    has: page.getByRole("heading", { name: "Colaboradores" }),
  });
  await section.getByPlaceholder("Nombre").fill(nombre);
  const submit = section.getByRole("button", { name: "Agregar" });
  await expect(submit).toBeEnabled();
  await submit.click();

  const row = section.locator("li", { hasText: nombre });
  await expect(row).toHaveCount(1);
  await expect(row.getByText("Sin capacitar")).toBeVisible();

  await row.getByTitle("Alternar capacitación").click();
  // The toggle button's own text is the material-icon ligature ("verified")
  // concatenated with the label, so it never equals "Capacitado" exactly —
  // substring match like the "Sin capacitar" check above.
  await expect(row.getByText("Capacitado")).toBeVisible();

  acceptNextDialog(page);
  await row.getByRole("button", { name: "Eliminar colaborador" }).click();
  await expect(section.getByText(nombre)).toHaveCount(0);
});
