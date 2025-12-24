// src/record/recorder.ts

// dotenv FIRST, local only
if (!process.env.CI) {
  require("dotenv").config();
}

import fs from "fs";
import path from "path";
import { Page } from "playwright";
import { loginForRecord } from "../auth/loginrecord";

/* ================= TYPES ================= */

type ContentSnapshot = {
  title: string;
  h1: string;
  firstP: string;
  metaDescription: string;
};

type Step = {
  selector: string | null;
  url: string;
  target_href: string;
  content: ContentSnapshot;
  timestamp: number;
  isInitial?: boolean;
};

/* ================= PATHS ================= */

const OUT_DIR = path.join(process.cwd(), "baseline");
const OUT_FILE = path.join(OUT_DIR, "steps.json");

function ensureOutDir() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
}

function saveSteps(steps: Step[]) {
  ensureOutDir();
  fs.writeFileSync(OUT_FILE, JSON.stringify(steps, null, 2), "utf-8");
  console.log(`✅ Steps saved → ${OUT_FILE}`);
}

/* ================= CONTENT EXTRACTION ================= */

export async function extractContent(page: Page): Promise<ContentSnapshot> {
  await page.waitForLoadState("domcontentloaded");

  return page.evaluate(() => {
    const title = document.title || "";
    const h1 = document.querySelector("h1")?.textContent?.trim() || "";

    function extractFirstP(): string {
      const candidates = Array.from(document.querySelectorAll("p"));
      for (const p of candidates) {
        const txt = (p.textContent || "").replace(/\s+/g, " ").trim();
        if (txt.length > 40) return txt;
      }
      return document.body.innerText.replace(/\s+/g, " ").trim().slice(0, 200);
    }

    const metaDescription =
      (document.querySelector('meta[name="description"]') as HTMLMetaElement)
        ?.content || "";

    return { title, h1, firstP: extractFirstP(), metaDescription };
  });
}

/* ================= RECORDER ================= */

export async function startRecorder() {
  if (process.env.CI) {
    throw new Error("❌ Recorder must never run in CI");
  }

  console.log("🎥 Starting recorder");

  // 🔑 LOGIN FIRST
  const page = await loginForRecord();

  const steps: Step[] = [];
  let shuttingDown = false;

  async function gracefulExit() {
    if (shuttingDown) return;
    shuttingDown = true;

    console.log("\n🛑 Browser closed. Saving steps...");
    saveSteps(steps);

    await page.context().browser()?.close();
    process.exit(0);
  }

  page.on("close", gracefulExit);
  page.context().browser()?.on("disconnected", gracefulExit);
  process.on("SIGINT", gracefulExit);
  process.on("SIGTERM", gracefulExit);

  /* ===== Click Recording ===== */

  await page.exposeBinding(
    "recordClick",
    async (_src: unknown, payload: { href: string; selector: string }) => {
      const fromUrl = page.url();
      const target = new URL(payload.href, fromUrl).href;

      if (!payload.selector || payload.selector === "a") return;

      console.log("\n▶ CLICK");
      console.log(" From:", fromUrl);
      console.log(" To:", target);

      await page.goto(target, { waitUntil: "domcontentloaded" });
      const content = await extractContent(page);

      steps.push({
        selector: payload.selector,
        url: fromUrl,
        target_href: page.url(),
        content,
        timestamp: Date.now(),
      });

      saveSteps(steps);
    }
  );

  /* ===== Inject Listener ===== */

  await page.addInitScript(() => {
    if ((window as any).__recorderInstalled) return;
    (window as any).__recorderInstalled = true;

    document.addEventListener(
      "click",
      (e) => {
        const a = (e.target as HTMLElement)?.closest("a") as HTMLAnchorElement;
        if (!a || !a.href) return;

        const selector = a.id
          ? `a#${a.id}`
          : `a[href="${a.getAttribute("href")}"]`;

        e.preventDefault();
        (window as any).recordClick({ href: a.href, selector });
      },
      true
    );
  });

  /* ===== Initial Snapshot ===== */

  const startUrl = page.url();
  const initialContent = await extractContent(page);

  steps.push({
    selector: null,
    url: startUrl,
    target_href: startUrl,
    content: initialContent,
    timestamp: Date.now(),
    isInitial: true,
  });

  saveSteps(steps);

  console.log("🎥 Recorder started");
  console.log("📌 Initial page recorded:", startUrl);
  console.log("⚠️ Close browser to stop recording");
}

/* ================= CLI ================= */

if (require.main === module) {
  startRecorder().catch(err => {
    console.error("❌ Recorder failed:", err);
    process.exit(1);
  });
}
