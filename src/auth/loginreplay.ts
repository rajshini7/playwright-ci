// src/auth/loginreplay.ts
import { chromium, Page } from "playwright";
import { LOGIN_SELECTORS } from "../config/selector";

/**
 * Replay login
 * - CI ONLY
 * - Uses GitHub Secrets
 * - NEVER loads .env
 */
export async function loginForReplay(): Promise<Page> {
  const BASE_URL = process.env.BASE_URL;
  const USERNAME = process.env.USERNAME;
  const PASSWORD = process.env.PASSWORD;

  if (!BASE_URL || !USERNAME || !PASSWORD) {
    throw new Error(
      "Missing CI secrets. Required: BASE_URL, USERNAME, PASSWORD"
    );
  }

  console.log("🔑 Starting headless login for replay (CI)");

  const browser = await chromium.launch({
    headless: true, // CI always headless
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });

  await page.fill(LOGIN_SELECTORS.usernameInput, USERNAME);
  await page.fill(LOGIN_SELECTORS.passwordInput, PASSWORD);

  await Promise.all([
    page.click(LOGIN_SELECTORS.submitButton),
    page.waitForLoadState("networkidle"),
  ]);

  return page;
}
