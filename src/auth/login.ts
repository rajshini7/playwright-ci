// src/auth/login.ts
import { chromium, Page } from "playwright";
import { ENV } from "../config/env";
import { LOGIN_SELECTORS } from "../config/selector";
import { startRecorder } from "../record/recorder";

export async function login(): Promise<Page> {
  const browser = await chromium.launch({ headless: ENV.headless });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log("🌐 Navigating to login page...");
  await page.goto(ENV.baseUrl, { waitUntil: "domcontentloaded" });

  console.log("✍️ Filling credentials...");
  await page.fill(LOGIN_SELECTORS.usernameInput, ENV.username);
  await page.fill(LOGIN_SELECTORS.passwordInput, ENV.password);

  console.log("🔐 Submitting login form...");
  await Promise.all([
    page.click(LOGIN_SELECTORS.submitButton),
    page.waitForLoadState("networkidle"),
  ]);

  console.log("🔎 Verifying login success...");
  await page.waitForSelector(ENV.loginSuccessSelector, { timeout: 5000 });

  console.log("✅ Login successful");
  return page;
}

// Optional: standalone recorder run
if (require.main === module) {
  (async () => {
    const page = await login();
    await startRecorder(page);
  })();
}
