import { NextRequest, NextResponse } from "next/server";
import { parseGitHubUrl, fetchRepoTree } from "@/lib/github";

export async function POST(req: NextRequest) {
  try {
    const { repoUrl, accessToken } = await req.json();

    const parsed = parseGitHubUrl(repoUrl);
    if (!parsed) {
      return NextResponse.json(
        {
          error:
            "Invalid GitHub URL. Use format: https://github.com/owner/repo",
        },
        { status: 400 }
      );
    }

    const { owner, repo } = parsed;
    const { branch, files } = await fetchRepoTree(owner, repo, accessToken);

    return NextResponse.json({ owner, repo, branch, files });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
