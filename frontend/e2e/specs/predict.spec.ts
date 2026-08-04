import { test, expect } from "@playwright/test";

test.describe("predictive model correctness", () => {
  test.setTimeout(120_000);

  test("demo restaurant: POST /predicciones returns a correctly-shaped, sane result", async ({
    page,
  }) => {
    const me = await page.request.get("/api/auth/me");
    expect(me.ok()).toBeTruthy();
    const { restaurante } = await me.json();

    const res = await page.request.post(`/api/restaurantes/${restaurante.id}/predicciones`, {
      data: { fecha: "2026-08-10" },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();

    expect(body.estado).toBe("COMPLETADA");
    expect(Array.isArray(body.resultado.predicciones)).toBe(true);
    // Seed backfill uses 10 platos (see prisma/seed.ts platosMenu).
    expect(body.resultado.predicciones.length).toBeGreaterThanOrEqual(8);
    for (const p of body.resultado.predicciones) {
      expect(typeof p.plato).toBe("string");
      expect(p.plato.length).toBeGreaterThan(0);
      expect(typeof p.prediccion).toBe("number");
      expect(Number.isFinite(p.prediccion)).toBe(true);
      expect(p.prediccion).toBeGreaterThanOrEqual(0);
    }

    const { metrics, entrenadoEn } = body.resultado;
    expect(Number.isFinite(metrics.precisionPct)).toBe(true);
    expect(metrics.precisionPct).toBeGreaterThanOrEqual(0);
    expect(metrics.precisionPct).toBeLessThanOrEqual(100);
    expect(Number.isFinite(metrics.mae)).toBe(true);
    expect(Number.isFinite(metrics.r2)).toBe(true);
    expect(Number.isNaN(new Date(entrenadoEn).getTime())).toBe(false);
  });

  test("demo restaurant: UI renders the forecast, confidence panel, and production goals", async ({
    page,
  }) => {
    await page.goto("/predict");
    await page.getByRole("button", { name: /Predecir/ }).click();

    await expect(page.getByText("Recomendación de Cortex")).toBeVisible({ timeout: 100_000 });
    await expect(page.getByText("Confianza del modelo")).toBeVisible();
    await expect(page.getByText("% precisión")).toBeVisible();
    await expect(page.getByText("MAE (error prom.)")).toBeVisible();
    await expect(page.getByText("R²")).toBeVisible();
    await expect(page.getByText("Entrenado", { exact: true })).toBeVisible();
    await expect(page.getByText("Metas de producción")).toBeVisible();
    await expect(page.getByText(/unidades sugeridas/).first()).toBeVisible();
  });

  test("fresh restaurant with no sales history gets a genuine 422 insufficient-data response", async ({
    page,
  }) => {
    const unique = Date.now();
    const email = `e2e-predict-${unique}@example.com`;
    const reg = await page.request.post("/api/auth/register", {
      data: {
        nombreRestaurante: `Predict Sin Datos ${unique}`,
        nombreUsuario: "Predict Admin",
        email,
        password: "test12345",
      },
    });
    expect(reg.ok()).toBeTruthy();
    const { restaurante } = await reg.json();

    const login = await page.request.post("/api/auth/login", {
      data: { email, password: "test12345" },
    });
    expect(login.ok()).toBeTruthy();

    const res = await page.request.post(`/api/restaurantes/${restaurante.id}/predicciones`, {
      data: { fecha: "2026-08-10" },
    });
    expect(res.status()).toBe(422);
    const body = await res.json();
    expect(typeof body.details?.filasDisponibles).toBe("number");
  });
});
