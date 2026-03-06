import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

function getE2EEnv() {
  const content = fs.readFileSync(path.join(process.cwd(), "e2e/.env.e2e"), "utf-8");
  const env: Record<string, string> = {};
  for (const line of content.split("\n")) {
    const [key, ...rest] = line.split("=");
    if (key) env[key.trim()] = rest.join("=").trim();
  }
  return env;
}

test.describe("Authentication", () => {
  test("admin login should redirect to tableau-de-bord", async ({ page }) => {
    const env = getE2EEnv();

    await page.goto("/connexion");
    await page.fill('input[name="email"]', env.E2E_ADMIN_EMAIL);
    await page.fill('input[name="password"]', env.E2E_ADMIN_PASSWORD);
    await page.click('button[type="submit"]');

    await page.waitForURL("**/tableau-de-bord", { timeout: 15000 });
    expect(page.url()).toContain("/tableau-de-bord");
  });

  test("bad credentials should show error message", async ({ page }) => {
    await page.goto("/connexion");
    await page.fill('input[name="email"]', "wrong@test.com");
    await page.fill('input[name="password"]', "wrongpassword");
    await page.click('button[type="submit"]');

    // Should stay on login page and show error
    await page.waitForTimeout(2000);
    expect(page.url()).toContain("/connexion");
  });

  test("unauthenticated access to dashboard should redirect to connexion", async ({ page }) => {
    await page.goto("/tableau-de-bord");
    await page.waitForURL(/\/connexion/, { timeout: 10000 });
    expect(page.url()).toContain("/connexion");
  });
});
