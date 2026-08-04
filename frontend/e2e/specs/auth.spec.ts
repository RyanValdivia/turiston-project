import { test, expect } from "@playwright/test";

test.describe("login", () => {
  test("logs in with valid demo credentials via the form", async ({ page }) => {
    await page.goto("/auth");
    await page.locator("#login-email").fill("demo@circularaqp.pe");
    await page.locator("#login-password").fill("demo1234");
    await page.getByRole("button", { name: "Iniciar sesión" }).click();
    await expect(page).toHaveURL("/dashboard");
  });

  test("shows an error on invalid credentials", async ({ page }) => {
    await page.goto("/auth");
    await page.locator("#login-email").fill("demo@circularaqp.pe");
    await page.locator("#login-password").fill("wrong-password");
    await page.getByRole("button", { name: "Iniciar sesión" }).click();
    await expect(page.locator("form p.text-red-600")).toBeVisible();
    await expect(page).toHaveURL("/auth");
  });
});

test("registers a brand-new restaurant account end to end", async ({ page }) => {
  const unique = Date.now();
  await page.goto("/auth");
  await page.getByRole("button", { name: "Regístrate aquí" }).click();
  await page.locator("#reg-restaurant").fill(`Restaurante Test ${unique}`);
  await page.locator("#reg-admin").fill("Admin Test");
  await page.locator("#reg-email").fill(`e2e-${unique}@example.com`);
  await page.locator("#reg-password").fill("test12345");
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  // register() then login() both fire in the mutation — lands authenticated on /dashboard.
  await expect(page).toHaveURL("/dashboard", { timeout: 15_000 });
});

test("recovers a password via the dev-mode prefilled reset token", async ({ page }) => {
  // Uses its own freshly-registered account rather than the demo user, so this
  // test doesn't change the demo account's password out from under the
  // storageState-producing setup project or any other spec file.
  const unique = Date.now();
  const email = `e2e-reset-${unique}@example.com`;
  await page.goto("/auth");
  await page.getByRole("button", { name: "Regístrate aquí" }).click();
  await page.locator("#reg-restaurant").fill(`Reset Test ${unique}`);
  await page.locator("#reg-admin").fill("Reset Admin");
  await page.locator("#reg-email").fill(email);
  await page.locator("#reg-password").fill("original123");
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page).toHaveURL("/dashboard", { timeout: 15_000 });

  // Fresh unauthenticated context for the reset flow.
  await page.context().clearCookies();
  await page.goto("/auth");
  await expect(page.getByRole("heading", { name: "Bienvenido de nuevo" })).toBeVisible();
  await page.getByRole("button", { name: "¿Olvidaste tu contraseña?" }).click();
  await expect(page.getByRole("heading", { name: "Recuperar contraseña" })).toBeVisible();
  // The panel-switch has a 300ms CSS transition (opacity/pointer-events); under
  // load the submit button can be hit-tested mid-transition and report the
  // outer (soon-to-be-noninteractive) container as intercepting the click.
  await page.waitForTimeout(400);
  await page.locator("#rec-email").fill(email);
  await page.getByRole("button", { name: "Enviar código" }).click();

  await expect(page.locator("#rec-token")).not.toHaveValue("", { timeout: 15_000 });
  await page.locator("#rec-new-password").fill("newpassword123");
  await page.getByRole("button", { name: "Guardar contraseña" }).click();

  // resetMutation.onSuccess -> switchForm("login")
  await page.locator("#login-email").fill(email);
  await page.locator("#login-password").fill("newpassword123");
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL("/dashboard");
});
