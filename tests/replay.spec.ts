import { test } from "@playwright/test";
import { runReplay } from "../src/replay/replay";

test("Recorded user journey replay", async () => {
  await runReplay();
});
