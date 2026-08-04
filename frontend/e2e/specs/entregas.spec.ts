import { test, expect } from "@playwright/test";
import { acceptNextDialog } from "../utils/dialogs";

test("registers a new entrega and deletes it", async ({ page }) => {
  const receptor = `E2E Reciclador ${Date.now()}`;

  await page.goto("/entregas");
  await page.locator("#e-cat").selectOption("CARTON");
  await page.locator("#e-peso").fill("3.2");
  await page.locator("#e-receptor").fill(receptor);

  const submit = page.getByRole("button", { name: /Registrar entrega/ });
  await expect(submit).toBeEnabled();
  await submit.click();

  const card = page.locator("div.flex.items-start.justify-between.gap-md", { hasText: receptor });
  await expect(card).toHaveCount(1);
  await expect(card).toContainText("Cartón");

  acceptNextDialog(page);
  await card.getByRole("button", { name: "Eliminar entrega" }).click();
  await expect(page.getByText(receptor)).toHaveCount(0);
});
