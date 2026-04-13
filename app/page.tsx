"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import CodeEditor from "@/components/CodeEditor";
import ReviewPanel from "@/components/ReviewPanel";
import LanguageSelector from "@/components/LanguageSelector";
import GitHubPicker from "@/components/GitHubPicker";
import { ReviewResult } from "@/lib/types";
import { Loader2, LogIn, LogOut, Trash2, ScanSearch } from "lucide-react";

const SAMPLE_CODE = `// Example: User lookup endpoint
const express = require('express');
const app = express();
const db = require('./db');

app.get('/api/users', async (req, res) => {
  const username = req.query.username;

  // Direct string concatenation in SQL query
  const query = "SELECT * FROM users WHERE username = '" + username + "'";
  const result = await db.query(query);

  // Missing null check on result
  const user = result.rows[0];
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  });
});

app.listen(3000);`;

const STORAGE_KEY = "codescan_last_review";

export default function HomePage() {
  const { data: session } = useSession();
  const [code, setCode] = useState(SAMPLE_CODE);
  const [language, setLanguage] = useState("javascript");
  const [result, setResult] = useState<ReviewResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setResult(JSON.parse(saved));
      }
    } catch {}
  }, []);

  const saveResult = (r: ReviewResult) => {
    setResult(r);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(r));
    } catch {}
  };

  const handleReview = useCallback(async () => {
    if (!code.trim() || loading) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Review request failed");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.error) throw new Error(data.error);
            if (data.done && data.fullText) {
              fullText = data.fullText;
            }
          } catch (e) {
            if (e instanceof Error && e.message === "Stream failed") throw e;
          }
        }
      }

      if (!fullText) throw new Error("No response received from AI");

      const parsed: ReviewResult = JSON.parse(fullText);
      saveResult(parsed);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setLoading(false);
    }
  }, [code, language, loading]);

  const handleClear = () => {
    setCode("");
    setResult(null);
    setError(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  const handleGitHubFile = (content: string, path: string) => {
    setCode(content);
    const ext = path.split(".").pop()?.toLowerCase();
    const extMap: Record<string, string> = {
      js: "javascript",
      jsx: "javascript",
      ts: "typescript",
      tsx: "typescript",
      py: "python",
      java: "java",
      go: "go",
      rs: "rust",
      rb: "ruby",
      php: "php",
      swift: "swift",
      kt: "kotlin",
      html: "html",
      css: "css",
      sql: "sql",
      sh: "shell",
      c: "c",
      cpp: "cpp",
      cs: "csharp",
    };
    if (ext && extMap[ext]) setLanguage(extMap[ext]);
  };

  const accessToken = (session as unknown as Record<string, string>)
    ?.accessToken;

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden">
      {/* LEFT PANEL - Editor */}
      <div className="w-full md:w-[55%] h-1/2 md:h-full flex flex-col bg-[#0d1117]">
        {/* Header bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <ScanSearch className="w-5 h-5 text-blue-400" />
              <h1 className="text-lg font-bold text-white tracking-tight">
                CodeScan
              </h1>
            </div>
            <LanguageSelector value={language} onChange={setLanguage} />
          </div>

          <div className="flex items-center gap-2">
            {session ? (
              <button
                onClick={() => signOut()}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors px-2 py-1.5 rounded hover:bg-gray-800"
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
                GitHub
              </button>
            )}
          </div>
        </div>

        {/* GitHub picker */}
        {session && accessToken && (
          <GitHubPicker
            accessToken={accessToken}
            onFileSelect={handleGitHubFile}
          />
        )}

        {/* Monaco Editor */}
        <div className="flex-1 min-h-0">
          <CodeEditor value={code} onChange={setCode} language={language} />
        </div>

        {/* Bottom action bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-700">
          <button
            onClick={handleReview}
            disabled={loading || !code.trim()}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm px-5 py-2 rounded-lg transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Reviewing...
              </>
            ) : (
              <>
                <ScanSearch className="w-4 h-4" />
                Review Code
              </>
            )}
          </button>

          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear
          </button>

          <span className="text-xs text-gray-600 ml-auto">
            {code.split("\n").length} lines
          </span>
        </div>
      </div>

      {/* RIGHT PANEL - Review Results */}
      <div className="w-full md:w-[45%] h-1/2 md:h-full bg-white border-l border-gray-200 overflow-hidden flex flex-col">
        <div className="px-6 py-3 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-700">
            Review Results
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          <ReviewPanel result={result} loading={loading} error={error} />
        </div>
      </div>
    </div>
  );
}
