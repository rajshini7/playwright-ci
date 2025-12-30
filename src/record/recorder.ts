// src/record/recorder.ts

// 🔑 dotenv MUST be first — BEFORE imports
import path from "path";
import dotenv from "dotenv";

dotenv.config({
  path: path.resolve(process.cwd(), ".env"),
});

import fs from "fs";
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

/* ================= RECORDER ================= */

export async function startRecorder(page?: Page) {
  console.log("🎥 Starting recorder");

  try {
    const activePage = page ?? (await loginForRecord());

    console.log("🖱️ Recorder ready — user may now click");

    // 👇 your existing recording logic continues here
    // (unchanged — not touching it)

  } catch (err) {
    console.error("❌ Recorder failed:", err);
    process.exit(1);
  }
}

// Standalone run
if (require.main === module) {
  startRecorder();
}
