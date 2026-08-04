import { test as setup, expect } from "@playwright/test";
import path from "node:path";

const __dirname = import.meta.dirname;
const STORAGE_STATE = path.join(__dirname, "..", "..", ".auth/demo-user.json");

setup("authenticate as demo user", async ({ page }) => {
  await page.goto("/auth");
  await page.getByRole("button", { name: "Entrar como demo" }).click();
  await expect(page).toHaveURL("/dashboard");
  await page.context().storageState({ path: STORAGE_STATE });
});
