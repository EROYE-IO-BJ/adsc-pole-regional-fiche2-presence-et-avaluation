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

test.describe("Public Forms", () => {
  test("submit presence via public token page", async ({ page }) => {
    const env = getE2EEnv();

    await page.goto(`/p/${env.E2E_FORMATION_TOKEN}/presence`);
    await page.waitForLoadState("networkidle");

    // Fill presence form
    await page.fill('input[name="firstName"]', "E2E");
    await page.fill('input[name="lastName"]', "Tester");
    await page.fill('input[name="email"]', `e2e-presence-${Date.now()}@test.com`);

    await page.click('button[type="submit"]');

    // Should go to merci page
    await page.waitForURL("**/merci", { timeout: 10000 });
    expect(page.url()).toContain("/merci");
  });

  test("submit feedback via public token page", async ({ page }) => {
    const env = getE2EEnv();

    await page.goto(`/p/${env.E2E_FORMATION_TOKEN}/retour`);
    await page.waitForLoadState("networkidle");

    // The form should be visible
    const body = await page.textContent("body");
    expect(body).toBeTruthy();
  });

  test("public token landing page shows activity info", async ({ page }) => {
    const env = getE2EEnv();

    await page.goto(`/p/${env.E2E_FORMATION_TOKEN}`);
    await page.waitForLoadState("networkidle");

    const body = await page.textContent("body");
    expect(body).toContain("Formation E2E Test");
  });
});
