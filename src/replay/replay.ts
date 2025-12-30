// src/replay/replay.ts
import { Page } from "playwright";
import fs from "fs";
import path from "path";

import { loginForReplay } from "../auth/loginreplay";
import { captureFailureScreenshot } from "./artifacts/screenshot";

/* ================= TYPES ================= */

type ContentSnapshot = {
  title?: string;
  h1?: string;
  firstP?: string;
  metaDescription?: string;
  bodySnippet?: string;
};

type Step = {
  selector: string | null;
  url: string;
  target_href: string;
  content: ContentSnapshot;
  timestamp: number;
};

type StepResult = Step & {
  liveContent: ContentSnapshot;
  pass: boolean;
  screenshotPath?: string;
};

/* ================= PATHS ================= */

// baseline stays unchanged
const BASELINE_DIR = path.join(process.cwd(), "baseline");
const STEPS_FILE = path.join(BASELINE_DIR, "steps.json");

// ✅ FIX: force ALL replay output under src/replay/artifacts
const ARTIFACTS_DIR = path.join(
  process.cwd(),
  "src",
  "replay",
  "artifacts"
);

const REPORT_FILE = path.join(
  ARTIFACTS_DIR,
  "replay-report.html"
);

/* ================= HELPERS ================= */

function loadSteps(): Step[] {
  if (!fs.existsSync(STEPS_FILE)) {
    throw new Error(`${STEPS_FILE} not found. Run recorder first.`);
  }
  return JSON.parse(fs.readFileSync(STEPS_FILE, "utf-8")) as Step[];
}

function normalize(text?: string) {
  return (text || "").replace(/\s+/g, " ").trim();
}

/* ================= CONTENT EXTRACTION ================= */

async function extractContent(page: Page): Promise<ContentSnapshot> {
  await page.waitForLoadState("domcontentloaded");

  return page.evaluate(() => {
    const title = document.title || "";
    const h1 = document.querySelector("h1")?.textContent?.trim() || "";

    function extractFirstP(): string {
      const root = document.querySelector("#mw-content-text");
      const candidates: HTMLParagraphElement[] = [];
      if (root) candidates.push(...Array.from(root.querySelectorAll("p")));
      candidates.push(...Array.from(document.querySelectorAll("p")));

      for (const p of candidates) {
        const txt = (p.textContent || "").replace(/\s+/g, " ").trim();
        if (txt.length > 40) return txt;
      }

      return document.body.innerText
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 200);
    }

    const metaDescription =
      (document.querySelector(
        'meta[name="description"]'
      ) as HTMLMetaElement | null)?.content || "";

    return {
      title,
      h1,
      firstP: extractFirstP(),
      metaDescription,
    };
  });
}

/* ================= ENTRY ================= */

export async function runReplay(): Promise<void> {
  const steps = loadSteps();

  if (!steps.length) {
    console.log("⚠️ No recorded steps found. Skipping replay.");
    return;
  }

  const results: StepResult[] = [];
  let page: Page;

  try {
    console.log("🔑 Starting headless login for replay...");
    page = await loginForReplay();
    console.log("✅ Login successful. Starting replay...");

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];

      console.log(`\n▶ Step ${i + 1}: ${step.target_href}`);

      await page.goto(step.target_href, {
        waitUntil: "domcontentloaded",
        timeout: 60_000,
      });

      await page.waitForTimeout(1000);

      const live = await extractContent(page);

      const recordedFP = normalize(step.content.firstP);
      const liveFP = normalize(live.firstP);
      const pass = recordedFP === liveFP;

      let screenshotPath: string | undefined;

      if (!pass) {
        screenshotPath = await captureFailureScreenshot(page, i + 1);
      }

      results.push({
        ...step,
        liveContent: live,
        pass,
        screenshotPath,
      });

      await page.waitForTimeout(500);
    }
  } catch (err) {
    console.error("❌ Replay crashed:", err);
    throw err;
  }

  /* ================= REPORT ================= */

  // ✅ ensure src/replay/artifacts exists
  if (!fs.existsSync(ARTIFACTS_DIR)) {
    fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
  }

  const reportHtml = `
<html>
<head>
  <title>Replay Report</title>
  <style>
    body { font-family: sans-serif; padding: 20px; }
    .step { border: 1px solid #ccc; margin-bottom: 20px; padding: 10px; }
    .pass { color: green; font-weight: bold; }
    .fail { color: red; font-weight: bold; }
    pre { white-space: pre-wrap; }
    img { margin-top: 10px; max-width: 100%; border: 1px solid #999; }
  </style>
</head>
<body>
  <h1>Web Replay Report</h1>

  ${results
    .map(
      (r, i) => `
    <div class="step">
      <h2>
        Step ${i + 1} —
        ${r.pass ? '<span class="pass">PASS</span>' : '<span class="fail">FAIL</span>'}
      </h2>

      <p><strong>Opened URL:</strong> ${r.target_href}</p>

      <p><strong>Recorded firstP:</strong></p>
      <pre>${r.content.firstP || ""}</pre>

      <p><strong>Live firstP:</strong></p>
      <pre>${r.liveContent.firstP || ""}</pre>

      ${
        !r.pass && r.screenshotPath
          ? `
        <h3>Failure Screenshot</h3>
        <img src="replay-artifacts/${path.basename(r.screenshotPath)}" />
      `
          : ""
      }
    </div>
  `
    )
    .join("")}

</body>
</html>
`;

  fs.writeFileSync(REPORT_FILE, reportHtml);
  console.log(`📄 Replay report generated → ${REPORT_FILE}`);

  const failed = results.find(r => !r.pass);
  if (failed) {
    throw new Error("❌ Replay verification failed");
  }

  console.log("✅ Replay verification passed");
}
