import { NextResponse } from "next/server";
import { spawn } from "child_process";
import { readFileSync, existsSync } from "fs";
import path from "path";

export async function POST() {
  const scriptPath = path.join(process.cwd(), "scripts", "setup-session.mjs");

  try {
    await new Promise<void>((resolve, reject) => {
      // Use process.execPath so we always get the exact Node.js binary
      // that's running the server — avoids PATH lookup failures
      const child = spawn(process.execPath, [scriptPath], {
        stdio: ["ignore", "pipe", "pipe"],
      });

      let stderr = "";
      child.stderr?.on("data", (d) => (stderr += d.toString()));

      child.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(stderr.trim() || `Process exited with code ${code}`));
        }
      });

      child.on("error", (err) => reject(err));
    });

    // Inject the new cookie into the running process so no server restart is needed
    const envPath = path.join(process.cwd(), ".env.local");
    if (existsSync(envPath)) {
      const content = readFileSync(envPath, "utf8");
      const match = content.match(/CLAUDE_SESSION_COOKIE=(.+)/);
      if (match) {
        process.env.CLAUDE_SESSION_COOKIE = match[1].trim();
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
