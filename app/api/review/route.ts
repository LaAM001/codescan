import { sendMessage } from "@/lib/claude-web";
import { buildReviewPrompt } from "@/lib/prompt";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { code, language } = await req.json();

    if (!code || typeof code !== "string" || code.trim().length === 0) {
      return NextResponse.json(
        { error: "Code is required and must not be empty." },
        { status: 400 }
      );
    }

    const lineCount = code.split("\n").length;
    if (lineCount > 500) {
      return NextResponse.json(
        { error: "Code must not exceed 500 lines." },
        { status: 400 }
      );
    }

    const systemPrompt = buildReviewPrompt(language || "javascript");

    const text = await sendMessage(systemPrompt, `Review this code:\n\n${code}`);

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      console.error("Claude returned non-JSON:", text);
      return NextResponse.json(
        { error: "AI returned an unexpected format. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Review API error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Review failed: ${msg}` },
      { status: 500 }
    );
  }
}
