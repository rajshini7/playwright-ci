export function getEnv() {
  return {
    baseUrl: process.env.BASE_URL || "",
    username: process.env.USERNAME || "",
    password: process.env.PASSWORD || "",
    headless: process.env.CI === "true",
  };
}
