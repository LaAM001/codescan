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

    const stream = anthropic.messages.stream({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Review this code:\n\n${code}`,
        },
      ],
    });

    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        try {
          stream.on("text", (text) => {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
            );
          });

          const finalMessage = await stream.finalMessage();
          const fullText =
            finalMessage.content[0].type === "text"
              ? finalMessage.content[0].text
              : "";

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ done: true, fullText })}\n\n`
            )
          );
          controller.close();
        } catch (err) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: "Stream failed" })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Review API error:", error);
    return NextResponse.json(
      { error: "Failed to process review request." },
      { status: 500 }
    );
  }
}
