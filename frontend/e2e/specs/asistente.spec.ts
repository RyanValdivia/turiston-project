import { test, expect } from "@playwright/test";
import { uniqueFechaTurno } from "../utils/dates";

/**
 * Scripted conversations against the deterministic guided engine
 * (src/lib/ai/dialogo.ts). No GEMINI_API_KEY/GROQ_API_KEY are set in this
 * environment, so hayProveedorLLM() is false and every /asistente call falls
 * through to responderDeterminista() — fully reproducible, no LLM variability.
 */

async function sendChatMessage(page: import("@playwright/test").Page, text: string) {
  const input = page.getByPlaceholder("Escribe tu respuesta…");
  await input.fill(text);
  await page.getByRole("button", { name: "Enviar" }).click();
}

test("chatbot: 'producto' flow completes a full conversation and creates the producto", async ({
  page,
}) => {
  const nombre = `E2E Bot Producto ${Date.now()}`;

  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Abrir asistente" }).click();
  await page.getByRole("button", { name: "Producto del catálogo" }).click();

  await expect(page.getByText(/nombre/i).last()).toBeVisible();
  await sendChatMessage(page, nombre);

  await expect(page.getByText(/costo/i).last()).toBeVisible();
  await sendChatMessage(page, "12.50");

  // ResumenConfirmacion renders its summary as <li> items — scope assertions
  // there to avoid matching the same text in the user's own chat bubble above
  // (the assistant's own message also says "...confirma para guardar. ✅").
  await expect(page.getByText("Confirma para guardar", { exact: true })).toBeVisible();
  const resumen = page.getByRole("listitem");
  await expect(resumen.filter({ hasText: nombre })).toBeVisible();
  await expect(resumen.filter({ hasText: "S/ 12.50" })).toBeVisible();

  await page.getByRole("button", { name: "Confirmar y guardar" }).click();

  await expect(page).toHaveURL("/catalogo");
  await expect(page.getByText(nombre)).toBeVisible();
});

test("chatbot: 'operacion' flow completes a full conversation and creates the daily operation", async ({
  page,
}) => {
  const marker = `Plato Bot ${Date.now()}`;
  // Derived from Date.now(), not a fixed literal — createOperacion enforces a
  // unique [restauranteId,fecha,turno]; a hardcoded date would 409 (and thus
  // silently fail to save/navigate) on any re-run against the same dev.db.
  const { fecha } = uniqueFechaTurno("TARDE");

  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Abrir asistente" }).click();
  await page.getByRole("button", { name: "Registrar el día" }).click();

  // Combined fecha+turno step: dialogoOperacion parses both from one message.
  await expect(page.getByText(/fecha/i).last()).toBeVisible();
  await sendChatMessage(page, `${fecha} tarde`);

  await expect(page.getByText(/ventas por plato/i)).toBeVisible();
  await sendChatMessage(page, `${marker}, 3, 45`);

  // camposFaltantes() for the "operacion" flow only requires fecha+turno and
  // AT LEAST ONE record (venta/producción/desperdicio) — so as soon as this one
  // venta is added, listoParaGuardar flips true and the widget swaps straight to
  // the confirmation panel (skipping the "listo"/desperdicios prompts, which
  // only matter if the user keeps chatting instead of confirming early).
  await expect(page.getByText("Confirma para guardar", { exact: true })).toBeVisible();
  const resumen = page.getByRole("listitem");
  await expect(resumen.filter({ hasText: fecha })).toBeVisible();
  await expect(resumen.filter({ hasText: "Tarde" })).toBeVisible();
  await expect(resumen.filter({ hasText: marker })).toBeVisible();

  await page.getByRole("button", { name: "Confirmar y guardar" }).click();

  await expect(page).toHaveURL("/history");

  // The plato name isn't rendered on RecordCard, but the server-side search
  // filters on ventas.concepto too — use it to isolate our record, then
  // assert the turno it created.
  await page.getByPlaceholder("Buscar registros...").fill(marker);
  const card = page.locator("div.group", { has: page.getByText("Turno Tarde", { exact: false }) });
  await expect(card).toHaveCount(1);
});
