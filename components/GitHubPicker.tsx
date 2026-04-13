"use client";

import { useState, useEffect } from "react";
import { GitBranch, File, Loader2 } from "lucide-react";

interface GitHubPickerProps {
  accessToken: string;
  onFileSelect: (content: string, path: string, repo: string) => void;
}

interface Repo {
  full_name: string;
  default_branch: string;
}

export default function GitHubPicker({
  accessToken,
  onFileSelect,
}: GitHubPickerProps) {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState("");
  const [filePath, setFilePath] = useState("");
  const [loading, setLoading] = useState(false);
  const [reposLoading, setReposLoading] = useState(true);
  const [error, setError] = useState("");
  const [breadcrumb, setBreadcrumb] = useState("");

  useEffect(() => {
    async function fetchRepos() {
      try {
        const res = await fetch(
          "https://api.github.com/user/repos?sort=updated&per_page=30",
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        if (!res.ok) throw new Error("Failed to fetch repos");
        const data = await res.json();
        setRepos(data);
      } catch {
        setError("Failed to load repositories");
      } finally {
        setReposLoading(false);
      }
    }
    fetchRepos();
  }, [accessToken]);

  const handleLoadFile = async () => {
    if (!selectedRepo || !filePath.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `https://api.github.com/repos/${selectedRepo}/contents/${filePath.trim()}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/vnd.github.v3.raw",
          },
        }
      );
      if (!res.ok) throw new Error("File not found");
      const content = await res.text();
      setBreadcrumb(`${selectedRepo}/${filePath.trim()}`);
      onFileSelect(content, filePath.trim(), selectedRepo);
    } catch {
      setError("Could not load file. Check the path and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#161b22] border-b border-gray-700 px-4 py-2.5">
      <div className="flex items-center gap-2 flex-wrap">
        <GitBranch className="w-4 h-4 text-gray-400 flex-shrink-0" />

        {reposLoading ? (
          <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
        ) : (
          <select
            value={selectedRepo}
            onChange={(e) => setSelectedRepo(e.target.value)}
            className="bg-[#0d1117] text-gray-300 border border-gray-700 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Select repo...</option>
            {repos.map((r) => (
              <option key={r.full_name} value={r.full_name}>
                {r.full_name}
              </option>
            ))}
          </select>
        )}

        <div className="flex items-center gap-1 flex-1 min-w-0">
          <File className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="path/to/file.js"
            value={filePath}
            onChange={(e) => setFilePath(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLoadFile()}
            className="bg-[#0d1117] text-gray-300 border border-gray-700 rounded px-2 py-1 text-xs flex-1 min-w-0 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <button
          onClick={handleLoadFile}
          disabled={loading || !selectedRepo || !filePath.trim()}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs px-3 py-1 rounded transition-colors flex items-center gap-1"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Load"}
        </button>
      </div>

      {breadcrumb && (
        <div className="mt-1.5 text-xs text-gray-500 font-mono truncate">
          {breadcrumb}
        </div>
      )}

      {error && (
        <div className="mt-1.5 text-xs text-red-400">{error}</div>
      )}
    </div>
  );
}
