const BASE = "https://claude.ai";

export const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Referer: "https://claude.ai/",
  Origin: "https://claude.ai",
};

function buildCookieHeader(value: string): string {
  // If the user pasted just the raw UUID (no "name=value" format), wrap it
  return value.includes("=") ? value : `sessionKey=${value}`;
}

async function getOrgId(cookie: string): Promise<string> {
  const res = await fetch(`${BASE}/api/organizations`, {
    headers: { ...BROWSER_HEADERS, Cookie: cookie },
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(
      `claude.ai auth failed (HTTP ${res.status}) — re-copy the session cookie from your browser. ${detail.slice(0, 200)}`
    );
  }
  const orgs = await res.json();
  if (!orgs?.[0]?.uuid) throw new Error("No claude.ai organization found");
  return orgs[0].uuid;
}

async function createConversation(
  orgId: string,
  cookie: string
): Promise<string> {
  const res = await fetch(
    `${BASE}/api/organizations/${orgId}/chat_conversations`,
    {
      method: "POST",
      headers: {
        ...BROWSER_HEADERS,
        "Content-Type": "application/json",
        Cookie: cookie,
      },
      body: JSON.stringify({ name: "" }),
    }
  );
  const data = await res.json();
  return data.uuid;
}

export async function sendMessage(
  system: string,
  userContent: string
): Promise<string> {
  const envValue = process.env.CLAUDE_SESSION_COOKIE;
  if (!envValue) throw new Error("CLAUDE_SESSION_COOKIE is not set");

  const cookie = buildCookieHeader(envValue);

  const orgId = await getOrgId(cookie);
  const convId = await createConversation(orgId, cookie);

  const prompt = `${system}\n\n${userContent}`;

  const res = await fetch(
    `${BASE}/api/organizations/${orgId}/chat_conversations/${convId}/completion`,
    {
      method: "POST",
      headers: {
        ...BROWSER_HEADERS,
        "Content-Type": "application/json",
        Cookie: cookie,
        Accept: "text/event-stream",
      },
      body: JSON.stringify({
        prompt,
        attachments: [],
        files: [],
        timezone: "UTC",
      }),
    }
  );

  if (!res.ok)
    throw new Error(`claude.ai completion failed: ${res.status}`);

  const raw = await res.text();
  let fullText = "";
  for (const line of raw.split("\n")) {
    if (!line.startsWith("data:")) continue;
    try {
      const chunk = JSON.parse(line.slice(5).trim());
      if (chunk.type === "content_block_delta") {
        fullText += chunk.delta?.text ?? "";
      } else if (typeof chunk.completion === "string") {
        fullText += chunk.completion;
      }
    } catch {
      // skip malformed SSE lines
    }
  }
  return fullText;
}
