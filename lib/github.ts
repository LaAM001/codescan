const CODE_EXTENSIONS = new Set([
  "js", "jsx", "ts", "tsx", "mjs", "cjs",
  "py", "pyw",
  "java",
  "c", "cpp", "h", "hpp", "cc", "cxx",
  "cs",
  "go",
  "rs",
  "rb",
  "php",
  "swift",
  "kt", "kts",
  "html", "htm",
  "css", "scss", "sass", "less",
  "sql",
  "sh", "bash", "zsh",
  "yaml", "yml",
  "json",
  "xml",
  "vue",
  "svelte",
  "dart",
  "r",
  "scala",
  "lua",
  "pl",
]);

export function parseGitHubUrl(
  url: string
): { owner: string; repo: string } | null {
  const cleaned = url.trim().replace(/\.git$/, "").replace(/\/$/, "");

  const urlMatch = cleaned.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (urlMatch) return { owner: urlMatch[1], repo: urlMatch[2] };

  const shortMatch = cleaned.match(/^([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)$/);
  if (shortMatch) return { owner: shortMatch[1], repo: shortMatch[2] };

  return null;
}

export function isCodeFile(path: string): boolean {
  const ext = path.split(".").pop()?.toLowerCase();
  if (!ext) {
    const filename = path.split("/").pop()?.toLowerCase() || "";
    return ["dockerfile", "makefile", "gemfile", "rakefile"].includes(filename);
  }
  return CODE_EXTENSIONS.has(ext);
}

interface TreeEntry {
  path: string;
  type: string;
  size?: number;
}

export async function fetchRepoTree(
  owner: string,
  repo: string,
  accessToken?: string
): Promise<{ branch: string; files: { path: string; size: number }[] }> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
  };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const repoRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}`,
    { headers }
  );
  if (!repoRes.ok) {
    if (repoRes.status === 404)
      throw new Error(
        "Repository not found. Check the URL and make sure it exists."
      );
    if (repoRes.status === 403)
      throw new Error(
        "GitHub API rate limit exceeded. Sign in with GitHub for higher limits."
      );
    throw new Error(`GitHub API error: ${repoRes.status}`);
  }
  const repoData = await repoRes.json();
  const branch = repoData.default_branch;

  const treeRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
    { headers }
  );
  if (!treeRes.ok)
    throw new Error(`Failed to fetch repository tree: ${treeRes.status}`);
  const treeData = await treeRes.json();

  const files = (treeData.tree as TreeEntry[])
    .filter((entry) => entry.type === "blob" && isCodeFile(entry.path))
    .map((entry) => ({ path: entry.path, size: entry.size || 0 }))
    .sort((a, b) => a.path.localeCompare(b.path));

  return { branch, files };
}

export async function fetchFileContents(
  owner: string,
  repo: string,
  branch: string,
  filePaths: string[],
  accessToken?: string
): Promise<{ path: string; content: string }[]> {
  const results: { path: string; content: string }[] = [];
  const batchSize = 10;

  for (let i = 0; i < filePaths.length; i += batchSize) {
    const batch = filePaths.slice(i, i + batchSize);
    const promises = batch.map(async (path) => {
      const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
      const headers: Record<string, string> = {};
      if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

      try {
        const res = await fetch(url, { headers });
        if (!res.ok) return null;
        const content = await res.text();
        return { path, content };
      } catch {
        return null;
      }
    });

    const batchResults = await Promise.all(promises);
    for (const r of batchResults) {
      if (r) results.push(r);
    }
  }

  return results;
}
