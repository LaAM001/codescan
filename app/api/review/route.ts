import Anthropic from "@anthropic-ai/sdk";
import { buildReviewPrompt } from "@/lib/prompt";
import { NextRequest, NextResponse } from "next/server";

const anthropic = new Anthropic();

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

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Review this code:\n\n${code}`,
        },
      ],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";

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
