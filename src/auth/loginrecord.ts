import { chromium, Page } from "playwright";
import { assertEnv, performLogin } from "./login.common";

export async function loginForRecord(): Promise<Page> {
  if (process.env.CI) {
    throw new Error("Recorder login must never run in CI");
  }

  assertEnv();

  console.log("🚀 Launching headed browser for RECORDING");

  const browser = await chromium.launch({
    headless: false,
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  await performLogin(page);

  return page; // handed over to recorder
}
