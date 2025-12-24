// src/auth/loginreplay.ts
import { chromium, Page } from "playwright";
import { LOGIN_SELECTORS } from "../config/selector";

export async function loginForReplay(): Promise<Page> {
  const BASE_URL = process.env.BASE_URL;
  const USERNAME = process.env.USERNAME;
  const PASSWORD = process.env.PASSWORD;

  if (!BASE_URL || !USERNAME || !PASSWORD) {
    throw new Error("Missing env vars: BASE_URL, USERNAME, PASSWORD");
  }

  console.log("🔑 Starting headless login for replay (CI)");

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"], // 🔒 CI SAFE
  });

  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
  });

  // 🔒 IMPORTANT: increase navigation timeout
  context.setDefaultNavigationTimeout(60_000);

  const page = await context.newPage();

  // 🔧 FIX #1: wait for full load (not domcontentloaded)
  await page.goto(BASE_URL, {
    waitUntil: "load",
    timeout: 60_000,
  });

  await page.fill(LOGIN_SELECTORS.usernameInput, USERNAME);
  await page.fill(LOGIN_SELECTORS.passwordInput, PASSWORD);

  await Promise.all([
    page.click(LOGIN_SELECTORS.submitButton),
    page.waitForNavigation({
      waitUntil: "load",
      timeout: 60_000,
    }),
  ]);

  return page; // 🔒 unchanged contract
}
