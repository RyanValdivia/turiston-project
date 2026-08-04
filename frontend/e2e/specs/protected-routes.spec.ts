import { test, expect } from "@playwright/test";

const PROTECTED_ROUTES = [
  "/dashboard",
  "/register",
  "/history",
  "/entregas",
  "/analytics",
  "/catalogo",
  "/reports",
  "/predict",
  "/profile",
];

for (const route of PROTECTED_ROUTES) {
  test(`redirects unauthenticated visitors from ${route} to /auth`, async ({ page }) => {
    await page.goto(route);
    await expect(page).toHaveURL("/auth");
  });
}
