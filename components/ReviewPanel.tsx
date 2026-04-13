"use client";

import { ReviewResult } from "@/lib/types";
import ScoreCard from "./ScoreCard";
import IssueCard from "./IssueCard";
import { FileSearch } from "lucide-react";

interface ReviewPanelProps {
  result: ReviewResult | null;
  loading: boolean;
  error: string | null;
}

function SkeletonCard() {
  return (
    <div className="rounded-lg border border-gray-200 p-4 animate-pulse">
      <div className="flex gap-2 mb-3">
        <div className="h-5 w-16 bg-gray-200 rounded-full" />
        <div className="h-5 w-12 bg-gray-200 rounded-full" />
        <div className="h-5 w-20 bg-gray-200 rounded-full ml-auto" />
      </div>
      <div className="h-4 w-full bg-gray-200 rounded mb-2" />
      <div className="h-4 w-3/4 bg-gray-200 rounded mb-3" />
      <div className="h-16 w-full bg-gray-100 rounded" />
    </div>
  );
}

function SkeletonScore() {
  return (
    <div className="grid grid-cols-4 gap-3 animate-pulse">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="rounded-lg border border-gray-200 p-4">
          <div className="h-8 w-12 bg-gray-200 rounded mx-auto mb-2" />
          <div className="h-3 w-10 bg-gray-200 rounded mx-auto" />
        </div>
      ))}
    </div>
  );
}

export default function ReviewPanel({
  result,
  loading,
  error,
}: ReviewPanelProps) {
  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
          <strong>Error:</strong> {error}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <SkeletonScore />
        <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse" />
        <div className="space-y-3 mt-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
        <FileSearch className="w-16 h-16 mb-4 opacity-50" />
        <h3 className="text-lg font-medium text-gray-500 mb-2">
          No review yet
        </h3>
        <p className="text-sm text-center max-w-xs">
          Paste your code in the editor and click{" "}
          <strong>&quot;Review Code&quot;</strong> to get an AI-powered analysis
          with actionable feedback.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4 overflow-y-auto h-full">
      <ScoreCard result={result} />

      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-1">Summary</h3>
        <p className="text-sm text-gray-600">{result.summary}</p>
      </div>

      {result.issues.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">
            Issues ({result.issues.length})
          </h3>
          {result.issues.map((issue, i) => (
            <IssueCard key={i} issue={issue} index={i} />
          ))}
        </div>
      )}

      {result.issues.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <p className="text-sm">No issues found. Great code!</p>
        </div>
      )}
    </div>
  );
}
