import fs from "fs";
import path from "path";
import { Page } from "playwright";
import { config } from "./config/app.config";

export type Step = {
  initialUrl: string;
  targetHref: string;
  title: string;
  firstP: string;
};

export function saveSteps(steps: Step[]) {
  const dir = path.dirname(config.stepsFile);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  fs.writeFileSync(config.stepsFile, JSON.stringify(steps, null, 2));
}

export function loadSteps(): Step[] {
  return JSON.parse(fs.readFileSync(config.stepsFile, "utf-8"));
}

export async function extractContent(page: Page) {
  await page.waitForLoadState("domcontentloaded");

  return page.evaluate(() => {
    const title = document.title || "";

    const paragraphs = Array.from(document.querySelectorAll("p"));
    let firstP = "";

    for (const p of paragraphs) {
      const text = p.textContent?.replace(/\s+/g, " ").trim() || "";
      if (text.length > 40) {
        firstP = text;
        break;
      }
    }

    if (!firstP) {
      firstP = document.body.innerText.replace(/\s+/g, " ").slice(0, 200);
    }

    return { title, firstP };
  });
}
