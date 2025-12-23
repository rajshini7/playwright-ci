import { Page } from "playwright";
import fs from "fs";
import path from "path";

const SCREENSHOT_DIR = path.join(process.cwd(), "replay-artifacts");

export async function captureFailureScreenshot(
  page: Page,
  stepIndex: number
): Promise<string> {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  const filePath = path.join(
    SCREENSHOT_DIR,
    `failure-step-${stepIndex}.png`
  );

  await page.screenshot({
    path: filePath,
    fullPage: true,
  });

  return filePath;
}
