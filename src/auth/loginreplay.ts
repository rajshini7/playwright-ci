import { chromium, Page } from "playwright";
import { assertEnv, performLogin } from "./login.common";

export async function loginForReplay(): Promise<Page> {
  assertEnv();

  console.log("🚀 Launching headless browser for REPLAY");

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });

  const page = await context.newPage();

  await performLogin(page);

  return page; // handed over to replay
}
