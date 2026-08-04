import { test, expect } from "@playwright/test";
import { freshFechaTurno } from "../utils/dates";
import { acceptNextDialog } from "../utils/dialogs";

test("creates a daily operation with a venta and a desperdicio row, then finds and deletes it in history", async ({
  page,
}) => {
  const { fecha, turno } = freshFechaTurno();
  const marker = `E2E-${Date.now()}`;

  await page.goto("/register");
  await page.locator("#entry-date").fill(fecha);
  await page.locator("#entry-turno").selectOption(turno);

  // Placeholders "0"/"0.00"/"0.0" are substrings of each other under Playwright's
  // default fuzzy matching, so each needs exact:true to hit the right field.
  await page.getByPlaceholder("Ej. Lomo Saltado").fill(`Plato ${marker}`);
  await page.getByPlaceholder("0", { exact: true }).fill("5");
  await page.getByPlaceholder("0.00", { exact: true }).fill("50");

  await page.getByPlaceholder("Ej. Arroz, recortes de verdura").fill(`Verduras ${marker}`);
  await page.getByPlaceholder("0.0", { exact: true }).fill("1.5");

  await page.locator("#obs").fill(marker);

  const submit = page.getByRole("button", { name: /Guardar registro/ });
  await expect(submit).toBeEnabled();
  await submit.click();

  await expect(page).toHaveURL("/history");

  // Isolate the just-created record via the unique observaciones marker (searchable server-side).
  // RecordCard root has Tailwind's "group" class; scope to the one card containing our marker
  // (plato/producto names aren't rendered on the card, only turno/observaciones/totals are).
  await page.getByPlaceholder("Buscar registros...").fill(marker);
  const card = page.locator("div.group", { has: page.getByText(marker, { exact: false }) });
  await expect(card).toHaveCount(1);
  await expect(card.getByText("Turno Noche", { exact: false })).toBeVisible();

  acceptNextDialog(page);
  await card.getByTitle("Eliminar registro").click();
  await expect(page.getByText("Ningún registro coincide con estos filtros.")).toBeVisible();
});

test("search filter shows an empty state for a non-matching term", async ({ page }) => {
  await page.goto("/history");
  await page.getByPlaceholder("Buscar registros...").fill("no-existing-search-term-xyz-123");
  await expect(page.getByText("Ningún registro coincide con estos filtros.")).toBeVisible();
});
