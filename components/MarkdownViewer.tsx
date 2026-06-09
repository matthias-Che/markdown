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
import { generateThemeFromPrompt } from "@/lib/generateTheme";

type ViewMode = "preview" | "split" | "compare";

// ── Tab data ──────────────────────────────────────────────────────────────────
interface TabData {
  id: string;
  label: string;
  fileName: string | null;
  content: string;
  bookmark: number | null;
  scrollRatio: number;
  color?: string | null;
}

function makeTab(overrides: Partial<TabData> = {}): TabData {
  return {
    id: `tab-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    label: "Untitled",
    fileName: null,
    content: SAMPLE_MARKDOWN,
    bookmark: null,
    scrollRatio: 0,
    ...overrides,
  };
}

// ── LocalStorage ──────────────────────────────────────────────────────────────
const LS_TABS       = "md-tabs";
const LS_ACTIVE_TAB = "md-active-tab";
const LS_VIEW_MODE  = "md-view-mode";
const LS_THEME      = "md-theme";

function lsGet(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}
function lsSet(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch {}
}
function loadTabs(): TabData[] {
  try {
    const raw = lsGet(LS_TABS);
    if (raw) {
      const parsed = JSON.parse(raw) as TabData[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return [makeTab({ label: "Welcome" })];
}

// ── History reducer ───────────────────────────────────────────────────────────
interface HistoryState { stack: string[]; index: number; }
type HistoryAction =
  | { type: "push"; value: string }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "init"; state: HistoryState };

function historyReducer(s: HistoryState, a: HistoryAction): HistoryState {
  switch (a.type) {
    case "init": return a.state;
    case "push": {
      if (s.stack[s.index] === a.value) return s;
      const next = s.stack.slice(0, s.index + 1);
      next.push(a.value);
      const t = next.length > 500 ? next.slice(next.length - 500) : next;
      return { stack: t, index: t.length - 1 };
    }
    case "undo": return { ...s, index: Math.max(0, s.index - 1) };
    case "redo": return { ...s, index: Math.min(s.stack.length - 1, s.index + 1) };
  }
}

// ── CSS vars from theme ───────────────────────────────────────────────────────
function themeToVars(t: Theme): CSSProperties {
  return {
    "--md-h1": t.h1Color, "--md-accent": t.accentColor,
    "--md-border-light": t.borderLight, "--md-border-lighter": t.borderLighter,
    "--md-bg-tint": t.bgTint, "--md-code-fg": t.codeFg,
    "--md-code-bg": t.codeBg, "--md-code-border": t.codeBorder,
  } as CSSProperties;
}

// ── Markdown renderer ─────────────────────────────────────────────────────────
function MarkdownRenderer({ content, themeVars }: { content: string; themeVars: CSSProperties }) {
  return (
    <div className="markdown-body max-w-none" style={themeVars}>
      <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex, rehypeHighlight]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}

// ── Editor helpers ────────────────────────────────────────────────────────────
type SetContent = (v: string, immediate?: boolean) => void;

function applyWrapping(ta: HTMLTextAreaElement, before: string, after: string, placeholder: string, fn: SetContent) {
  const { selectionStart: s, selectionEnd: e, value } = ta;
  const sel = value.slice(s, e) || placeholder;
  fn(value.slice(0, s) + before + sel + after + value.slice(e), true);
  requestAnimationFrame(() => { ta.focus(); ta.setSelectionRange(s + before.length, s + before.length + sel.length); });
}

function applyLinePrefix(ta: HTMLTextAreaElement, prefix: string, fn: SetContent) {
  const { selectionStart, value } = ta;
  const ls = value.lastIndexOf("\n", selectionStart - 1) + 1;
  const le = value.indexOf("\n", selectionStart);
  const end = le === -1 ? value.length : le;
  const line = value.slice(ls, end);
  const has = line.startsWith(prefix);
  const off = has ? -prefix.length : prefix.length;
  fn(value.slice(0, ls) + (has ? line.slice(prefix.length) : prefix + line) + value.slice(end), true);
  requestAnimationFrame(() => { ta.focus(); ta.setSelectionRange(selectionStart + off, selectionStart + off); });
}

// ── Scroll progress hook ──────────────────────────────────────────────────────
function useScrollProgress(ref: React.RefObject<HTMLDivElement | null>) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fn = () => {
      const max = el.scrollHeight - el.clientHeight;
      setProgress(max > 0 ? el.scrollTop / max : 0);
    };
    el.addEventListener("scroll", fn, { passive: true });
    return () => el.removeEventListener("scroll", fn);
  }, [ref]);
  return progress;
}

// ── Dynamic progress color (scrolls through hue spectrum) ─────────────────────
function progressColor(p: number): string {
  // 0 → cyan-blue, 0.4 → violet, 0.7 → rose, 1 → amber
  const stops = [
    { at: 0,    h: 210, s: 90, l: 58 },
    { at: 0.35, h: 262, s: 85, l: 60 },
    { at: 0.70, h: 336, s: 82, l: 58 },
    { at: 1,    h: 38,  s: 90, l: 52 },
  ];
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i], b = stops[i + 1];
    if (p >= a.at && p <= b.at) {
      const t = (p - a.at) / (b.at - a.at);
      return `hsl(${Math.round(a.h + (b.h - a.h) * t)},${Math.round(a.s + (b.s - a.s) * t)}%,${Math.round(a.l + (b.l - a.l) * t)}%)`;
    }
  }
  return `hsl(38,90%,52%)`;
}

// ── Scroll bar + bookmark ─────────────────────────────────────────────────────
function ScrollBar({ scrollRef, bookmark, onSaveBookmark, accentColor }: {
  scrollRef: React.RefObject<HTMLDivElement | null>;
  bookmark: number | null;
  onSaveBookmark: (ratio: number) => void;
  accentColor: string;
}) {
  const progress = useScrollProgress(scrollRef);
  const [showToast, setShowToast] = useState(false);
  const [hovered, setHovered] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    onSaveBookmark(max > 0 ? el.scrollTop / max : 0);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setShowToast(true);
    toastTimer.current = setTimeout(() => setShowToast(false), 2000);
  }, [scrollRef, onSaveBookmark]);

  const jump = useCallback(() => {
    const el = scrollRef.current;
    if (!el || bookmark === null) return;
    el.scrollTo({ top: bookmark * (el.scrollHeight - el.clientHeight), behavior: "smooth" });
  }, [scrollRef, bookmark]);

  const pct = Math.round(progress * 100);
  const bookmarkPct = bookmark !== null ? Math.round(bookmark * 100) : null;
  const color = progressColor(progress);

  return (
    <div
      className="fixed right-3 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-2 select-none"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Toast */}
      <div className={`absolute -left-28 bg-slate-800/90 backdrop-blur text-white text-xs px-3 py-1.5 rounded-lg shadow-lg transition-all duration-200 whitespace-nowrap ${showToast ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2 pointer-events-none"}`}>
        Bookmark saved ✦
      </div>

      {/* Percentage pill — visible on hover */}
      <div className={`transition-all duration-200 text-[10px] font-bold tabular-nums px-2 py-0.5 rounded-full shadow-sm text-white ${hovered ? "opacity-100" : "opacity-0"}`}
        style={{ background: color }}>
        {pct}%
      </div>

      {/* Track + fill */}
      <div className="relative w-2 h-44 bg-slate-200/70 rounded-full overflow-visible cursor-pointer" onClick={(e) => {
        const el = scrollRef.current;
        const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
        const ratio = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
        if (el) el.scrollTo({ top: ratio * (el.scrollHeight - el.clientHeight), behavior: "smooth" });
      }}>
        {/* Gradient fill */}
        <div
          className="absolute top-0 left-0 w-full rounded-full transition-all duration-75"
          style={{
            height: `${pct}%`,
            background: `linear-gradient(to bottom, hsl(210,90%,58%), ${color})`,
            boxShadow: `0 0 6px 1px ${color}55`,
          }}
        />

        {/* Glowing orb at the tip */}
        {pct > 0 && pct < 100 && (
          <div
            className="progress-orb absolute -left-0.5 w-3 h-3 rounded-full border-2 border-white shadow-lg transition-all duration-75"
            style={{
              top: `calc(${pct}% - 6px)`,
              background: color,
              ["--orb-color" as string]: color,
            }}
          />
        )}

        {/* Bookmark marker */}
        {bookmarkPct !== null && (
          <button
            onClick={(e) => { e.stopPropagation(); jump(); }}
            title={`Jump to bookmark (${bookmarkPct}%)`}
            className="absolute -left-1.5 w-5 h-2.5 rounded-full shadow-sm transition-all hover:scale-125 cursor-pointer border border-white"
            style={{
              top: `calc(${bookmarkPct}% - 5px)`,
              background: "linear-gradient(135deg, #fbbf24, #f59e0b)",
              boxShadow: "0 0 6px 1px #fbbf2460",
            }}
          />
        )}
      </div>

      {/* Save bookmark button */}
      <button
        onClick={save}
        title="Bookmark current position"
        className={`w-7 h-7 flex items-center justify-center rounded-full border transition-all duration-200 shadow-sm ${hovered ? "opacity-100 scale-100" : "opacity-60 scale-90"}`}
        style={{
          background: "rgba(255,255,255,0.9)",
          backdropFilter: "blur(8px)",
          borderColor: hovered ? color : "#e2e8f0",
          color: hovered ? color : "#94a3b8",
        }}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
          <path d="M2 1h8a1 1 0 011 1v9l-5-3-5 3V2a1 1 0 011-1z" />
        </svg>
      </button>

      {/* Jump to bookmark button */}
      {bookmarkPct !== null && (
        <button
          onClick={jump}
          title={`Go to bookmark (${bookmarkPct}%)`}
          className={`w-7 h-7 flex items-center justify-center rounded-full text-white shadow-sm transition-all duration-200 ${hovered ? "opacity-100 scale-100" : "opacity-60 scale-90"}`}
          style={{ background: "linear-gradient(135deg, #fbbf24, #f59e0b)", boxShadow: "0 2px 8px #fbbf2450" }}
        >
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 10V2M3 5l3-3 3 3" />
          </svg>
        </button>
      )}
    </div>
  );
}

// ── Compare pane ──────────────────────────────────────────────────────────────
function ComparePane({ tabId, tabs, themeVars, accentColor, onChangeTab, onClose }: {
  tabId: string;
  tabs: TabData[];
  themeVars: CSSProperties;
  accentColor: string;
  onChangeTab: (id: string) => void;
  onClose?: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const tab = tabs.find(t => t.id === tabId) ?? tabs[0];

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-w-0 border-r border-slate-200 last:border-r-0">
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 bg-slate-50 flex-shrink-0">
        <div ref={menuRef} className="relative">
          <button onClick={() => setOpen(v => !v)}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 transition-colors">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: accentColor }} />
            <span className="max-w-[140px] truncate">{tab.label}</span>
            <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M1.5 3l3 3 3-3" />
            </svg>
          </button>
          {open && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-30 min-w-[160px]">
              {tabs.map(t => (
                <button key={t.id} onClick={() => { onChangeTab(t.id); setOpen(false); }}
                  className={`w-full text-left flex items-center gap-2 px-3 py-1.5 text-xs transition-colors ${t.id === tabId ? "font-semibold text-slate-900 bg-slate-50" : "text-slate-600 hover:bg-slate-50"}`}>
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: t.id === tabId ? accentColor : "#cbd5e1" }} />
                  <span className="truncate">{t.label}</span>
                  {t.id === tabId && (
                    <svg className="ml-auto flex-shrink-0" width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5l2.5 2.5 4-4" stroke={accentColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        {onClose && (
          <button onClick={onClose} title="Remove pane"
            className="w-5 h-5 flex items-center justify-center rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
            <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M1 1l7 7M8 1L1 8" />
            </svg>
          </button>
        )}
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto scroll-smooth bg-white">
        <div className="px-8 py-8 max-w-2xl mx-auto">
          <MarkdownRenderer content={tab.content} themeVars={themeVars} />
        </div>
      </div>
    </div>
  );
}

// ── Tab color palette ─────────────────────────────────────────────────────────
const TAB_COLORS: (string | null)[] = [
  null,
  "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16",
  "#22c55e", "#14b8a6", "#06b6d4", "#3b82f6", "#6366f1",
  "#8b5cf6", "#a855f7", "#ec4899", "#f43f5e", "#64748b",
];

// ── Color context menu ────────────────────────────────────────────────────────
function ColorMenu({ x, y, currentColor, accentColor, onSelect, onClose }: {
  x: number; y: number;
  currentColor: string | null | undefined;
  accentColor: string;
  onSelect: (color: string | null) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [onClose]);

  const menuW = 192, menuH = 130;
  const left = Math.min(x, window.innerWidth - menuW - 8);
  const top  = Math.min(y, window.innerHeight - menuH - 8);

  return (
    <div ref={ref}
      className="fixed z-[60] bg-white/90 backdrop-blur-xl border border-slate-200 rounded-xl shadow-xl p-3"
      style={{ left, top, width: menuW }}
    >
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Tab color</p>
      <div className="grid grid-cols-8 gap-1.5">
        {TAB_COLORS.map((color, i) => (
          <button
            key={i}
            onClick={() => { onSelect(color); onClose(); }}
            title={color ?? "Default"}
            className={`w-5 h-5 rounded-full border-2 transition-transform hover:scale-110 ${
              currentColor === color ? "border-slate-600 scale-110" : "border-transparent hover:border-slate-300"
            }`}
            style={{
              background: color ?? "linear-gradient(135deg,#e2e8f0 50%,#cbd5e1 50%)",
              ...(color === null ? { border: "2px dashed #cbd5e1", background: "white" } : {}),
            }}
          >
            {color === null && (
              <span className="flex items-center justify-center w-full h-full text-slate-400">
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M1 1l6 6M7 1L1 7" />
                </svg>
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Tab critter animation ─────────────────────────────────────────────────────
const CRITTERS = ["🐦", "🦋", "🐟", "🦜", "🐝", "🦊", "🐧", "🦁", "🐬", "🦅", "🐙", "🦚"];

function TabCritter({ critter }: { critter: string }) {
  return (
    <span
      className="critter-anim pointer-events-none fixed z-50 text-xl select-none"
      style={{ top: "48px", left: "50%", transform: "translateX(-50%)" }}
    >
      {critter}
    </span>
  );
}

// ── Tab bar ───────────────────────────────────────────────────────────────────
function TabBar({ tabs, activeId, accentColor, onSwitch, onClose, onNew, onRename, onReorder, onColorChange }: {
  tabs: TabData[];
  activeId: string;
  accentColor: string;
  onSwitch: (id: string) => void;
  onClose: (id: string) => void;
  onNew: () => void;
  onRename: (id: string, label: string) => void;
  onReorder: (fromId: string, toId: string) => void;
  onColorChange: (id: string, color: string | null) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [colorMenu, setColorMenu] = useState<{ tabId: string; x: number; y: number } | null>(null);
  const [activeCritter, setActiveCritter] = useState<string | null>(null);
  const critterTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragIdRef = useRef<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const startEdit = (tab: TabData) => {
    setEditingId(tab.id);
    setEditValue(tab.label);
    setTimeout(() => inputRef.current?.select(), 30);
  };

  const commitEdit = () => {
    if (editingId) { onRename(editingId, editValue.trim() || "Untitled"); setEditingId(null); }
  };

  const handleSwitch = (id: string) => {
    if (id === activeId || editingId) return;
    // Launch a critter!
    const critter = CRITTERS[Math.floor(Math.random() * CRITTERS.length)];
    setActiveCritter(critter);
    if (critterTimer.current) clearTimeout(critterTimer.current);
    critterTimer.current = setTimeout(() => setActiveCritter(null), 600);
    onSwitch(id);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const el = container.querySelector(`[data-tabid="${activeId}"]`) as HTMLElement | null;
    if (el) el.scrollIntoView({ inline: "nearest", block: "nearest" });
  }, [activeId]);

  return (
    <>
      {activeCritter && <TabCritter critter={activeCritter} />}

      <div className="flex items-end bg-slate-100 border-b border-slate-200 px-2 flex-shrink-0 overflow-hidden">
        <div ref={containerRef} className="tabs-scroll flex items-end overflow-x-auto flex-1 gap-0.5 pt-1.5">
          {tabs.map(tab => {
            const isActive = tab.id === activeId;
            const tabColor = tab.color ?? accentColor;
            const isDragOver = dragOverId === tab.id && dragIdRef.current !== tab.id;

            return (
              <div key={tab.id} data-tabid={tab.id}
                draggable
                onDragStart={e => {
                  dragIdRef.current = tab.id;
                  e.dataTransfer.effectAllowed = "move";
                  e.dataTransfer.setData("application/md-tab-id", tab.id);
                  requestAnimationFrame(() => { (e.target as HTMLElement).style.opacity = "0.4"; });
                }}
                onDragEnd={e => {
                  (e.target as HTMLElement).style.opacity = "";
                  dragIdRef.current = null;
                  setDragOverId(null);
                }}
                onDragOver={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.dataTransfer.dropEffect = "move";
                  if (dragIdRef.current && dragIdRef.current !== tab.id) setDragOverId(tab.id);
                }}
                onDragLeave={() => setDragOverId(null)}
                onDrop={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  const fromId = e.dataTransfer.getData("application/md-tab-id");
                  if (fromId && fromId !== tab.id) onReorder(fromId, tab.id);
                  setDragOverId(null);
                }}
                onContextMenu={e => {
                  e.preventDefault();
                  setColorMenu({ tabId: tab.id, x: e.clientX, y: e.clientY });
                }}
                className={`group relative flex items-center gap-1.5 px-3 py-2 rounded-t-lg cursor-pointer flex-shrink-0 max-w-[180px] min-w-[80px] transition-all select-none ${
                  isActive
                    ? "bg-white border border-b-0 border-slate-200 shadow-sm z-10"
                    : "bg-slate-100 hover:bg-slate-50 border border-transparent"
                } ${isDragOver ? "border-l-2 !border-l-blue-400" : ""}`}
                style={isActive ? { borderBottomColor: "white" } : {}}
                onClick={() => handleSwitch(tab.id)}
                onDoubleClick={() => startEdit(tab)}
              >
                {/* Colored top stripe */}
                <span className="absolute top-0 left-2 right-2 h-0.5 rounded-b transition-all duration-300"
                  style={{ background: tabColor, opacity: isActive ? 1 : 0.35 }} />

                {/* Colored dot */}
                <span className="w-2 h-2 rounded-full flex-shrink-0 transition-all duration-300"
                  style={{ background: tabColor, opacity: isActive ? 1 : 0.6, boxShadow: isActive ? `0 0 5px ${tabColor}80` : "none" }} />

                {editingId === tab.id ? (
                  <input ref={inputRef} value={editValue} onChange={e => setEditValue(e.target.value)}
                    onBlur={commitEdit}
                    onKeyDown={e => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") setEditingId(null); e.stopPropagation(); }}
                    className="flex-1 min-w-0 text-xs outline-none bg-transparent border-b border-slate-400 text-slate-800"
                    onClick={e => e.stopPropagation()} />
                ) : (
                  <span className={`flex-1 min-w-0 truncate text-xs ${isActive ? "text-slate-800 font-medium" : "text-slate-500"}`}>{tab.label}</span>
                )}

                {tabs.length > 1 && (
                  <button onClick={e => { e.stopPropagation(); onClose(tab.id); }}
                    className={`flex-shrink-0 w-4 h-4 flex items-center justify-center rounded transition-colors ${
                      isActive ? "text-slate-400 hover:text-red-500 hover:bg-red-50" : "opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 hover:bg-red-50"
                    }`}>
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <path d="M1 1l6 6M7 1L1 7" />
                    </svg>
                  </button>
                )}
              </div>
            );
          })}
        </div>
        <button onClick={onNew} title="New tab"
          className="flex-shrink-0 w-7 h-7 mb-1 ml-1 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M6 2v8M2 6h8" />
          </svg>
        </button>
      </div>

      {colorMenu && (
        <ColorMenu
          x={colorMenu.x} y={colorMenu.y}
          currentColor={tabs.find(t => t.id === colorMenu.tabId)?.color}
          accentColor={accentColor}
          onSelect={color => onColorChange(colorMenu.tabId, color)}
          onClose={() => setColorMenu(null)}
        />
      )}
    </>
  );
}

// ── Glass Theme Card ──────────────────────────────────────────────────────────
function GlassThemeCard({ theme, active, onClick, onHover, onHoverEnd }: {
  theme: Theme;
  active: boolean;
  onClick: () => void;
  onHover: () => void;
  onHoverEnd: () => void;
}) {
  return (
    <button
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onHoverEnd}
      title={theme.name}
      className={`glass-card-hover group relative flex flex-col rounded-xl overflow-hidden border transition-all duration-200 text-left ${
        active
          ? "border-white/60 shadow-lg scale-[1.04] ring-2 ring-white/40"
          : "border-white/20 hover:border-white/50 hover:shadow-md hover:scale-[1.03]"
      }`}
      style={{
        background: active
          ? `linear-gradient(135deg, ${theme.bgTint}dd, ${theme.borderLighter}cc)`
          : `linear-gradient(135deg, ${theme.bgTint}aa, ${theme.borderLighter}88)`,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        boxShadow: active ? `0 4px 20px ${theme.accentColor}30, inset 0 1px 0 rgba(255,255,255,0.5)` : "inset 0 1px 0 rgba(255,255,255,0.3)",
      }}
    >
      {/* Color swatch bar */}
      <div className="h-7 w-full flex">
        {[theme.h1Color, theme.accentColor, theme.borderLight, theme.codeFg, theme.codeBg].map((c, i) => (
          <span key={i} className={i < 2 ? "flex-1" : "flex-[0.6]"} style={{ background: c, opacity: 0.9 }} />
        ))}
      </div>

      {/* Label */}
      <div className="px-2 py-1.5 flex flex-col gap-0.5">
        <span className="text-[10px] font-bold leading-none truncate" style={{ color: theme.h1Color }}>{theme.name}</span>
        <span className="text-[8px] leading-none font-medium" style={{ color: theme.accentColor }}>Aa·</span>
      </div>

      {active && (
        <span className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center shadow-sm"
          style={{ background: theme.accentColor }}>
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path d="M1 4l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      )}
    </button>
  );
}

// ── Theme picker ──────────────────────────────────────────────────────────────
function ThemePicker({ activeId, onSelect, onClose, onGenerated, onPreview }: {
  activeId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
  onGenerated: (t: Theme) => void;
  onPreview: (t: Theme | null) => void;
}) {
  const [tab, setTab] = useState<"browse" | "generate">("browse");
  const [expanded, setExpanded] = useState(false);
  const [search, setSearch] = useState("");
  const [prompt, setPrompt] = useState("");
  const [previewTheme, setPreviewTheme] = useState<Theme | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const topThemes = TOP_THEME_IDS.map(id => themeMap[id]).filter(Boolean);
  const filteredAll = search.trim() ? themes.filter(t => t.name.toLowerCase().includes(search.toLowerCase())) : themes;
  const displayThemes = expanded || search.trim() ? filteredAll : topThemes;

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) { onPreview(null); onClose(); }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose, onPreview]);

  useEffect(() => {
    if (!prompt.trim()) { setPreviewTheme(null); return; }
    const t = setTimeout(() => setPreviewTheme(generateThemeFromPrompt(prompt)), 300);
    return () => clearTimeout(t);
  }, [prompt]);

  const examples = ["ice", "sunset", "forest", "candy", "galaxy", "coffee", "neon", "desert"];

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-2 rounded-2xl shadow-2xl z-50 overflow-hidden border border-white/30"
      style={{
        width: "500px",
        background: "rgba(248, 250, 252, 0.85)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        boxShadow: "0 24px 64px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.7)",
      }}
    >
      {/* Glass header bar */}
      <div className="flex items-center border-b border-white/40 px-4 pt-3"
        style={{ background: "rgba(255,255,255,0.4)" }}>
        {(["browse", "generate"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`pb-2.5 px-1 mr-4 text-xs font-semibold border-b-2 transition-all ${
              tab === t ? "border-slate-700 text-slate-800" : "border-transparent text-slate-400 hover:text-slate-600"
            }`}>
            {t === "generate" ? "✦ Generate" : "Browse themes"}
          </button>
        ))}
      </div>

      {tab === "browse" ? (
        <div className="p-4">
          <div className="relative mb-3">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="5" cy="5" r="3.5" /><path d="M8 8l2.5 2.5" />
            </svg>
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); if (e.target.value) setExpanded(true); }}
              placeholder="Search themes…"
              className="w-full pl-7 pr-3 py-1.5 text-xs rounded-lg outline-none placeholder-slate-400 border border-white/50 focus:border-white/80"
              style={{ background: "rgba(255,255,255,0.6)", backdropFilter: "blur(8px)" }}
            />
          </div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">
            {search.trim() ? `${filteredAll.length} result${filteredAll.length !== 1 ? "s" : ""}` : expanded ? "All themes" : "Featured"}
          </p>
          <div className="grid grid-cols-5 gap-2">
            {displayThemes.map(t => (
              <GlassThemeCard
                key={t.id}
                theme={t}
                active={activeId === t.id}
                onClick={() => { onPreview(null); onSelect(t.id); }}
                onHover={() => onPreview(t)}
                onHoverEnd={() => onPreview(null)}
              />
            ))}
          </div>
          {!search.trim() && (
            <button
              onClick={() => setExpanded(v => !v)}
              className="mt-3 w-full py-2 text-xs text-slate-500 hover:text-slate-700 rounded-lg transition-all font-medium border border-dashed"
              style={{ borderColor: "rgba(148,163,184,0.4)", background: "rgba(255,255,255,0.3)" }}
            >
              {expanded ? "Show less ▴" : `See all themes (${themes.length}) ▾`}
            </button>
          )}
        </div>
      ) : (
        <div className="p-4">
          <p className="text-xs text-slate-500 mb-3 leading-relaxed">Describe a vibe, mood, or concept — we'll generate a matching color palette.</p>
          <div className="flex gap-2 mb-3">
            <input
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && previewTheme) { onGenerated(previewTheme); onPreview(null); onClose(); } }}
              placeholder='e.g. "ice", "midnight forest", "warm coffee"'
              className="flex-1 px-3 py-2 text-xs rounded-lg outline-none placeholder-slate-400 border border-white/50 focus:border-white/80"
              style={{ background: "rgba(255,255,255,0.6)", backdropFilter: "blur(8px)" }}
              autoFocus
            />
            <button
              onClick={() => { if (previewTheme) { onGenerated(previewTheme); onPreview(null); onClose(); } }}
              disabled={!previewTheme}
              className="px-4 py-2 text-xs font-semibold text-white rounded-lg transition-all disabled:opacity-40 shadow-sm"
              style={{ background: previewTheme?.accentColor ?? "#64748b" }}
            >Apply</button>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {examples.map(ex => (
              <button key={ex} onClick={() => setPrompt(ex)}
                className="px-2.5 py-1 text-[10px] rounded-full text-slate-600 transition-colors font-medium border border-white/40 hover:border-white/70"
                style={{ background: "rgba(255,255,255,0.5)" }}
              >{ex}</button>
            ))}
          </div>
          {previewTheme ? (
            <div className="rounded-xl overflow-hidden border border-white/40 shadow-sm"
              style={{ background: `linear-gradient(135deg, ${previewTheme.bgTint}, ${previewTheme.borderLighter})` }}>
              <div className="h-8 flex">
                {[previewTheme.h1Color, previewTheme.accentColor, previewTheme.borderLight, previewTheme.bgTint, previewTheme.codeFg, previewTheme.codeBg].map((c, i) => (
                  <span key={i} className="flex-1" style={{ background: c }} />
                ))}
              </div>
              <div className="px-4 py-3">
                <p className="text-sm font-bold mb-1" style={{ color: previewTheme.h1Color }}>{previewTheme.name}</p>
                <p className="text-xs mb-1" style={{ color: previewTheme.accentColor }}>Heading · Link · Bullets</p>
                <p className="text-xs">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono" style={{ background: previewTheme.codeBg, color: previewTheme.codeFg, border: `1px solid ${previewTheme.codeBorder}` }}>inline code</span>
                  {" and "}
                  <span style={{ color: previewTheme.accentColor, textDecoration: "underline", fontSize: "11px" }}>links</span>
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed py-8 text-center text-xs text-slate-400"
              style={{ borderColor: "rgba(148,163,184,0.4)" }}>
              Type above to preview your generated theme
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function MarkdownViewer() {
  // ── Tabs ──────────────────────────────────────────────────────────────────
  const [tabs, setTabs] = useState<TabData[]>(() => loadTabs());
  const [activeTabId, setActiveTabId] = useState<string>(() => {
    const saved = lsGet(LS_ACTIVE_TAB);
    const loaded = loadTabs();
    return (saved && loaded.find(t => t.id === saved)) ? saved : loaded[0].id;
  });
  const activeTab = tabs.find(t => t.id === activeTabId) ?? tabs[0];

  // ── History ───────────────────────────────────────────────────────────────
  const historyMapRef = useRef<Map<string, HistoryState>>(new Map());
  const historyRef = useRef<HistoryState>({ stack: [activeTab.content], index: 0 });
  const [history, dispatch] = useReducer(historyReducer, { stack: [activeTab.content], index: 0 });
  const content = history.stack[history.index];
  useEffect(() => { historyRef.current = history; }, [history]);

  const historyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const setContent = useCallback((value: string, immediate = false) => {
    dispatch({ type: "push", value });
    if (!immediate) {
      if (historyTimer.current) clearTimeout(historyTimer.current);
      historyTimer.current = setTimeout(() => dispatch({ type: "push", value }), 500);
    }
  }, []);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const v = lsGet(LS_VIEW_MODE) as ViewMode;
    return (v === "preview" || v === "split") ? v : "preview";
  });
  const [themeId, setThemeId] = useState<string>(() => lsGet(LS_THEME) ?? "forest");
  const [customTheme, setCustomTheme] = useState<Theme | null>(null);
  const [hoverPreviewTheme, setHoverPreviewTheme] = useState<Theme | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [tabFadeKey, setTabFadeKey] = useState(0);

  // Compare mode pane tab IDs
  const [comparePaneIds, setComparePaneIds] = useState<string[]>([]);

  // Committed theme vs hover preview
  const committedTheme = customTheme ?? themeMap[themeId] ?? themeMap["forest"];
  const activeTheme = hoverPreviewTheme ?? committedTheme;
  const themeVars = themeToVars(activeTheme);

  // ── Refs ──────────────────────────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewScrollRef = useRef<HTMLDivElement>(null);
  const splitPreviewScrollRef = useRef<HTMLDivElement>(null);
  const activeScrollRef = viewMode === "preview" ? previewScrollRef : splitPreviewScrollRef;

  const isRestoringScroll = useRef(false);

  const latestTabsRef = useRef(tabs);
  const latestContentRef = useRef(content);
  const latestActiveTabIdRef = useRef(activeTabId);
  useEffect(() => { latestTabsRef.current = tabs; }, [tabs]);
  useEffect(() => { latestContentRef.current = content; }, [content]);
  useEffect(() => { latestActiveTabIdRef.current = activeTabId; }, [activeTabId]);

  // ── Force-flush before unload ──────────────────────────────────────────────
  useEffect(() => {
    const flush = () => {
      const saved = latestTabsRef.current.map(t =>
        t.id === latestActiveTabIdRef.current ? { ...t, content: latestContentRef.current } : t
      );
      lsSet(LS_TABS, JSON.stringify(saved));
      lsSet(LS_ACTIVE_TAB, latestActiveTabIdRef.current);
    };
    window.addEventListener("beforeunload", flush);
    return () => window.removeEventListener("beforeunload", flush);
  }, []);

  // ── Sync active content → tabs ────────────────────────────────────────────
  useEffect(() => {
    setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, content } : t));
  }, [content, activeTabId]);

  // ── Persist ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => lsSet(LS_TABS, JSON.stringify(tabs)), 600);
    return () => clearTimeout(t);
  }, [tabs]);
  useEffect(() => { lsSet(LS_ACTIVE_TAB, activeTabId); }, [activeTabId]);
  useEffect(() => { lsSet(LS_VIEW_MODE, viewMode); }, [viewMode]);
  useEffect(() => { lsSet(LS_THEME, themeId); }, [themeId]);

  // ── Smooth scroll helper ──────────────────────────────────────────────────
  const smoothScrollTo = useCallback((el: HTMLDivElement, ratio: number) => {
    isRestoringScroll.current = true;
    el.scrollTo({ top: ratio * (el.scrollHeight - el.clientHeight), behavior: "smooth" });
    setTimeout(() => { isRestoringScroll.current = false; }, 700);
  }, []);

  // ── Save scroll ratio ─────────────────────────────────────────────────────
  useEffect(() => {
    const el = activeScrollRef.current;
    if (!el) return;
    const fn = () => {
      if (isRestoringScroll.current) return;
      const max = el.scrollHeight - el.clientHeight;
      if (max > 0)
        setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, scrollRatio: el.scrollTop / max } : t));
    };
    el.addEventListener("scroll", fn, { passive: true });
    return () => el.removeEventListener("scroll", fn);
  }, [activeScrollRef, activeTabId, viewMode]);

  // ── Restore scroll on tab switch ──────────────────────────────────────────
  const pendingScrollRatio = useRef<number | null>(null);
  useEffect(() => {
    if (pendingScrollRatio.current === null) return;
    const ratio = pendingScrollRatio.current;
    pendingScrollRatio.current = null;
    const t = setTimeout(() => {
      const el = activeScrollRef.current;
      if (el) smoothScrollTo(el, ratio);
    }, 80);
    return () => clearTimeout(t);
  });

  // ── Restore scroll on initial page load ──────────────────────────────────
  const mountRestored = useRef(false);
  useEffect(() => {
    if (mountRestored.current) return;
    mountRestored.current = true;
    const ratio = activeTab.scrollRatio ?? 0;
    if (!ratio) return;
    const t = setTimeout(() => {
      const el = activeScrollRef.current;
      if (el) smoothScrollTo(el, ratio);
    }, 500);
    return () => clearTimeout(t);
  });

  // ── Tab management ────────────────────────────────────────────────────────
  const switchTab = useCallback((newId: string) => {
    if (newId === activeTabId) return;
    historyMapRef.current.set(activeTabId, historyRef.current);
    setTabs(prev => {
      const newTab = prev.find(t => t.id === newId);
      if (!newTab) return prev;
      const saved = historyMapRef.current.get(newId) ?? { stack: [newTab.content], index: 0 };
      dispatch({ type: "init", state: saved });
      pendingScrollRatio.current = newTab.scrollRatio ?? 0;
      return prev;
    });
    setTabFadeKey(k => k + 1);
    setActiveTabId(newId);
  }, [activeTabId]);

  const newTab = useCallback(() => {
    const tab = makeTab({ label: "Untitled" });
    setTabs(prev => [...prev, tab]);
    historyMapRef.current.set(activeTabId, historyRef.current);
    dispatch({ type: "init", state: { stack: [SAMPLE_MARKDOWN], index: 0 } });
    pendingScrollRatio.current = 0;
    setTabFadeKey(k => k + 1);
    setActiveTabId(tab.id);
  }, [activeTabId]);

  const closeTab = useCallback((id: string) => {
    setTabs(prev => {
      if (prev.length <= 1) return prev;
      const idx = prev.findIndex(t => t.id === id);
      const remaining = prev.filter(t => t.id !== id);
      historyMapRef.current.delete(id);
      setComparePaneIds(cp => cp.filter(pid => pid !== id));
      if (id === activeTabId) {
        const next = remaining[Math.min(idx, remaining.length - 1)];
        const saved = historyMapRef.current.get(next.id) ?? { stack: [next.content], index: 0 };
        dispatch({ type: "init", state: saved });
        pendingScrollRatio.current = next.scrollRatio ?? 0;
        setTabFadeKey(k => k + 1);
        setActiveTabId(next.id);
      }
      return remaining;
    });
  }, [activeTabId]);

  const renameTab = useCallback((id: string, label: string) => {
    setTabs(prev => prev.map(t => t.id === id ? { ...t, label } : t));
  }, []);

  const reorderTabs = useCallback((fromId: string, toId: string) => {
    setTabs(prev => {
      const fromIdx = prev.findIndex(t => t.id === fromId);
      const toIdx = prev.findIndex(t => t.id === toId);
      if (fromIdx === -1 || toIdx === -1) return prev;
      const next = [...prev];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      return next;
    });
  }, []);

  const changeTabColor = useCallback((id: string, color: string | null) => {
    setTabs(prev => prev.map(t => t.id === id ? { ...t, color } : t));
  }, []);

  const saveBookmark = useCallback((ratio: number) => {
    setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, bookmark: ratio } : t));
  }, [activeTabId]);

  // ── Compare mode ──────────────────────────────────────────────────────────
  const enterCompareMode = useCallback(() => {
    const ids = tabs.slice(0, Math.min(tabs.length, 2)).map(t => t.id);
    if (ids.length < 2) ids.push(ids[0]);
    setComparePaneIds(ids);
    setViewMode("compare");
  }, [tabs]);

  const updateComparePane = useCallback((idx: number, tabId: string) => {
    setComparePaneIds(prev => { const next = [...prev]; next[idx] = tabId; return next; });
  }, []);

  const addComparePane = useCallback(() => {
    setComparePaneIds(prev => {
      const unused = tabs.find(t => !prev.includes(t.id));
      return unused ? [...prev, unused.id] : [...prev, tabs[0].id];
    });
  }, [tabs]);

  const removeComparePane = useCallback((idx: number) => {
    setComparePaneIds(prev => prev.filter((_, i) => i !== idx));
  }, []);

  // ── Switch view mode ──────────────────────────────────────────────────────
  const switchMode = useCallback((next: ViewMode) => {
    if (next === viewMode) return;
    if (next === "compare") { enterCompareMode(); return; }
    const getRatio = (el: HTMLDivElement | null) => {
      if (!el) return 0;
      const max = el.scrollHeight - el.clientHeight;
      return max > 0 ? el.scrollTop / max : 0;
    };
    const applyRatio = (el: HTMLDivElement | null, r: number) => {
      if (el) requestAnimationFrame(() => smoothScrollTo(el, r));
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
  }, [viewMode, enterCompareMode, smoothScrollTo]);

  // ── File loading ──────────────────────────────────────────────────────────
  const loadFile = useCallback((file: File) => {
    if (!file.name.endsWith(".md") && !file.name.endsWith(".markdown")) {
      alert("Please upload a Markdown file (.md or .markdown).");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const label = file.name.replace(/\.(md|markdown)$/, "");
      dispatch({ type: "init", state: { stack: [text], index: 0 } });
      setTabs(prev => prev.map(t => t.id === activeTabId
        ? { ...t, content: text, fileName: file.name, label, bookmark: null, scrollRatio: 0 } : t));
      const el = activeScrollRef.current;
      if (el) el.scrollTop = 0;
    };
    reader.readAsText(file);
  }, [activeTabId, activeScrollRef]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadFile(file);
    e.target.value = "";
  }, [loadFile]);

  // ── Drag & drop ───────────────────────────────────────────────────────────
  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes("Files")) return;
    e.preventDefault(); setIsDragging(true);
  }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false);
  }, []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) loadFile(file);
  }, [loadFile]);

  // ── Download ──────────────────────────────────────────────────────────────
  const handleDownload = useCallback(() => {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = activeTab.fileName ?? `${activeTab.label}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [content, activeTab]);

  // ── Editor keyboard shortcuts ─────────────────────────────────────────────
  const handleEditorKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const ctrl = e.ctrlKey || e.metaKey;
    if (ctrl && e.key === "z") { e.preventDefault(); dispatch(e.shiftKey ? { type: "redo" } : { type: "undo" }); return; }
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

  const pageBg = activeTheme.pageBg ?? "#f8fafc";

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: pageBg, transition: "background 0.4s ease" }}
      onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>

      {/* Hover preview overlay tint */}
      {hoverPreviewTheme && (
        <div
          className="theme-preview-overlay"
          style={{ background: `linear-gradient(135deg, ${hoverPreviewTheme.bgTint}20, ${hoverPreviewTheme.accentColor}08)` }}
        />
      )}

      {isDragging && (
        <div className="fixed inset-0 z-50 bg-black/10 backdrop-blur-sm flex items-center justify-center pointer-events-none">
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border-2 border-dashed border-slate-300 px-16 py-12 text-center">
            <div className="text-5xl mb-3">📄</div>
            <p className="text-xl font-semibold text-slate-700">Drop your Markdown file</p>
            <p className="text-sm text-slate-400 mt-1">Opens in the current tab</p>
          </div>
        </div>
      )}

      {/* Navbar */}
      <header className="flex-shrink-0 z-40" style={{
        background: `rgba(255,255,255,0.8)`,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(226,232,240,0.8)",
        boxShadow: "0 1px 0 rgba(255,255,255,0.5), 0 2px 8px rgba(0,0,0,0.04)",
        transition: "background 0.4s ease",
      }}>
        <div className="max-w-screen-xl mx-auto px-5 h-14 flex items-center gap-4">
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shadow-sm transition-all duration-300" style={{ background: activeTheme.h1Color }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="2" width="12" height="1.5" rx="0.75" fill="white" />
                <rect x="1" y="5.25" width="8" height="1.5" rx="0.75" fill="white" />
                <rect x="1" y="8.5" width="10" height="1.5" rx="0.75" fill="white" />
                <rect x="1" y="11" width="6" height="1.5" rx="0.75" fill="white" />
              </svg>
            </div>
            <span className="font-semibold text-slate-800 tracking-tight text-sm">
              Markdown<span style={{ color: activeTheme.h1Color, transition: "color 0.3s" }}>Viewer</span>
            </span>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* View mode toggle */}
            <div className="flex items-center rounded-lg p-0.5 gap-0.5 border border-slate-200/80"
              style={{ background: "rgba(241,245,249,0.8)" }}>
              {([["preview", "Preview"], ["split", "Split View"], ["compare", "Compare"]] as [ViewMode, string][]).map(([m, label]) => {
                if (m === "compare" && tabs.length < 2) return null;
                return (
                  <button key={m} onClick={() => switchMode(m)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === m ? "bg-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                    style={viewMode === m ? { color: activeTheme.h1Color } : {}}>
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Theme picker */}
            <div className="relative">
              <button
                onClick={() => setShowThemePicker(v => !v)}
                title="Change theme"
                className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-all ${showThemePicker ? "border-white/60 shadow-sm" : "border-slate-200/80 hover:border-slate-300"}`}
                style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(8px)" }}
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
                  onSelect={(id) => { setThemeId(id); setCustomTheme(null); setHoverPreviewTheme(null); setShowThemePicker(false); }}
                  onClose={() => { setHoverPreviewTheme(null); setShowThemePicker(false); }}
                  onGenerated={(t) => { setCustomTheme(t); setHoverPreviewTheme(null); setShowThemePicker(false); }}
                  onPreview={setHoverPreviewTheme}
                />
              )}
            </div>

            {/* Upload */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 text-white text-xs font-medium px-3.5 py-2 rounded-lg transition-all shadow-sm hover:shadow-md hover:opacity-90"
              style={{ background: activeTheme.h1Color, transition: "background 0.3s, box-shadow 0.2s" }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 1v7M3 4l3-3 3 3M1 9v1a1 1 0 001 1h8a1 1 0 001-1V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Upload File
            </button>
            <input ref={fileInputRef} type="file" accept=".md,.markdown" className="hidden" onChange={handleFileInput} />
          </div>
        </div>

        <TabBar
          tabs={tabs}
          activeId={activeTabId}
          accentColor={activeTheme.accentColor}
          onSwitch={switchTab}
          onClose={closeTab}
          onNew={newTab}
          onRename={renameTab}
          onReorder={reorderTabs}
          onColorChange={changeTabColor}
        />
      </header>

      {/* Main */}
      <main className="flex-1 flex overflow-hidden relative min-w-0">

        {/* ── Preview ── */}
        {viewMode === "preview" && (
          <div ref={previewScrollRef} className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth">
            <div key={tabFadeKey} className="tab-fade-in max-w-3xl mx-auto px-6 py-12">
              <MarkdownRenderer content={content} themeVars={themeVars} />
            </div>
          </div>
        )}

        {/* ── Split (edit + preview) ── */}
        {viewMode === "split" && (
          <div className="flex-1 flex overflow-hidden divide-x divide-slate-200 min-w-0">
            <div className="w-1/2 flex flex-col bg-slate-900 raw-editor min-w-0">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-700 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Edit</span>
                  <span className="hidden lg:flex items-center gap-2 text-[10px] text-slate-600">
                    <kbd className="bg-slate-800 px-1 py-0.5 rounded">⌘B</kbd> bold
                    <kbd className="bg-slate-800 px-1 py-0.5 rounded">⌘I</kbd> italic
                    <kbd className="bg-slate-800 px-1 py-0.5 rounded">⌘K</kbd> link
                    <kbd className="bg-slate-800 px-1 py-0.5 rounded">⌘`</kbd> code
                    <kbd className="bg-slate-800 px-1 py-0.5 rounded">⌘Z</kbd> undo
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
              <textarea ref={textareaRef}
                className="flex-1 w-full bg-transparent text-slate-300 font-mono text-sm leading-relaxed p-5 resize-none outline-none placeholder-slate-600 raw-editor"
                value={content} onChange={e => setContent(e.target.value)}
                onKeyDown={handleEditorKeyDown} spellCheck={false}
                placeholder="Start typing Markdown here…" />
            </div>
            <div ref={splitPreviewScrollRef} className="w-1/2 overflow-y-auto overflow-x-hidden bg-white scroll-smooth min-w-0">
              <div className="flex items-center px-4 py-2.5 border-b border-slate-100 sticky top-0 bg-white/90 backdrop-blur z-10">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Preview</span>
              </div>
              <div key={tabFadeKey} className="tab-fade-in px-8 py-8">
                <MarkdownRenderer content={content} themeVars={themeVars} />
              </div>
            </div>
          </div>
        )}

        {/* ── Compare (multi-pane) ── */}
        {viewMode === "compare" && (
          <div className="flex-1 flex overflow-hidden min-w-0">
            {comparePaneIds.map((tabId, idx) => (
              <ComparePane
                key={idx}
                tabId={tabId}
                tabs={tabs}
                themeVars={themeVars}
                accentColor={activeTheme.accentColor}
                onChangeTab={(id) => updateComparePane(idx, id)}
                onClose={comparePaneIds.length > 2 ? () => removeComparePane(idx) : undefined}
              />
            ))}
            {comparePaneIds.length < 4 && (
              <button onClick={addComparePane}
                className="flex-shrink-0 w-10 flex items-center justify-center bg-slate-50 border-l border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                title="Add another pane">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M7 2v10M2 7h10" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Scroll progress bar */}
        {viewMode !== "compare" && (
          <ScrollBar
            scrollRef={activeScrollRef}
            bookmark={activeTab.bookmark ?? null}
            onSaveBookmark={saveBookmark}
            accentColor={activeTheme.accentColor}
          />
        )}
      </main>

      <div className="flex-shrink-0 py-2 text-center text-xs text-slate-400 border-t border-slate-100/80"
        style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(8px)" }}>
        Drop a <code className="text-rose-500 bg-rose-50 px-1 py-0.5 rounded">.md</code> file anywhere · Double-click a tab to rename · Right-click a tab for colors
      </div>
    </div>
  );
}
