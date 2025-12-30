// src/record/recorder.ts

import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import fs from "fs";
import { Page, Browser } from "playwright";
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
  fs.writeFileSync(OUT_FILE, JSON.stringify(steps, null, 2));
  console.log(`💾 Saved ${steps.length} steps`);
}

/* ================= CONTENT ================= */

async function extractContent(page: Page): Promise<ContentSnapshot> {
  await page.waitForLoadState("domcontentloaded");
  return page.evaluate(() => {
    const title = document.title || "";
    const h1 = document.querySelector("h1")?.textContent?.trim() || "";
    const metaDescription =
      (document.querySelector('meta[name="description"]') as HTMLMetaElement)
        ?.content || "";

    let firstP = "";
    for (const p of Array.from(document.querySelectorAll("p"))) {
      const txt = p.textContent?.replace(/\s+/g, " ").trim() || "";
      if (txt.length > 40) {
        firstP = txt;
        break;
      }
    }

    return { title, h1, firstP, metaDescription };
  });
}

/* ================= RECORDER ================= */

export async function startRecorder(page?: Page) {
  const activePage = page ?? (await loginForRecord());
  if (!activePage) throw new Error("No page for recorder");

  const browser: Browser = activePage.context().browser()!;
  const steps: Step[] = [];
  let finished = false;

  /* ======== SHUTDOWN CONTROLLER ======== */

  let shutdownResolve!: () => void;
  const shutdownPromise = new Promise<void>((resolve) => {
    shutdownResolve = resolve;
  });

  async function finalize(reason: string) {
    if (finished) return;
    finished = true;

    console.log(`\n🛑 Recording finished (${reason})`);
    saveSteps(steps);

    shutdownResolve();
  }

  /* ======== 🔥 FIX: PAGE CLOSE HANDLER (ONLY CHANGE) ======== */

  activePage.on("close", () => {
    finalize("browser window closed (page closed)");
  });

  /* ======== Existing browser listener (unchanged) ======== */

  browser.once("disconnected", () => {
    finalize("browser disconnected");
  });

  /* ======== Optional CTRL+C ======== */

  process.on("SIGINT", () => finalize("SIGINT"));

  /* ======== Binding ======== */

  await activePage.exposeBinding(
    "recordClick",
    async (_src, payload: { href: string; selector: string }) => {
      const fromUrl = activePage.url();
      const targetUrl = new URL(payload.href, fromUrl).href;

      await activePage.goto(targetUrl, { waitUntil: "domcontentloaded" });

      const content = await extractContent(activePage);

      steps.push({
        selector: payload.selector,
        url: fromUrl,
        target_href: activePage.url(),
        content,
        timestamp: Date.now(),
      });

      saveSteps(steps);
    }
  );

  /* ======== Click listener injection (unchanged) ======== */

  async function inject() {
    await activePage.evaluate(() => {
      if ((window as any).__recorderInstalled) return;
      (window as any).__recorderInstalled = true;

      document.addEventListener(
        "click",
        (e) => {
          const el = (e.target as HTMLElement | null)?.closest("a");
          if (!el) return;

          const href = (el as HTMLAnchorElement).href;
          if (!href) return;

          let selector = el.id
            ? `a#${el.id}`
            : `a[href="${el.getAttribute("href")}"]`;

          (window as any).recordClick({ href, selector });
        },
        true
      );
    });
  }

  await inject();
  activePage.on("framenavigated", async (frame) => {
    if (frame === activePage.mainFrame()) await inject();
  });

  /* ======== Initial snapshot ======== */

  const startUrl = activePage.url();
  const initialContent = await extractContent(activePage);

  steps.push({
    selector: null,
    url: startUrl,
    target_href: startUrl,
    content: initialContent,
    timestamp: Date.now(),
    isInitial: true,
  });

  saveSteps(steps);

  console.log("🎥 Recorder active — close browser to stop recording");

  /* ======== WAIT FOR CLOSE ======== */

  await shutdownPromise;
  process.exit(0);
}

/* ================= STANDALONE ================= */

if (require.main === module) {
  startRecorder().catch((err) => {
    console.error("❌ Recorder crashed:", err);
    process.exit(1);
  });
}
