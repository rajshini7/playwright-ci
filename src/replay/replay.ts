import { Page } from "playwright";
import fs from "fs";
import path from "path";
import { login } from "../auth/login";
import { extractContent } from "../record/recorder";
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

const OUT_DIR = path.join(process.cwd(), "baseline");
const OUT_FILE = path.join(OUT_DIR, "steps.json");
const REPORT_FILE = path.join(process.cwd(), "replay-report.html");

/* ================= HELPERS ================= */

function loadSteps(): Step[] {
  if (!fs.existsSync(OUT_FILE)) {
    throw new Error(`${OUT_FILE} not found. Run recorder first.`);
  }
  return JSON.parse(fs.readFileSync(OUT_FILE, "utf-8")) as Step[];
}

function normalize(s?: string) {
  return (s || "").replace(/\s+/g, " ").trim();
}

/* ================= EXPORTED ENTRY ================= */

export async function runReplay(): Promise<void> {
  let steps: Step[] = loadSteps();

  if (!steps.length) {
    console.log("No recorded steps found.");
    return;
  }

  const results: StepResult[] = [];
  let page: Page | null = null;

  try {
    console.log("🔑 Starting login for replay...");
    page = await login();
    console.log("✅ Login successful. Starting replay...");

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];

      console.log(`\n▶ Step ${i + 1}: ${step.target_href}`);

      await page.goto(step.target_href, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
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
    console.error("Replay crashed:", err);
    throw err; // 🔑 CI MUST FAIL
  } finally {
    if (page) await page.context().browser()?.close();
  }

  /* ================= REPORT ================= */

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
          ? `<img src="file://${r.screenshotPath.replace(/\\/g, "/")}" />`
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
  console.log("\n✅ Replay finished. Report saved at:", REPORT_FILE);

  // 🔑 Fail CI if any step failed
  const failed = results.find(r => !r.pass);
  if (failed) {
    throw new Error("Replay verification failed");
  }
}
