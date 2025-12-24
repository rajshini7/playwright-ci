import { Page } from "@playwright/test";
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

  // 🔑 CRITICAL: wait for full paint
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500); // allow fonts/images to render

  const filePath = path.join(dir, `step-${stepNumber}-failure.png`);

  await page.screenshot({
    path: filePath,
    fullPage: true,
  });

  return filePath;
}
