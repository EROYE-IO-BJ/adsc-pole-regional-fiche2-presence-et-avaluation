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

async function loginAsAdmin(page: import("@playwright/test").Page) {
  const env = getE2EEnv();
  await page.goto("/connexion");
  await page.fill('input[name="email"]', env.E2E_ADMIN_EMAIL);
  await page.fill('input[name="password"]', env.E2E_ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/tableau-de-bord/, { timeout: 15000 });
}

test.describe("Activity Lifecycle", () => {
  test("admin can access activity creation page", async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto("/activites/nouvelle");
    await page.waitForLoadState("networkidle");

    // Verify the form is displayed
    await expect(page.locator('input[name="title"]')).toBeVisible();
    await expect(page.locator('input[name="date"]')).toBeVisible();
    await expect(page.getByRole("heading", { name: "Nouvelle activité" })).toBeVisible();
  });

  test("FORMATION activity detail shows sessions", async ({ page }) => {
    await loginAsAdmin(page);
    const env = getE2EEnv();

    await page.goto(`/activites/${env.E2E_FORMATION_ID}`);
    await page.waitForLoadState("networkidle");

    // Should see Séances tab or section
    const content = await page.textContent("body");
    expect(content).toContain("Séance");
  });
});
