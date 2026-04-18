"use client";

import { useMemo } from "react";
import { RepoTreeFile } from "@/lib/types";
import { FileCode } from "lucide-react";

interface FileTreeProps {
  files: RepoTreeFile[];
  selectedFiles: Set<string>;
  onToggleFile: (path: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  selectMode: boolean;
  onToggleSelectMode: () => void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileTree({
  files,
  selectedFiles,
  onToggleFile,
  onSelectAll,
  onDeselectAll,
  selectMode,
  onToggleSelectMode,
}: FileTreeProps) {
  const totalSize = useMemo(
    () =>
      files
        .filter((f) => selectedFiles.has(f.path))
        .reduce((sum, f) => sum + f.size, 0),
    [files, selectedFiles]
  );

  return (
    <div className="bg-[#161b22] border border-gray-700 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-300">
            {selectMode
              ? `${selectedFiles.size} of ${files.length} files`
              : `${files.length} files`}
          </span>
          <span className="text-xs text-gray-500">
            ({formatSize(totalSize)})
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {!selectMode ? (
            <button
              onClick={onToggleSelectMode}
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              Select specific files
            </button>
          ) : (
            <>
              <button
                onClick={onSelectAll}
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                All
              </button>
              <span className="text-gray-600">|</span>
              <button
                onClick={onDeselectAll}
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                None
              </button>
              <span className="text-gray-600">|</span>
              <button
                onClick={onToggleSelectMode}
                className="text-gray-400 hover:text-gray-300 transition-colors"
              >
                Scan all
              </button>
            </>
          )}
        </div>
      </div>

      {selectMode && (
        <div className="max-h-72 overflow-y-auto divide-y divide-gray-800">
          {files.map((file) => (
            <label
              key={file.path}
              className="flex items-center gap-3 px-4 py-2 hover:bg-[#1c2128] cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={selectedFiles.has(file.path)}
                onChange={() => onToggleFile(file.path)}
                className="rounded border-gray-600 bg-[#0d1117] text-blue-500 focus:ring-blue-500 focus:ring-offset-0 h-3.5 w-3.5"
              />
              <FileCode className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
              <span className="text-sm text-gray-300 truncate flex-1 font-mono">
                {file.path}
              </span>
              <span className="text-xs text-gray-600 flex-shrink-0">
                {formatSize(file.size)}
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
