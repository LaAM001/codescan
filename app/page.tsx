"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import RepoInput, { UserRepo } from "@/components/RepoInput";
import FileTree from "@/components/FileTree";
import ReviewPanel from "@/components/ReviewPanel";
import { ReviewResult, RepoInfo, RepoTreeFile } from "@/lib/types";
import {
  ScanSearch,
  LogIn,
  LogOut,
  Loader2,
  GitBranch,
  Trash2,
  PlugZap,
} from "lucide-react";

const STORAGE_KEY = "codescan_last_review";

export default function HomePage() {
  const { data: session } = useSession();
  const [repoInfo, setRepoInfo] = useState<RepoInfo | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [result, setResult] = useState<ReviewResult | null>(null);
  const [treeLoading, setTreeLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [settingUpSession, setSettingUpSession] = useState(false);
  const [userRepos, setUserRepos] = useState<UserRepo[]>([]);
  const [reposLoading, setReposLoading] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setResult(JSON.parse(saved));
    } catch {}
  }, []);

  const saveResult = (r: ReviewResult) => {
    setResult(r);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(r));
    } catch {}
  };

  const accessToken = (session as unknown as Record<string, string>)
    ?.accessToken;

  // Fetch the signed-in user's repos when the token is available
  useEffect(() => {
    if (!accessToken) {
      setUserRepos([]);
      return;
    }
    setReposLoading(true);
    fetch("https://api.github.com/user/repos?sort=updated&per_page=100&affiliation=owner,collaborator", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((data: UserRepo[]) => setUserRepos(Array.isArray(data) ? data : []))
      .catch(() => setUserRepos([]))
      .finally(() => setReposLoading(false));
  }, [accessToken]);

  useEffect(() => {
    if (!scanning) {
      setScanProgress(0);
      return;
    }
    let current = 0;
    setScanProgress(0);
    const tick = setInterval(() => {
      if (current < 90) {
        const remaining = 90 - current;
        current = Math.min(90, current + remaining * 0.03 + Math.random() * 0.5);
      } else {
        const remaining = 99 - current;
        current = Math.min(99, current + remaining * 0.008 + Math.random() * 0.05);
      }
      setScanProgress(Math.floor(current));
    }, 250);
    return () => clearInterval(tick);
  }, [scanning]);

  const handleFetchRepo = useCallback(
    async (url: string) => {
      setTreeLoading(true);
      setError(null);
      setResult(null);
      setRepoInfo(null);
      try {
        const res = await fetch("/api/repo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ repoUrl: url, accessToken }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch repository");

        setRepoInfo(data);
        setSelectedFiles(
          new Set(data.files.map((f: RepoTreeFile) => f.path))
        );
        setSelectMode(false);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch repository"
        );
      } finally {
        setTreeLoading(false);
      }
    },
    [accessToken]
  );

  const handleScan = useCallback(async () => {
    if (!repoInfo || scanning) return;

    setError(null);
    setResult(null);

    // Validate session before showing the progress bar
    try {
      const check = await fetch("/api/check-session");
      const checkData = await check.json();
      if (!check.ok || !checkData.valid) {
        setError(checkData.error || "CLAUDE_SESSION_COOKIE is not set");
        return;
      }
    } catch {
      setError("CLAUDE_SESSION_COOKIE is not set");
      return;
    }

    setScanning(true);

    try {
      const files = selectMode
        ? Array.from(selectedFiles)
        : repoInfo.files.map((f) => f.path);

      if (files.length === 0) {
        throw new Error("No files selected to scan.");
      }

      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner: repoInfo.owner,
          repo: repoInfo.repo,
          branch: repoInfo.branch,
          files,
          accessToken,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Scan failed");

      saveResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan failed");
    } finally {
      setScanning(false);
    }
  }, [repoInfo, scanning, selectMode, selectedFiles, accessToken]);

  const handleToggleFile = (path: string) => {
    setSelectedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const handleSetupSession = async () => {
    setSettingUpSession(true);
    setError(null);
    try {
      const res = await fetch("/api/setup-session", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Session setup failed");
      await handleScan();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Session setup failed");
    } finally {
      setSettingUpSession(false);
    }
  };

  const handleClear = () => {
    setRepoInfo(null);
    setResult(null);
    setError(null);
    setSelectedFiles(new Set());
    setSelectMode(false);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  const fileCount = selectMode ? selectedFiles.size : (repoInfo?.files.length ?? 0);

  return (
    <div className="min-h-screen bg-[#0d1117]">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ScanSearch className="w-5 h-5 text-blue-400" />
            <h1 className="text-lg font-bold text-white tracking-tight">
              CodeScan
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {(repoInfo || result) && (
              <button
                onClick={handleClear}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                Clear
              </button>
            )}
            {session ? (
              <button
                onClick={() => signOut()}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign out
              </button>
            ) : (
              <button
                onClick={() => signIn("github")}
                className="flex items-center gap-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white px-3 py-1.5 rounded transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign in with GitHub
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Hero — only when nothing is loaded yet */}
        {!repoInfo && !result && (
          <div className="text-center mb-10 pt-16 pb-4">
            <ScanSearch className="w-14 h-14 text-blue-400 mx-auto mb-5" />
            <h2 className="text-3xl font-bold text-white mb-3">
              AI-Powered Repository Review
            </h2>
            <p className="text-gray-400 max-w-lg mx-auto leading-relaxed">
              Enter a GitHub repository URL to get a comprehensive code review
              powered by Claude. Scans for bugs, security vulnerabilities,
              performance issues, and style problems across your entire codebase.
            </p>
          </div>
        )}

        {/* Repo URL input */}
        <div className="mb-6">
          <RepoInput
            onSubmit={handleFetchRepo}
            loading={treeLoading}
            repos={userRepos}
            reposLoading={reposLoading}
          />
        </div>

        {/* Error banner */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
            {error.includes("CLAUDE_SESSION_COOKIE is not set") ? (
              <div className="flex items-center justify-between gap-4">
                <p className="text-red-400 text-sm">
                  Claude.ai session not connected.
                </p>
                <button
                  onClick={handleSetupSession}
                  disabled={settingUpSession}
                  className="flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded transition-colors shrink-0"
                >
                  {settingUpSession ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <PlugZap className="w-3 h-3" />
                  )}
                  {settingUpSession ? "Opening browser…" : "Connect Claude.ai"}
                </button>
              </div>
            ) : (
              <p className="text-red-400 text-sm">{error}</p>
            )}
          </div>
        )}

        {/* Repo info + file tree + scan button */}
        {repoInfo && (
          <div className="mb-8 space-y-4">
            {/* Repo header */}
            <div className="flex items-center gap-3 flex-wrap">
              <GitBranch className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-white font-medium">
                {repoInfo.owner}/{repoInfo.repo}
              </span>
              <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded">
                {repoInfo.branch}
              </span>
              <span className="text-xs text-gray-500">
                {repoInfo.files.length} code files found
              </span>
            </div>

            {/* File tree */}
            <FileTree
              files={repoInfo.files}
              selectedFiles={selectedFiles}
              onToggleFile={handleToggleFile}
              onSelectAll={() =>
                setSelectedFiles(
                  new Set(repoInfo.files.map((f) => f.path))
                )
              }
              onDeselectAll={() => setSelectedFiles(new Set())}
              selectMode={selectMode}
              onToggleSelectMode={() => setSelectMode(!selectMode)}
            />

            {/* Scan button / progress bar */}
            {scanning ? (
              <div className="w-full rounded-lg bg-[#161b22] border border-blue-500/20 px-4 py-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm text-blue-300">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Scanning {fileCount} files...
                  </span>
                  <span className="text-xs text-gray-400 font-mono tabular-nums">
                    {scanProgress}%
                  </span>
                </div>
                <div className="w-full bg-gray-700/60 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-500 ease-out"
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <button
                onClick={handleScan}
                disabled={selectMode && selectedFiles.size === 0}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <ScanSearch className="w-4 h-4" />
                {selectMode
                  ? `Scan ${selectedFiles.size} Selected Files`
                  : "Scan Full Repository"}
              </button>
            )}
          </div>
        )}

        {/* Results — only shown when scanning or when we have results */}
        {(result || scanning) && (
          <div className="bg-white rounded-xl overflow-hidden shadow-lg">
            <div className="px-6 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700">
                Review Results
              </h2>
              {result?.filesReviewed && (
                <span className="text-xs text-gray-500">
                  {result.filesReviewed} files reviewed
                </span>
              )}
            </div>
            <ReviewPanel result={result} loading={scanning} />
          </div>
        )}
      </main>
    </div>
  );
}
