import { chromium } from "playwright";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ENV_PATH = join(ROOT, ".env.local");
// Persistent profile so the user only needs to log in once
const PROFILE_DIR = join(ROOT, ".playwright-profile");

mkdirSync(PROFILE_DIR, { recursive: true });

async function main() {
  const context = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless: false,
    channel: "chrome",
    args: [
      // Removes the flag Google checks to detect automation
      "--disable-blink-features=AutomationControlled",
    ],
  });

  // Hide navigator.webdriver so Google OAuth doesn't block sign-in
  await context.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });
  });

  const page = await context.newPage();

  console.log("\nOpening claude.ai — please log in in the browser window...\n");
  await page.goto("https://claude.ai/login");

  // Poll every 1.5s until the sessionKey cookie appears after login
  let sessionKey = "";
  while (!sessionKey) {
    const cookies = await context.cookies("https://claude.ai");
    const found = cookies.find((c) => c.name === "sessionKey");
    if (found?.value) {
      sessionKey = found.value;
      break;
    }
    await page.waitForTimeout(1500);
  }

  await context.close();

  // Write / replace CLAUDE_SESSION_COOKIE in .env.local
  let env = existsSync(ENV_PATH) ? readFileSync(ENV_PATH, "utf8") : "";
  const line = `CLAUDE_SESSION_COOKIE=sessionKey=${sessionKey}`;
  if (env.includes("CLAUDE_SESSION_COOKIE=")) {
    env = env.replace(/CLAUDE_SESSION_COOKIE=.*/m, line);
  } else {
    env = env.trimEnd() + "\n" + line + "\n";
  }
  writeFileSync(ENV_PATH, env);

  console.log("\n✓ Session cookie saved to .env.local\n");
}

main().catch((err) => {
  console.error("setup-session error:", err.message);
  process.exit(1);
});
