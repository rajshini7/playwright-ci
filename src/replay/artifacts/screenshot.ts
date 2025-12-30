// src/replay/artifacts/screenshot.ts
import { Page } from "playwright";
import path from "path";
import fs from "fs";

export async function captureFailureScreenshot(
  page: Page,
  stepNumber: number
): Promise<string> {

  // 🔥 SAVE INSIDE ZIP ARTIFACTS FOLDER (SAME AS REPORT)
  const artifactsDir = path.join(process.cwd(), "artifacts", "replay-artifacts");

  if (!fs.existsSync(artifactsDir)) {
    fs.mkdirSync(artifactsDir, { recursive: true });
  }

  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(500);

  const filePath = path.join(
    artifactsDir,
    `step-${stepNumber}-failure.png`
  );

  await page.screenshot({
    path: filePath,
    fullPage: true,
  });

  return filePath;
}
