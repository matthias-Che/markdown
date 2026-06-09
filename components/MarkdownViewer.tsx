"use client";

import React, {
  useState, useCallback, useRef, useEffect, useReducer, CSSProperties,
} from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { SAMPLE_MARKDOWN } from "@/lib/sampleMarkdown";
import themes, { themeMap, TOP_THEME_IDS, type Theme } from "@/lib/themes";

type ViewMode = "preview" | "split";

// ── LocalStorage keys ────────────────────────────────────────────────────────
const LS_CONTENT   = "md-content";
const LS_FILENAME  = "md-filename";
const LS_VIEW_MODE = "md-view-mode";
const LS_THEME     = "md-theme";
const LS_SCROLL    = "md-scroll-ratio";
const LS_BOOKMARK  = "md-viewer-bookmark";

function lsGet(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}
function lsSet(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch {}
}

// ── Markdown renderer ────────────────────────────────────────────────────────
function MarkdownRenderer({ content, themeVars }: { content: string; themeVars: CSSProperties }) {
  return (
    <div className="markdown-body max-w-none" style={themeVars}>
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex, rehypeHighlight]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

// ── Editor helpers ───────────────────────────────────────────────────────────
type SetContent = (v: string, immediate?: boolean) => void;

function applyWrapping(
  ta: HTMLTextAreaElement, before: string, after: string,
  placeholder: string, onChange: SetContent,
) {
  const { selectionStart: s, selectionEnd: e, value } = ta;
  const selected = value.slice(s, e) || placeholder;
  const next = value.slice(0, s) + before + selected + after + value.slice(e);
  onChange(next, true);
  requestAnimationFrame(() => {
    ta.focus();
    ta.setSelectionRange(s + before.length, s + before.length + selected.length);
  });
}

function applyLinePrefix(
  ta: HTMLTextAreaElement, prefix: string, onChange: SetContent,
) {
  const { selectionStart, value } = ta;
  const lineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
  const lineEnd = value.indexOf("\n", selectionStart);
  const end = lineEnd === -1 ? value.length : lineEnd;
  const line = value.slice(lineStart, end);
  const has = line.startsWith(prefix);
  const next = value.slice(0, lineStart) + (has ? line.slice(prefix.length) : prefix + line) + value.slice(end);
  const offset = has ? -prefix.length : prefix.length;
  onChange(next, true);
  requestAnimationFrame(() => {
    ta.focus();
    ta.setSelectionRange(selectionStart + offset, selectionStart + offset);
  });
}

// ── History reducer ──────────────────────────────────────────────────────────
interface HistoryState { stack: string[]; index: number; }
type HistoryAction = { type: "push"; value: string } | { type: "undo" } | { type: "redo" };

function historyReducer(s: HistoryState, a: HistoryAction): HistoryState {
  switch (a.type) {
    case "push": {
      if (s.stack[s.index] === a.value) return s;
      const next = s.stack.slice(0, s.index + 1);
      next.push(a.value);
      const trimmed = next.length > 500 ? next.slice(next.length - 500) : next;
      return { stack: trimmed, index: trimmed.length - 1 };
    }
    case "undo": return { ...s, index: Math.max(0, s.index - 1) };
    case "redo": return { ...s, index: Math.min(s.stack.length - 1, s.index + 1) };
  }
}

// ── Scroll progress hook ─────────────────────────────────────────────────────
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

// ── Scroll bar + bookmark ─────────────────────────────────────────────────────
function ScrollBar({ scrollRef }: { scrollRef: React.RefObject<HTMLDivElement | null> }) {
  const progress = useScrollProgress(scrollRef);
  const [bookmark, setBookmark] = useState<number | null>(null);
  const [showToast, setShowToast] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const saved = lsGet(LS_BOOKMARK);
    if (saved !== null) setBookmark(parseFloat(saved));
  }, []);

  const saveBookmark = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    const pos = max > 0 ? el.scrollTop / max : 0;
    setBookmark(pos);
    lsSet(LS_BOOKMARK, String(pos));
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
      <div className={`absolute -left-32 bg-green-700 text-white text-xs px-3 py-1.5 rounded-lg shadow-lg transition-all duration-200 whitespace-nowrap ${showToast ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
        Bookmark saved
      </div>
      <div className="relative w-1.5 h-48 bg-slate-200 rounded-full overflow-visible">
        <div className="absolute top-0 left-0 w-full bg-green-500 rounded-full transition-all duration-75" style={{ height: `${pct}%` }} />
        {bookmarkPct !== null && (
          <button onClick={jumpToBookmark} title={`Jump to bookmark (${bookmarkPct}%)`}
            className="absolute -left-1.5 w-4 h-1.5 bg-amber-400 hover:bg-amber-300 rounded-full transition-colors shadow cursor-pointer"
            style={{ top: `calc(${bookmarkPct}% - 3px)` }} />
        )}
      </div>
      <span className="text-[10px] font-mono text-slate-400 tabular-nums">{pct}%</span>
      <button onClick={saveBookmark} title="Bookmark current position"
        className="w-7 h-7 flex items-center justify-center rounded-full bg-white border border-slate-200 hover:border-amber-400 hover:text-amber-500 text-slate-400 shadow-sm transition-colors">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
          <path d="M2 1h8a1 1 0 011 1v9l-5-3-5 3V2a1 1 0 011-1z" />
        </svg>
      </button>
      {bookmarkPct !== null && (
        <button onClick={jumpToBookmark} title={`Go to bookmark (${bookmarkPct}%)`}
          className="w-7 h-7 flex items-center justify-center rounded-full bg-amber-400 hover:bg-amber-300 text-white shadow-sm transition-colors">
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 10V2M3 5l3-3 3 3" />
          </svg>
        </button>
      )}
    </div>
  );
}

// ── Theme swatch ─────────────────────────────────────────────────────────────
function ThemeSwatch({ theme, active, onClick }: { theme: Theme; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={theme.name}
      className={`group flex flex-col items-center gap-1 p-1.5 rounded-lg transition-all ${active ? "ring-2 ring-offset-1 ring-slate-400 bg-slate-100" : "hover:bg-slate-50"}`}
    >
      <div className="flex gap-0.5">
        <span className="w-4 h-4 rounded-sm shadow-sm" style={{ background: theme.h1Color }} />
        <span className="w-4 h-4 rounded-sm shadow-sm" style={{ background: theme.accentColor }} />
        <span className="w-4 h-4 rounded-sm shadow-sm" style={{ background: theme.codeFg }} />
      </div>
      <span className="text-[9px] text-slate-500 leading-none whitespace-nowrap">{theme.name}</span>
    </button>
  );
}

// ── Theme picker panel ────────────────────────────────────────────────────────
function ThemePicker({ activeId, onSelect, onClose }: {
  activeId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const topThemes = TOP_THEME_IDS.map(id => themeMap[id]).filter(Boolean);
  const restThemes = themes.filter(t => !TOP_THEME_IDS.includes(t.id));
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div ref={ref}
      className="absolute right-0 top-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl p-3 z-50 w-72"
    >
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1">Theme</p>

      {/* Top 5 */}
      <div className="flex gap-1 flex-wrap">
        {topThemes.map(t => (
          <ThemeSwatch key={t.id} theme={t} active={activeId === t.id} onClick={() => onSelect(t.id)} />
        ))}
      </div>

      {/* Expand to all 50 */}
      {!expanded ? (
        <button onClick={() => setExpanded(true)}
          className="mt-2 w-full text-[11px] text-slate-500 hover:text-slate-700 py-1.5 rounded-lg hover:bg-slate-50 transition-colors border border-dashed border-slate-200">
          Show all {themes.length} themes ▾
        </button>
      ) : (
        <>
          <div className="mt-2 border-t border-slate-100 pt-2 max-h-72 overflow-y-auto">
            <div className="grid grid-cols-5 gap-0.5">
              {restThemes.map(t => (
                <ThemeSwatch key={t.id} theme={t} active={activeId === t.id} onClick={() => onSelect(t.id)} />
              ))}
            </div>
          </div>
          <button onClick={() => setExpanded(false)}
            className="mt-2 w-full text-[11px] text-slate-400 hover:text-slate-600 py-1 transition-colors">
            Show less ▴
          </button>
        </>
      )}
    </div>
  );
}

// ── Build CSS variable object from a Theme ────────────────────────────────────
function themeToVars(t: Theme): CSSProperties {
  return {
    "--md-h1": t.h1Color,
    "--md-accent": t.accentColor,
    "--md-border-light": t.borderLight,
    "--md-border-lighter": t.borderLighter,
    "--md-bg-tint": t.bgTint,
    "--md-code-fg": t.codeFg,
    "--md-code-bg": t.codeBg,
    "--md-code-border": t.codeBorder,
  } as CSSProperties;
}

// ── Main component ────────────────────────────────────────────────────────────
export default function MarkdownViewer() {
  // ── State ─────────────────────────────────────────────────────────────────
  const initialContent = (() => { try { return lsGet(LS_CONTENT) ?? SAMPLE_MARKDOWN; } catch { return SAMPLE_MARKDOWN; } })();

  const [history, dispatch] = useReducer(historyReducer, { stack: [initialContent], index: 0 });
  const content = history.stack[history.index];
  const historyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setContent = useCallback((value: string, immediate = false) => {
    dispatch({ type: "push", value });
    if (!immediate) {
      if (historyTimer.current) clearTimeout(historyTimer.current);
      historyTimer.current = setTimeout(() => dispatch({ type: "push", value }), 500);
    }
  }, []);

  const [fileName, setFileName] = useState<string | null>(() => lsGet(LS_FILENAME));
  const [viewMode, setViewMode] = useState<ViewMode>(() => (lsGet(LS_VIEW_MODE) as ViewMode) ?? "preview");
  const [themeId, setThemeId] = useState<string>(() => lsGet(LS_THEME) ?? "forest");
  const [isDragging, setIsDragging] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);

  const activeTheme = themeMap[themeId] ?? themeMap["forest"];
  const themeVars = themeToVars(activeTheme);

  // ── Refs ──────────────────────────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewScrollRef = useRef<HTMLDivElement>(null);
  const splitPreviewScrollRef = useRef<HTMLDivElement>(null);

  // ── Persist content to localStorage (debounced) ───────────────────────────
  useEffect(() => {
    const t = setTimeout(() => lsSet(LS_CONTENT, content), 500);
    return () => clearTimeout(t);
  }, [content]);

  // ── Persist scroll ratio ──────────────────────────────────────────────────
  const activeScrollRef = viewMode === "preview" ? previewScrollRef : splitPreviewScrollRef;

  useEffect(() => {
    const el = activeScrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const max = el.scrollHeight - el.clientHeight;
      if (max > 0) lsSet(LS_SCROLL, String(el.scrollTop / max));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [activeScrollRef, viewMode]);

  // ── Restore scroll position on first mount (after render) ────────────────
  const scrollRestored = useRef(false);
  useEffect(() => {
    if (scrollRestored.current) return;
    const ratio = parseFloat(lsGet(LS_SCROLL) ?? "0");
    if (!ratio) return;
    const el = activeScrollRef.current;
    if (!el) return;
    // Wait for layout to settle
    const t = setTimeout(() => {
      const max = el.scrollHeight - el.clientHeight;
      el.scrollTop = ratio * max;
      scrollRestored.current = true;
    }, 120);
    return () => clearTimeout(t);
  });

  // ── Persist other settings ────────────────────────────────────────────────
  useEffect(() => { lsSet(LS_THEME, themeId); }, [themeId]);
  useEffect(() => { lsSet(LS_VIEW_MODE, viewMode); }, [viewMode]);
  useEffect(() => { if (fileName) lsSet(LS_FILENAME, fileName); }, [fileName]);

  // ── Switch view mode (preserving scroll ratio) ────────────────────────────
  const switchMode = useCallback((next: ViewMode) => {
    if (next === viewMode) return;
    const getRatio = (el: HTMLDivElement | null) => {
      if (!el) return 0;
      const max = el.scrollHeight - el.clientHeight;
      return max > 0 ? el.scrollTop / max : 0;
    };
    const applyRatio = (el: HTMLDivElement | null, r: number) => {
      if (!el) return;
      requestAnimationFrame(() => { el.scrollTop = r * (el.scrollHeight - el.clientHeight); });
    };
    if (next === "split") {
      const r = getRatio(previewScrollRef.current);
      setViewMode(next);
      requestAnimationFrame(() => applyRatio(splitPreviewScrollRef.current, r));
    } else {
      const r = getRatio(splitPreviewScrollRef.current);
      setViewMode(next);
      requestAnimationFrame(() => applyRatio(previewScrollRef.current, r));
    }
  }, [viewMode]);

  // ── Download ──────────────────────────────────────────────────────────────
  const handleDownload = useCallback(() => {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName ?? "document.md";
    a.click();
    URL.revokeObjectURL(url);
  }, [content, fileName]);

  // ── File loading ──────────────────────────────────────────────────────────
  const loadFile = useCallback((file: File) => {
    if (!file.name.endsWith(".md") && !file.name.endsWith(".markdown")) {
      alert("Please upload a Markdown file (.md or .markdown).");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      dispatch({ type: "push", value: text });
      setFileName(file.name);
      lsSet(LS_CONTENT, text);
    };
    reader.readAsText(file);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadFile(file);
    e.target.value = "";
  }, [loadFile]);

  // ── Drag & drop ───────────────────────────────────────────────────────────
  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false);
  }, []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) loadFile(file);
  }, [loadFile]);

  // ── Editor keyboard shortcuts ─────────────────────────────────────────────
  const handleEditorKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const ctrl = e.ctrlKey || e.metaKey;

    if (ctrl && e.key === "z") {
      e.preventDefault();
      dispatch(e.shiftKey ? { type: "redo" } : { type: "undo" });
      return;
    }
    if (ctrl && e.key === "y") { e.preventDefault(); dispatch({ type: "redo" }); return; }
    if (ctrl && e.key === "b") { e.preventDefault(); applyWrapping(ta, "**", "**", "bold text", setContent); }
    else if (ctrl && e.key === "i") { e.preventDefault(); applyWrapping(ta, "_", "_", "italic text", setContent); }
    else if (ctrl && e.key === "k") { e.preventDefault(); applyWrapping(ta, "[", "](url)", "link text", setContent); }
    else if (ctrl && e.key === "`") { e.preventDefault(); applyWrapping(ta, "`", "`", "code", setContent); }
    else if (ctrl && e.shiftKey && e.key === "X") { e.preventDefault(); applyWrapping(ta, "~~", "~~", "strikethrough", setContent); }
    else if (ctrl && e.shiftKey && e.key === "C") {
      e.preventDefault();
      const { selectionStart, selectionEnd, value } = ta;
      const sel = value.slice(selectionStart, selectionEnd) || "code block";
      setContent(value.slice(0, selectionStart) + "```\n" + sel + "\n```" + value.slice(selectionEnd), true);
      requestAnimationFrame(() => { ta.focus(); ta.setSelectionRange(selectionStart + 4, selectionStart + 4 + sel.length); });
    }
    else if (ctrl && e.key === "1") { e.preventDefault(); applyLinePrefix(ta, "# ", setContent); }
    else if (ctrl && e.key === "2") { e.preventDefault(); applyLinePrefix(ta, "## ", setContent); }
    else if (ctrl && e.key === "3") { e.preventDefault(); applyLinePrefix(ta, "### ", setContent); }
    else if (ctrl && e.shiftKey && e.key === "7") { e.preventDefault(); applyLinePrefix(ta, "1. ", setContent); }
    else if (ctrl && e.shiftKey && e.key === "8") { e.preventDefault(); applyLinePrefix(ta, "- ", setContent); }
    else if (ctrl && e.shiftKey && e.key === "B") { e.preventDefault(); applyLinePrefix(ta, "> ", setContent); }
    else if (e.key === "Tab") {
      e.preventDefault();
      const { selectionStart, selectionEnd, value } = ta;
      setContent(value.slice(0, selectionStart) + "  " + value.slice(selectionEnd), true);
      requestAnimationFrame(() => { ta.focus(); ta.setSelectionRange(selectionStart + 2, selectionStart + 2); });
    }
  }, [setContent]);

  // ── Page bg from theme ────────────────────────────────────────────────────
  const pageBg = activeTheme.pageBg ?? "#f8fafc";

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className="h-screen flex flex-col"
      style={{ background: pageBg }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-50 bg-black/10 backdrop-blur-sm flex items-center justify-center pointer-events-none">
          <div className="bg-white rounded-2xl shadow-2xl border-2 border-dashed border-slate-400 px-16 py-12 text-center">
            <div className="text-5xl mb-3">📄</div>
            <p className="text-xl font-semibold text-slate-700">Drop your Markdown file</p>
            <p className="text-sm text-slate-500 mt-1">Release to load instantly</p>
          </div>
        </div>
      )}

      {/* Navbar */}
      <header className="flex-shrink-0 sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-200 shadow-sm">
        <div className="max-w-screen-xl mx-auto px-5 h-14 flex items-center gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: activeTheme.h1Color }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="2" width="12" height="1.5" rx="0.75" fill="white" />
                <rect x="1" y="5.25" width="8" height="1.5" rx="0.75" fill="white" />
                <rect x="1" y="8.5" width="10" height="1.5" rx="0.75" fill="white" />
                <rect x="1" y="11" width="6" height="1.5" rx="0.75" fill="white" />
              </svg>
            </div>
            <span className="font-semibold text-slate-800 tracking-tight text-sm">
              Markdown<span style={{ color: activeTheme.h1Color }}>Viewer</span>
            </span>
          </div>

          {fileName && (
            <span className="hidden sm:inline text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full truncate max-w-[180px]">
              {fileName}
            </span>
          )}

          <div className="flex items-center gap-2 ml-auto">
            {/* View mode toggle */}
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5 gap-0.5">
              <button onClick={() => switchMode("preview")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === "preview" ? "bg-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                style={viewMode === "preview" ? { color: activeTheme.h1Color } : {}}>
                Preview
              </button>
              <button onClick={() => switchMode("split")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === "split" ? "bg-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                style={viewMode === "split" ? { color: activeTheme.h1Color } : {}}>
                Split View
              </button>
            </div>

            {/* Theme picker trigger */}
            <div className="relative">
              <button
                onClick={() => setShowThemePicker(v => !v)}
                title="Change theme"
                className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-all ${showThemePicker ? "border-slate-300 bg-slate-100" : "border-slate-200 hover:border-slate-300 bg-white"}`}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="2.5" fill={activeTheme.accentColor} />
                  <circle cx="7" cy="2" r="1.5" fill={activeTheme.h1Color} />
                  <circle cx="11.33" cy="4.5" r="1.5" fill={activeTheme.codeFg} />
                  <circle cx="11.33" cy="9.5" r="1.5" fill={activeTheme.accentColor} />
                  <circle cx="7" cy="12" r="1.5" fill={activeTheme.h1Color} />
                  <circle cx="2.67" cy="9.5" r="1.5" fill={activeTheme.codeFg} />
                  <circle cx="2.67" cy="4.5" r="1.5" fill={activeTheme.accentColor} />
                </svg>
              </button>
              {showThemePicker && (
                <ThemePicker
                  activeId={themeId}
                  onSelect={(id) => { setThemeId(id); setShowThemePicker(false); }}
                  onClose={() => setShowThemePicker(false)}
                />
              )}
            </div>

            {/* Upload */}
            <button onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 text-white text-xs font-medium px-3.5 py-2 rounded-lg transition-colors shadow-sm"
              style={{ background: activeTheme.h1Color }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 1v7M3 4l3-3 3 3M1 9v1a1 1 0 001 1h8a1 1 0 001-1V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Upload File
            </button>
            <input ref={fileInputRef} type="file" accept=".md,.markdown" className="hidden" onChange={handleFileInput} />
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex overflow-hidden relative">
        {viewMode === "preview" ? (
          <div ref={previewScrollRef} className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto px-6 py-12">
              <MarkdownRenderer content={content} themeVars={themeVars} />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex overflow-hidden divide-x divide-slate-200">
            {/* Edit pane */}
            <div className="w-1/2 flex flex-col bg-slate-900 raw-editor">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-700 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Edit</span>
                  <span className="hidden lg:flex items-center gap-2 text-[10px] text-slate-600">
                    <kbd className="bg-slate-800 px-1 py-0.5 rounded">⌘B</kbd> bold
                    <kbd className="bg-slate-800 px-1 py-0.5 rounded">⌘I</kbd> italic
                    <kbd className="bg-slate-800 px-1 py-0.5 rounded">⌘K</kbd> link
                    <kbd className="bg-slate-800 px-1 py-0.5 rounded">⌘`</kbd> code
                    <kbd className="bg-slate-800 px-1 py-0.5 rounded">⌘Z</kbd> undo
                    <kbd className="bg-slate-800 px-1 py-0.5 rounded">⌘1-3</kbd> heading
                  </span>
                </div>
                <button onClick={handleDownload}
                  className="flex items-center gap-1.5 text-white text-xs font-medium px-3 py-1.5 rounded-md transition-colors"
                  style={{ background: activeTheme.accentColor }}>
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
                <MarkdownRenderer content={content} themeVars={themeVars} />
              </div>
            </div>
          </div>
        )}
        <ScrollBar scrollRef={activeScrollRef} />
      </main>

      {/* Footer */}
      <div className="flex-shrink-0 py-2 text-center text-xs text-slate-400 bg-white border-t border-slate-100">
        Drop a <code className="text-rose-500 bg-rose-50 px-1 py-0.5 rounded">.md</code> file anywhere to load it
      </div>
    </div>
  );
}
