import Anthropic from "@anthropic-ai/sdk";
import { buildRepoReviewPrompt } from "@/lib/prompt";
import { fetchFileContents } from "@/lib/github";
import { NextRequest, NextResponse } from "next/server";

const anthropic = new Anthropic();

const MAX_FILES = 50;
const MAX_TOTAL_SIZE = 200_000;

export async function POST(req: NextRequest) {
  try {
    const { owner, repo, branch, files, accessToken } = await req.json();

    if (!owner || !repo || !branch || !files?.length) {
      return NextResponse.json(
        { error: "Missing required fields: owner, repo, branch, files" },
        { status: 400 }
      );
    }

    const filePaths = (files as string[]).slice(0, MAX_FILES);

    const fileContents = await fetchFileContents(
      owner,
      repo,
      branch,
      filePaths,
      accessToken
    );

    if (fileContents.length === 0) {
      return NextResponse.json(
        { error: "Could not fetch any files from the repository." },
        { status: 400 }
      );
    }

    let totalSize = 0;
    const includedFiles: { path: string; content: string }[] = [];

    for (const file of fileContents) {
      if (totalSize + file.content.length > MAX_TOTAL_SIZE) break;
      includedFiles.push(file);
      totalSize += file.content.length;
    }

    const combinedCode = includedFiles
      .map((f) => `=== FILE: ${f.path} ===\n${f.content}`)
      .join("\n\n");

    const systemPrompt = buildRepoReviewPrompt();

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Review this repository (${owner}/${repo}):\n\n${combinedCode}`,
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

    parsed.filesReviewed = includedFiles.length;

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Scan API error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Scan failed: ${msg}` },
      { status: 500 }
    );
  }
}
