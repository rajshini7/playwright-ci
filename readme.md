Playwright Recorder & Replay Automation Framework

📌 OVERVIEW

This project is a Playwright-based UI journey recorder and replay framework that allows you to:
🔹Record real user navigation flows from a browser session
🔹Persist those steps as structured data (steps.json)
🔹Replay the exact same journey deterministically
🔹Verify content stability across runs
🔹Capture screenshots automatically on failures
🔹Generate a self-contained HTML replay report
🔹Run identically in local and CI environments
🔹Unlike traditional Playwright tests, this framework focuses on record once → replay forever with validation.

❓ WHY THIS PROJECT

Modern UI automation often fails due to:

🔹Dynamic content

🔹Fragile selectors

🔹Environment drift

🔹Poor debugging visibility in CI

🔹This project solves those problems by:

🔹Recording actual user intent

🔹Validating page content, not just navigation

🔹Providing visual proof (screenshots) on failures

🔹Producing CI-friendly artifacts

🔹Allowing safe regression detection without rewriting tests

This makes it ideal for:

🔹Smoke journeys

🔹Regression validation

🔹CI health checks

🔹Demo & audit evidence

🧠 CORE CONCEPTS
1️⃣ Recorder

Runs an interactive browser

Listens to anchor (<a>) clicks

Captures:

Source URL

Target URL

Page title

h1

First meaningful paragraph

Saves everything into baseline/steps.json

2️⃣ Replay Engine

Reads steps.json

Replays each navigation in order

Extracts live content

Compares recorded vs live content

Flags mismatches

3️⃣ Failure Intelligence

On mismatch:

Takes a full-page screenshot

Embeds it directly into the HTML report

CI exits with failure for visibility

4️⃣ Deterministic Reporting

Generates a single HTML replay report

Screenshots are embedded (not external dependencies)

Works offline after download

🧰 TECH STACK

Node.js 20

TypeScript

Playwright

GitHub Actions

HTML + CSS (custom report generation)

📁 FOLDER STRUCTURE
playwright-recorder/
│
├── baseline/
│   └── steps.json               # Recorded user journey
│
├── src/
│   ├── auth/
│   │   ├── loginrecord.ts       # Login logic for recording
│   │   └── loginreplay.ts       # Login logic for replay
│   │
│   ├── config/
│   │   ├── app.config.ts
│   │   ├── env.ts
│   │   └── selectors.ts
│   │
│   ├── record/
│   │   └── recorder.ts          # Recorder engine
│   │
│   ├── replay/
│   │   ├── artifacts/
│   │   │   ├── screenshot.ts    # Failure screenshot logic
│   │   │   └── replay-artifacts # Screenshots (runtime only)
│   │   │
│   │   ├── replay.ts            # Replay engine + report generator
│   │   └── index.ts
│   │
│   └── utils/
│       └── email.ts
│
├── tests/
│   └── replay.spec.ts           # CI entrypoint
│
├── .github/workflows/
│   └── playwright.yml           # CI pipeline
│
├── replay-report.html           # Generated report (artifact)
├── playwright.config.ts
├── package.json
└── README.md

▶️ HOW TO EXECUTE
🔹 Record a User Journey
npx ts-node src/record/recorder.ts


Perform clicks manually

Close the browser to stop recording

Output saved to baseline/steps.json

🔹 Replay & Verify (Local)
npx playwright test tests/replay.spec.ts


Requires .env with:

BASE_URL=...
USERNAME=...
PASSWORD=...

🔹 Replay in CI

Triggered automatically on:

Push to development

Pull requests to development

🔁 CI/CD READY

✅ GitHub Actions pipeline
✅ Headless execution
✅ Secrets via GitHub Secrets
✅ HTML report as downloadable artifact
✅ Screenshot evidence on failures
✅ Deterministic exit codes

📤 EXPECTED OUTPUT
✅ On Success

CI passes

Replay report generated

No screenshots included

❌ On Failure

CI fails intentionally

Replay report generated

Failure screenshots embedded inline

Artifacts downloadable from GitHub Actions

🌿 BRANCHING STRATEGY
main
├── staging
└── development

🔹 main

Stable, production-ready

Tagged checkpoints (e.g. v1.0-replay-stable)

🔹 staging

Pre-production validation

Final CI verification

🔹 development

Active feature development

Recorder & replay improvements

🏁 CREATED BY

Rajeev
Automation | Playwright | CI/CD | Systems Thinking
