// src/config/env.ts

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env variable: ${name}`);
  }
  return value;
}

export function getEnv() {
  return {
    baseUrl: required("BASE_URL"),
    username: required("LOGIN_USER"),
    password: required("LOGIN_PASS"),
    loginSuccessSelector: required("LOGIN_SUCCESS_SELECTOR"),
    headless: process.env.CI === "true",
  };
}
