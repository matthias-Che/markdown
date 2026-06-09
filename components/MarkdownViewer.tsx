"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { SAMPLE_MARKDOWN } from "@/lib/sampleMarkdown";

type ViewMode = "preview" | "split";

const BOOKMARK_KEY = "md-viewer-bookmark";

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

// Applies a markdown wrapping shortcut to a textarea
function applyWrapping(
  textarea: HTMLTextAreaElement,
  before: string,
  after: string,
  placeholder: string,
  onChange: (v: string) => void
) {
  const { selectionStart: start, selectionEnd: end, value } = textarea;
  const selected = value.slice(start, end) || placeholder;
  const newValue = value.slice(0, start) + before + selected + after + value.slice(end);
  onChange(newValue);
  requestAnimationFrame(() => {
    textarea.focus();
    const cursorStart = start + before.length;
    textarea.setSelectionRange(cursorStart, cursorStart + selected.length);
  });
}

// Applies a line-prefix shortcut (heading, list, etc.)
function applyLinePrefix(
  textarea: HTMLTextAreaElement,
  prefix: string,
  onChange: (v: string) => void
) {
  const { selectionStart, value } = textarea;
  const lineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
  const lineEnd = value.indexOf("\n", selectionStart);
  const end = lineEnd === -1 ? value.length : lineEnd;
  const line = value.slice(lineStart, end);
  const alreadyHas = line.startsWith(prefix);
  const newLine = alreadyHas ? line.slice(prefix.length) : prefix + line;
  const newValue = value.slice(0, lineStart) + newLine + value.slice(end);
  const offset = alreadyHas ? -prefix.length : prefix.length;
  onChange(newValue);
  requestAnimationFrame(() => {
    textarea.focus();
    textarea.setSelectionRange(selectionStart + offset, selectionStart + offset);
  });
}

function useScrollProgress(ref: React.RefObject<HTMLDivElement | null>) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => {
      const max = el.scrollHeight - el.clientHeight;
      setProgress(max > 0 ? el.scrollTop / max : 0);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [ref]);

  return progress;
}

interface ScrollBarProps {
  scrollRef: React.RefObject<HTMLDivElement | null>;
}

function ScrollBar({ scrollRef }: ScrollBarProps) {
  const progress = useScrollProgress(scrollRef);
  const [bookmark, setBookmark] = useState<number | null>(null);
  const [showToast, setShowToast] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load bookmark from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(BOOKMARK_KEY);
    if (saved !== null) setBookmark(parseFloat(saved));
  }, []);

  const saveBookmark = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    const pos = max > 0 ? el.scrollTop / max : 0;
    setBookmark(pos);
    localStorage.setItem(BOOKMARK_KEY, String(pos));
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setShowToast(true);
    toastTimer.current = setTimeout(() => setShowToast(false), 2000);
  }, [scrollRef]);

  const jumpToBookmark = useCallback(() => {
    const el = scrollRef.current;
    if (!el || bookmark === null) return;
    const max = el.scrollHeight - el.clientHeight;
    el.scrollTo({ top: bookmark * max, behavior: "smooth" });
  }, [scrollRef, bookmark]);

  const pct = Math.round(progress * 100);
  const bookmarkPct = bookmark !== null ? Math.round(bookmark * 100) : null;

  return (
    <div className="fixed right-4 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-2 select-none">
      {/* Toast */}
      <div
        className={`absolute -left-32 bg-green-700 text-white text-xs px-3 py-1.5 rounded-lg shadow-lg transition-all duration-200 whitespace-nowrap ${
          showToast ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2 pointer-events-none"
        }`}
      >
        Bookmark saved
      </div>

      {/* Progress track */}
      <div className="relative w-1.5 h-48 bg-slate-200 rounded-full overflow-visible">
        {/* Fill */}
        <div
          className="absolute top-0 left-0 w-full bg-green-500 rounded-full transition-all duration-75"
          style={{ height: `${pct}%` }}
        />
        {/* Bookmark marker on track */}
        {bookmarkPct !== null && (
          <button
            onClick={jumpToBookmark}
            title={`Jump to bookmark (${bookmarkPct}%)`}
            className="absolute -left-1.5 w-4 h-1.5 bg-amber-400 hover:bg-amber-300 rounded-full transition-colors shadow cursor-pointer"
            style={{ top: `calc(${bookmarkPct}% - 3px)` }}
          />
        )}
      </div>

      {/* Percentage label */}
      <span className="text-[10px] font-mono text-slate-400 tabular-nums">{pct}%</span>

      {/* Bookmark button */}
      <button
        onClick={saveBookmark}
        title="Bookmark current position"
        className="w-7 h-7 flex items-center justify-center rounded-full bg-white border border-slate-200 hover:border-amber-400 hover:text-amber-500 text-slate-400 shadow-sm transition-colors"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
          <path d="M2 1h8a1 1 0 011 1v9l-5-3-5 3V2a1 1 0 011-1z" />
        </svg>
      </button>

      {/* Jump to bookmark button — only shown when bookmark exists */}
      {bookmarkPct !== null && (
        <button
          onClick={jumpToBookmark}
          title={`Go to bookmark (${bookmarkPct}%)`}
          className="w-7 h-7 flex items-center justify-center rounded-full bg-amber-400 hover:bg-amber-300 text-white shadow-sm transition-colors"
        >
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 10V2M3 5l3-3 3 3" />
          </svg>
        </button>
      )}
    </div>
  );
}

export default function MarkdownViewer() {
  const [content, setContent] = useState(SAMPLE_MARKDOWN);
  const [fileName, setFileName] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("preview");
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Scroll refs for each pane — used for position preservation and progress bar
  const previewScrollRef = useRef<HTMLDivElement>(null);
  const splitPreviewScrollRef = useRef<HTMLDivElement>(null);

  // When switching modes, mirror the scroll ratio so position is preserved
  const switchMode = useCallback(
    (next: ViewMode) => {
      if (next === viewMode) return;

      const getProgress = (el: HTMLDivElement | null) => {
        if (!el) return 0;
        const max = el.scrollHeight - el.clientHeight;
        return max > 0 ? el.scrollTop / max : 0;
      };

      const applyProgress = (el: HTMLDivElement | null, ratio: number) => {
        if (!el) return;
        requestAnimationFrame(() => {
          const max = el.scrollHeight - el.clientHeight;
          el.scrollTop = ratio * max;
        });
      };

      if (next === "split") {
        const ratio = getProgress(previewScrollRef.current);
        setViewMode(next);
        requestAnimationFrame(() => applyProgress(splitPreviewScrollRef.current, ratio));
      } else {
        const ratio = getProgress(splitPreviewScrollRef.current);
        setViewMode(next);
        requestAnimationFrame(() => applyProgress(previewScrollRef.current, ratio));
      }
    },
    [viewMode]
  );

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
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false);
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

  // Keyboard shortcuts for the editor textarea
  const handleEditorKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const ta = textareaRef.current;
      if (!ta) return;
      const ctrl = e.ctrlKey || e.metaKey;

      if (ctrl && e.key === "b") {
        e.preventDefault();
        applyWrapping(ta, "**", "**", "bold text", setContent);
      } else if (ctrl && e.key === "i") {
        e.preventDefault();
        applyWrapping(ta, "_", "_", "italic text", setContent);
      } else if (ctrl && e.key === "k") {
        e.preventDefault();
        applyWrapping(ta, "[", "](url)", "link text", setContent);
      } else if (ctrl && e.key === "`") {
        e.preventDefault();
        applyWrapping(ta, "`", "`", "code", setContent);
      } else if (ctrl && e.shiftKey && e.key === "X") {
        e.preventDefault();
        applyWrapping(ta, "~~", "~~", "strikethrough", setContent);
      } else if (ctrl && e.shiftKey && e.key === "C") {
        e.preventDefault();
        // Toggle code block
        const { selectionStart, selectionEnd, value } = ta;
        const selected = value.slice(selectionStart, selectionEnd) || "code block";
        const newValue =
          value.slice(0, selectionStart) +
          "```\n" + selected + "\n```" +
          value.slice(selectionEnd);
        setContent(newValue);
        requestAnimationFrame(() => {
          ta.focus();
          ta.setSelectionRange(selectionStart + 4, selectionStart + 4 + selected.length);
        });
      } else if (ctrl && e.key === "1") {
        e.preventDefault();
        applyLinePrefix(ta, "# ", setContent);
      } else if (ctrl && e.key === "2") {
        e.preventDefault();
        applyLinePrefix(ta, "## ", setContent);
      } else if (ctrl && e.key === "3") {
        e.preventDefault();
        applyLinePrefix(ta, "### ", setContent);
      } else if (ctrl && e.shiftKey && e.key === "7") {
        e.preventDefault();
        applyLinePrefix(ta, "1. ", setContent);
      } else if (ctrl && e.shiftKey && e.key === "8") {
        e.preventDefault();
        applyLinePrefix(ta, "- ", setContent);
      } else if (ctrl && e.shiftKey && e.key === "B") {
        e.preventDefault();
        applyLinePrefix(ta, "> ", setContent);
      } else if (e.key === "Tab") {
        // Insert two spaces instead of moving focus
        e.preventDefault();
        const { selectionStart, selectionEnd, value } = ta;
        const newValue = value.slice(0, selectionStart) + "  " + value.slice(selectionEnd);
        setContent(newValue);
        requestAnimationFrame(() => {
          ta.focus();
          ta.setSelectionRange(selectionStart + 2, selectionStart + 2);
        });
      }
    },
    []
  );

  // Decide which scroll ref is active for the progress bar
  const activeScrollRef = viewMode === "preview" ? previewScrollRef : splitPreviewScrollRef;

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
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-200 shadow-sm flex-shrink-0">
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
                onClick={() => switchMode("preview")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  viewMode === "preview"
                    ? "bg-white text-green-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Preview
              </button>
              <button
                onClick={() => switchMode("split")}
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
      <main className="flex-1 flex overflow-hidden relative">
        {viewMode === "preview" ? (
          <div ref={previewScrollRef} className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto px-6 py-12">
              <MarkdownRenderer content={content} />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex overflow-hidden divide-x divide-slate-200">
            {/* Editable raw pane */}
            <div className="w-1/2 flex flex-col bg-slate-900 raw-editor">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-700 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Edit</span>
                  {/* Shortcut hints */}
                  <span className="hidden lg:flex items-center gap-2 text-[10px] text-slate-600">
                    <kbd className="bg-slate-800 px-1 py-0.5 rounded">⌘B</kbd> bold
                    <kbd className="bg-slate-800 px-1 py-0.5 rounded">⌘I</kbd> italic
                    <kbd className="bg-slate-800 px-1 py-0.5 rounded">⌘K</kbd> link
                    <kbd className="bg-slate-800 px-1 py-0.5 rounded">⌘`</kbd> code
                    <kbd className="bg-slate-800 px-1 py-0.5 rounded">⌘1-3</kbd> heading
                  </span>
                </div>
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
                ref={textareaRef}
                className="flex-1 w-full bg-transparent text-slate-300 font-mono text-sm leading-relaxed p-5 resize-none outline-none placeholder-slate-600 raw-editor"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleEditorKeyDown}
                spellCheck={false}
                placeholder="Start typing Markdown here…"
              />
            </div>
            {/* Preview pane */}
            <div ref={splitPreviewScrollRef} className="w-1/2 overflow-y-auto bg-white">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100 sticky top-0 bg-white z-10">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Preview</span>
              </div>
              <div className="px-8 py-8">
                <MarkdownRenderer content={content} />
              </div>
            </div>
          </div>
        )}

        {/* Scroll progress bar + bookmark — tracks the preview pane */}
        <ScrollBar scrollRef={activeScrollRef} />
      </main>

      {/* Footer drop hint */}
      <div className="py-2 text-center text-xs text-slate-400 bg-white border-t border-slate-100 flex-shrink-0">
        Drop a <code className="text-rose-500 bg-rose-50 px-1 py-0.5 rounded">.md</code> file anywhere to load it
      </div>
    </div>
  );
}
