import { NextResponse } from "next/server";
import { BROWSER_HEADERS } from "@/lib/claude-web";

export async function GET() {
  const raw = process.env.CLAUDE_SESSION_COOKIE;
  if (!raw?.trim()) {
    return NextResponse.json(
      { valid: false, error: "CLAUDE_SESSION_COOKIE is not set" },
      { status: 401 }
    );
  }

  const cookie = raw.includes("=") ? raw : `sessionKey=${raw}`;

  try {
    const res = await fetch("https://claude.ai/api/organizations", {
      headers: { ...BROWSER_HEADERS, Cookie: cookie },
    });

    if (!res.ok) {
      return NextResponse.json(
        { valid: false, error: "CLAUDE_SESSION_COOKIE is not set" },
        { status: 401 }
      );
    }

    return NextResponse.json({ valid: true });
  } catch {
    return NextResponse.json(
      { valid: false, error: "CLAUDE_SESSION_COOKIE is not set" },
      { status: 401 }
    );
  }
}
