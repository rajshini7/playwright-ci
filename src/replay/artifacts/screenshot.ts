// src/replay/artifacts/screenshot.ts
import { Page } from "playwright";   // ✅ FIXED
import path from "path";
import fs from "fs";

export async function captureFailureScreenshot(
  page: Page,
  stepNumber: number
): Promise<string> {
  const dir = path.join(process.cwd(), "replay-artifacts");

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // ✅ Stable and safe
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(500);

  const filePath = path.join(dir, `step-${stepNumber}-failure.png`);

  await page.screenshot({
    path: filePath,
    fullPage: true,
  });

  return filePath;
}
