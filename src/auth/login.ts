// src/auth/login.ts
import { chromium, Page } from "playwright";
import { ENV } from "../config/env";
import { LOGIN_SELECTORS } from "../config/selector";
import { startRecorder } from "../record/recorder";

export async function login(): Promise<Page> {
  const isCI = !!process.env.CI;

  console.log(`🚀 Launching browser (${isCI ? "CI / headless" : "local / headed"})`);

  const browser = await chromium.launch({
    headless: isCI ? true : ENV.headless,
    args: isCI
      ? [
          "--no-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
        ]
      : [],
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });

  const page = await context.newPage();

  console.log("🌐 Navigating to login page...");
  await page.goto(ENV.baseUrl, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });

  console.log("✍️ Filling credentials...");
  await page.fill(LOGIN_SELECTORS.usernameInput, ENV.username);
  await page.fill(LOGIN_SELECTORS.passwordInput, ENV.password);

  console.log("🔐 Submitting login form...");
  await Promise.all([
    page.click(LOGIN_SELECTORS.submitButton),
    page.waitForLoadState("networkidle"),
  ]);

  console.log("🔎 Verifying login success...");
  await page.waitForSelector(ENV.loginSuccessSelector, {
    timeout: 15_000,
  });

  console.log("✅ Login successful");
  return page;
}

// Optional: standalone recorder run (local only)
if (require.main === module) {
  (async () => {
    const page = await login();
    await startRecorder(page);
  })();
}
