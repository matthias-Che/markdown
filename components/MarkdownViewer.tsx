"use client";

import React, { useState, useCallback, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { SAMPLE_MARKDOWN } from "@/lib/sampleMarkdown";

type ViewMode = "preview" | "split";

function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="markdown-body max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex, rehypeHighlight]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export default function MarkdownViewer() {
  const [content, setContent] = useState(SAMPLE_MARKDOWN);
  const [fileName, setFileName] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("preview");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownload = useCallback(() => {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName ?? "document.md";
    a.click();
    URL.revokeObjectURL(url);
  }, [content, fileName]);

  const loadFile = useCallback((file: File) => {
    if (!file.name.endsWith(".md") && !file.name.endsWith(".markdown")) {
      alert("Please upload a Markdown file (.md or .markdown).");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setContent(e.target?.result as string);
      setFileName(file.name);
    };
    reader.readAsText(file);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) loadFile(file);
      e.target.value = "";
    },
    [loadFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) loadFile(file);
    },
    [loadFile]
  );

  return (
    <div
      className="h-screen flex flex-col"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-50 bg-green-900/20 backdrop-blur-sm flex items-center justify-center pointer-events-none">
          <div className="bg-white rounded-2xl shadow-2xl border-2 border-dashed border-green-500 px-16 py-12 text-center">
            <div className="text-5xl mb-3">📄</div>
            <p className="text-xl font-semibold text-green-700">Drop your Markdown file</p>
            <p className="text-sm text-slate-500 mt-1">Release to load instantly</p>
          </div>
        </div>
      )}

      {/* Navbar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-200 shadow-sm">
        <div className="max-w-screen-xl mx-auto px-5 h-14 flex items-center gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-7 h-7 rounded-lg bg-green-700 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="2" width="12" height="1.5" rx="0.75" fill="white" />
                <rect x="1" y="5.25" width="8" height="1.5" rx="0.75" fill="white" />
                <rect x="1" y="8.5" width="10" height="1.5" rx="0.75" fill="white" />
                <rect x="1" y="11" width="6" height="1.5" rx="0.75" fill="white" />
              </svg>
            </div>
            <span className="font-semibold text-slate-800 tracking-tight text-sm">
              Markdown<span className="text-green-700">Viewer</span>
            </span>
          </div>

          {fileName && (
            <span className="hidden sm:inline text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full truncate max-w-[200px]">
              {fileName}
            </span>
          )}

          <div className="flex items-center gap-2 ml-auto">
            {/* View mode toggle */}
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5 gap-0.5">
              <button
                onClick={() => setViewMode("preview")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  viewMode === "preview"
                    ? "bg-white text-green-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Preview
              </button>
              <button
                onClick={() => setViewMode("split")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  viewMode === "split"
                    ? "bg-white text-green-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Split View
              </button>
            </div>

            {/* Upload button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 bg-green-700 hover:bg-green-800 text-white text-xs font-medium px-3.5 py-2 rounded-lg transition-colors shadow-sm"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 1v7M3 4l3-3 3 3M1 9v1a1 1 0 001 1h8a1 1 0 001-1V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Upload File
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".md,.markdown"
              className="hidden"
              onChange={handleFileInput}
            />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex overflow-hidden">
        {viewMode === "preview" ? (
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto px-6 py-12">
              <MarkdownRenderer content={content} />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex overflow-hidden divide-x divide-slate-200">
            {/* Editable raw pane */}
            <div className="w-1/2 flex flex-col bg-slate-900 raw-editor">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-700 sticky top-0 bg-slate-900 z-10 flex-shrink-0">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Edit</span>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 bg-green-700 hover:bg-green-600 text-white text-xs font-medium px-3 py-1.5 rounded-md transition-colors"
                >
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                    <path d="M6 1v7M3 8l3 3 3-3M1 10v1a1 1 0 001 1h8a1 1 0 001-1v-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Download
                </button>
              </div>
              <textarea
                className="flex-1 w-full bg-transparent text-slate-300 font-mono text-sm leading-relaxed p-5 resize-none outline-none placeholder-slate-600 raw-editor"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                spellCheck={false}
                placeholder="Start typing Markdown here…"
              />
            </div>
            {/* Preview pane */}
            <div className="w-1/2 overflow-y-auto bg-white">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100 sticky top-0 bg-white z-10">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Preview</span>
              </div>
              <div className="px-8 py-8">
                <MarkdownRenderer content={content} />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer drop hint */}
      <div className="py-2 text-center text-xs text-slate-400 bg-white border-t border-slate-100">
        Drop a <code className="text-rose-500 bg-rose-50 px-1 py-0.5 rounded">.md</code> file anywhere to load it
      </div>
    </div>
  );
}
