"use client";

import { useState, useRef, useEffect } from "react";
import { Search, Loader2, GitBranch, Lock } from "lucide-react";

export interface UserRepo {
  full_name: string;
  private: boolean;
  description: string | null;
  language: string | null;
}

interface RepoInputProps {
  onSubmit: (url: string) => void;
  loading: boolean;
  repos?: UserRepo[];
  reposLoading?: boolean;
}

export default function RepoInput({
  onSubmit,
  loading,
  repos = [],
  reposLoading = false,
}: RepoInputProps) {
  const [url, setUrl] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const query = url.trim().toLowerCase();
  const filtered = query
    ? repos.filter(
        (r) =>
          r.full_name.toLowerCase().includes(query) ||
          r.description?.toLowerCase().includes(query)
      )
    : repos;

  const hasDropdown = repos.length > 0 || reposLoading;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim() && !loading) {
      setOpen(false);
      onSubmit(url.trim());
    }
  };

  const handleSelect = (fullName: string) => {
    const repoUrl = `https://github.com/${fullName}`;
    setUrl(repoUrl);
    setOpen(false);
    onSubmit(repoUrl);
  };

  // Close on outside click
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex gap-2">
        <div className="flex-1 relative" ref={containerRef}>
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 z-10 pointer-events-none" />
          <input
            type="text"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (hasDropdown) setOpen(true);
            }}
            onFocus={() => hasDropdown && setOpen(true)}
            placeholder={
              repos.length > 0
                ? "Search your repos or paste a URL…"
                : "https://github.com/owner/repo"
            }
            className="w-full bg-[#161b22] border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            disabled={loading}
          />

          {/* Dropdown */}
          {open && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#161b22] border border-gray-700 rounded-lg shadow-2xl z-50 overflow-hidden">
              {reposLoading ? (
                <div className="flex items-center gap-2 px-4 py-3 text-sm text-gray-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Loading your repositories…
                </div>
              ) : filtered.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-500">
                  No repositories found
                </div>
              ) : (
                <ul className="max-h-72 overflow-y-auto">
                  {filtered.map((repo) => (
                    <li key={repo.full_name}>
                      <button
                        type="button"
                        onClick={() => handleSelect(repo.full_name)}
                        className="w-full flex items-start gap-3 px-4 py-2.5 hover:bg-[#1c2128] transition-colors text-left"
                      >
                        <GitBranch className="w-3.5 h-3.5 text-gray-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm text-white truncate">
                              {repo.full_name}
                            </span>
                            {repo.private && (
                              <Lock className="w-3 h-3 text-gray-500 flex-shrink-0" />
                            )}
                          </div>
                          {repo.description && (
                            <div className="text-xs text-gray-500 truncate mt-0.5">
                              {repo.description}
                            </div>
                          )}
                        </div>
                        {repo.language && (
                          <span className="text-xs text-gray-500 flex-shrink-0 mt-0.5">
                            {repo.language}
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm px-6 py-3 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading…
            </>
          ) : (
            "Fetch Repo"
          )}
        </button>
      </div>
    </form>
  );
}
