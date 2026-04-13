"use client";

import { ReviewResult } from "@/lib/types";
import { Bug, Shield, Gauge, Paintbrush } from "lucide-react";

interface ScoreCardProps {
  result: ReviewResult;
}

function getScoreColor(score: number): string {
  if (score < 50) return "text-red-500";
  if (score < 75) return "text-amber-500";
  return "text-green-500";
}

function getScoreBg(score: number): string {
  if (score < 50) return "bg-red-500/10 border-red-500/30";
  if (score < 75) return "bg-amber-500/10 border-amber-500/30";
  return "bg-green-500/10 border-green-500/30";
}

export default function ScoreCard({ result }: ScoreCardProps) {
  const bugs = result.issues.filter((i) => i.type === "bug").length;
  const security = result.issues.filter((i) => i.type === "security").length;
  const stylePerf = result.issues.filter(
    (i) => i.type === "style" || i.type === "performance"
  ).length;

  return (
    <div className="grid grid-cols-4 gap-3">
      <div
        className={`rounded-lg border p-4 text-center ${getScoreBg(result.score)}`}
      >
        <div className={`text-3xl font-bold ${getScoreColor(result.score)}`}>
          {result.score}
        </div>
        <div className="text-xs text-gray-500 mt-1 font-medium">Score</div>
      </div>

      <div className="rounded-lg border border-gray-200 p-4 text-center">
        <div className="flex justify-center mb-1">
          <Bug className="w-4 h-4 text-red-500" />
        </div>
        <div className="text-2xl font-bold text-gray-800">{bugs}</div>
        <div className="text-xs text-gray-500 mt-1">Bugs</div>
      </div>

      <div className="rounded-lg border border-gray-200 p-4 text-center">
        <div className="flex justify-center mb-1">
          <Shield className="w-4 h-4 text-amber-500" />
        </div>
        <div className="text-2xl font-bold text-gray-800">{security}</div>
        <div className="text-xs text-gray-500 mt-1">Security</div>
      </div>

      <div className="rounded-lg border border-gray-200 p-4 text-center">
        <div className="flex justify-center mb-1">
          <Paintbrush className="w-4 h-4 text-blue-500" />
        </div>
        <div className="text-2xl font-bold text-gray-800">{stylePerf}</div>
        <div className="text-xs text-gray-500 mt-1">Style / Perf</div>
      </div>
    </div>
  );
}
