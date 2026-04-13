"use client";

import Editor from "@monaco-editor/react";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
}

const MONACO_LANGUAGE_MAP: Record<string, string> = {
  javascript: "javascript",
  typescript: "typescript",
  python: "python",
  java: "java",
  c: "c",
  cpp: "cpp",
  csharp: "csharp",
  go: "go",
  rust: "rust",
  ruby: "ruby",
  php: "php",
  swift: "swift",
  kotlin: "kotlin",
  html: "html",
  css: "css",
  sql: "sql",
  shell: "shell",
};

export default function CodeEditor({
  value,
  onChange,
  language,
}: CodeEditorProps) {
  return (
    <Editor
      height="100%"
      language={MONACO_LANGUAGE_MAP[language] || "javascript"}
      value={value}
      onChange={(val) => onChange(val || "")}
      theme="vs-dark"
      options={{
        fontSize: 14,
        lineNumbers: "on",
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        padding: { top: 16 },
        wordWrap: "on",
        automaticLayout: true,
        tabSize: 2,
      }}
      loading={
        <div className="flex items-center justify-center h-full text-gray-500">
          Loading editor...
        </div>
      }
    />
  );
}
