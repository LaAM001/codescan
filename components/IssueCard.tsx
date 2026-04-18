"use client";

import { Issue } from "@/lib/types";
import { useState } from "react";
import { Check, Copy } from "lucide-react";

interface IssueCardProps {
  issue: Issue;
  index: number;
}

const SEVERITY_STYLES: Record<string, { badge: string; border: string }> = {
  critical: {
    badge: "bg-red-100 text-red-700 border-red-200",
    border: "border-l-red-500",
  },
  major: {
    badge: "bg-amber-100 text-amber-700 border-amber-200",
    border: "border-l-amber-500",
  },
  minor: {
    badge: "bg-blue-100 text-blue-700 border-blue-200",
    border: "border-l-blue-500",
  },
};

const TYPE_STYLES: Record<string, string> = {
  bug: "bg-red-50 text-red-600 border-red-200",
  security: "bg-amber-50 text-amber-600 border-amber-200",
  performance: "bg-purple-50 text-purple-600 border-purple-200",
  style: "bg-blue-50 text-blue-600 border-blue-200",
};

export default function IssueCard({ issue, index }: IssueCardProps) {
  const [copied, setCopied] = useState(false);
  const severity = SEVERITY_STYLES[issue.severity] || SEVERITY_STYLES.minor;
  const typeStyle = TYPE_STYLES[issue.type] || TYPE_STYLES.style;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(issue.fix);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`rounded-lg border border-gray-200 border-l-4 ${severity.border} bg-white p-4 transition-all hover:shadow-md`}
    >
      {issue.file && (
        <div className="text-xs text-gray-500 font-mono truncate mb-1.5">
          {issue.file}
        </div>
      )}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${severity.badge}`}
        >
          {issue.severity}
        </span>
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full border ${typeStyle}`}
        >
          {issue.type}
        </span>
        <span className="text-xs text-gray-400 ml-auto font-mono">
          Line {issue.line_start}
          {issue.line_end !== issue.line_start ? `–${issue.line_end}` : ""}
        </span>
      </div>

      <p className="text-sm text-gray-700 mb-3">{issue.description}</p>

      <div className="relative">
        <div className="bg-gray-50 rounded-md border border-gray-200 p-3 pr-10">
          <pre className="text-xs text-gray-800 font-mono whitespace-pre-wrap break-words">
            {issue.fix}
          </pre>
        </div>
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 p-1.5 rounded-md hover:bg-gray-200 transition-colors text-gray-400 hover:text-gray-600"
          title="Copy fix"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-green-500" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}
