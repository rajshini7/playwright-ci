// src/auth/loginrecord.ts
import { chromium, Page } from "playwright";
import { LOGIN_SELECTORS } from "../config/selector";
import path from "path";

// 🔒 Explicit env loading
require("dotenv").config({
  path: path.resolve(process.cwd(), ".env"),
});

export async function loginForRecord(): Promise<Page> {
  const {
    BASE_URL,
    LOGIN_USER,
    LOGIN_PASS,
    LOGIN_SUCCESS_SELECTOR,
  } = process.env;

  if (!BASE_URL || !LOGIN_USER || !LOGIN_PASS || !LOGIN_SUCCESS_SELECTOR) {
    console.error("Loaded env:", process.env);
    throw new Error(
      "Missing .env values. Required: BASE_URL, LOGIN_USER, LOGIN_PASS, LOGIN_SUCCESS_SELECTOR"
    );
  }

  console.log("🚀 Launching headed browser for RECORD");

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log("🌐 Navigating to login page...");
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });

  console.log("✍️ Filling credentials...");
  await page.fill(LOGIN_SELECTORS.usernameInput, LOGIN_USER);
  await page.fill(LOGIN_SELECTORS.passwordInput, LOGIN_PASS);

  console.log("🔐 Submitting login...");
  await Promise.all([
    page.click(LOGIN_SELECTORS.submitButton),
    page.waitForLoadState("networkidle"),
  ]);

  console.log("🔎 Verifying login success...");
  await page.waitForSelector(LOGIN_SUCCESS_SELECTOR, {
    timeout: 15000,
    state: "visible",
  });

  console.log("✅ Login successful — returning page to recorder");
  return page;
}
