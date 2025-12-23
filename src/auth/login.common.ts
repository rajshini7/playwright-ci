import { Page } from "playwright";
import { getEnv } from "../config/env";
import { LOGIN_SELECTORS } from "../config/selector";

export function assertEnv() {
  const ENV = getEnv();
  const missing: string[] = [];

  if (!ENV.baseUrl) missing.push("BASE_URL");
  if (!ENV.username) missing.push("USERNAME");
  if (!ENV.password) missing.push("PASSWORD");

  if (missing.length) {
    throw new Error(`Missing env vars: ${missing.join(", ")}`);
  }
}

export async function performLogin(page: Page) {
  const ENV = getEnv();

  console.log("🌐 Navigating to login page...");
  await page.goto(ENV.baseUrl, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });

  console.log("✍️ Filling credentials...");
  await page.fill(LOGIN_SELECTORS.usernameInput, ENV.username);
  await page.fill(LOGIN_SELECTORS.passwordInput, ENV.password);

  console.log("🔐 Submitting login...");
  await Promise.all([
    page.click(LOGIN_SELECTORS.submitButton),
    page.waitForLoadState("networkidle"),
  ]);
}
