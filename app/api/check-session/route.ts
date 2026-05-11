import { NextResponse } from "next/server";
import { BROWSER_HEADERS } from "@/lib/claude-web";

const BASE = "https://claude.ai";
const INVALID = { valid: false, error: "CLAUDE_SESSION_COOKIE is not set" };

export async function GET() {
  const raw = process.env.CLAUDE_SESSION_COOKIE;
  if (!raw?.trim()) {
    return NextResponse.json(INVALID, { status: 401 });
  }

  const cookie = raw.includes("=") ? raw : `sessionKey=${raw}`;

  try {
    // Step 1: verify the org endpoint (catches fully expired sessions)
    const orgRes = await fetch(`${BASE}/api/organizations`, {
      headers: { ...BROWSER_HEADERS, Cookie: cookie },
    });
    if (!orgRes.ok) return NextResponse.json(INVALID, { status: 401 });

    const orgs = await orgRes.json();
    const orgId = orgs?.[0]?.uuid;
    if (!orgId) return NextResponse.json(INVALID, { status: 401 });

    // Step 2: try creating a conversation — catches soft-expired sessions where
    // the org endpoint still passes but completions are blocked
    const convRes = await fetch(
      `${BASE}/api/organizations/${orgId}/chat_conversations`,
      {
        method: "POST",
        headers: { ...BROWSER_HEADERS, "Content-Type": "application/json", Cookie: cookie },
        body: JSON.stringify({ name: "" }),
      }
    );
    if (!convRes.ok) return NextResponse.json(INVALID, { status: 401 });

    const conv = await convRes.json();
    if (!conv?.uuid) return NextResponse.json(INVALID, { status: 401 });

    return NextResponse.json({ valid: true });
  } catch {
    return NextResponse.json(INVALID, { status: 401 });
  }
}
