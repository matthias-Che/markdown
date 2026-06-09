export interface Theme {
  id: string;
  name: string;
  // Heading / accent
  h1Color: string;
  accentColor: string;
  borderLight: string;
  borderLighter: string;
  bgTint: string;
  // Inline code
  codeFg: string;
  codeBg: string;
  codeBorder: string;
  // Optional page bg override (for warm/dark themes)
  pageBg?: string;
  tableHeaderBg?: string; // defaults to h1Color
}

export const TOP_THEME_IDS = ["forest", "ocean", "violet", "crimson", "amber"];

const themes: Theme[] = [
  // ── Top 5 ──────────────────────────────────────────────────────────────────
  {
    id: "forest",
    name: "Forest",
    h1Color: "#166534", accentColor: "#16a34a",
    borderLight: "#bbf7d0", borderLighter: "#d1fae5", bgTint: "#f0fdf4",
    codeFg: "#be123c", codeBg: "#fff1f2", codeBorder: "#fecdd3",
  },
  {
    id: "ocean",
    name: "Ocean",
    h1Color: "#1e3a8a", accentColor: "#2563eb",
    borderLight: "#bfdbfe", borderLighter: "#dbeafe", bgTint: "#eff6ff",
    codeFg: "#7c3aed", codeBg: "#f5f3ff", codeBorder: "#ddd6fe",
  },
  {
    id: "violet",
    name: "Violet",
    h1Color: "#4c1d95", accentColor: "#7c3aed",
    borderLight: "#ddd6fe", borderLighter: "#ede9fe", bgTint: "#f5f3ff",
    codeFg: "#be123c", codeBg: "#fff1f2", codeBorder: "#fecdd3",
  },
  {
    id: "crimson",
    name: "Crimson",
    h1Color: "#881337", accentColor: "#e11d48",
    borderLight: "#fda4af", borderLighter: "#fecdd3", bgTint: "#fff1f2",
    codeFg: "#1d4ed8", codeBg: "#eff6ff", codeBorder: "#bfdbfe",
  },
  {
    id: "amber",
    name: "Amber",
    h1Color: "#78350f", accentColor: "#d97706",
    borderLight: "#fcd34d", borderLighter: "#fde68a", bgTint: "#fffbeb",
    codeFg: "#be123c", codeBg: "#fff1f2", codeBorder: "#fecdd3",
    pageBg: "#fefce8",
  },

  // ── Greens ─────────────────────────────────────────────────────────────────
  {
    id: "sage",
    name: "Sage",
    h1Color: "#14532d", accentColor: "#4ade80",
    borderLight: "#bbf7d0", borderLighter: "#dcfce7", bgTint: "#f0fdf4",
    codeFg: "#9f1239", codeBg: "#fff1f2", codeBorder: "#fda4af",
  },
  {
    id: "mint",
    name: "Mint",
    h1Color: "#065f46", accentColor: "#10b981",
    borderLight: "#a7f3d0", borderLighter: "#d1fae5", bgTint: "#ecfdf5",
    codeFg: "#7c3aed", codeBg: "#f5f3ff", codeBorder: "#ddd6fe",
  },
  {
    id: "olive",
    name: "Olive",
    h1Color: "#365314", accentColor: "#65a30d",
    borderLight: "#d9f99d", borderLighter: "#ecfccb", bgTint: "#f7fee7",
    codeFg: "#c2410c", codeBg: "#fff7ed", codeBorder: "#fed7aa",
    pageBg: "#fafff0",
  },
  {
    id: "teal",
    name: "Teal",
    h1Color: "#134e4a", accentColor: "#0d9488",
    borderLight: "#99f6e4", borderLighter: "#ccfbf1", bgTint: "#f0fdfa",
    codeFg: "#9f1239", codeBg: "#fff1f2", codeBorder: "#fda4af",
  },
  {
    id: "emerald",
    name: "Emerald",
    h1Color: "#064e3b", accentColor: "#059669",
    borderLight: "#6ee7b7", borderLighter: "#a7f3d0", bgTint: "#ecfdf5",
    codeFg: "#c2410c", codeBg: "#fff7ed", codeBorder: "#fed7aa",
  },

  // ── Blues ──────────────────────────────────────────────────────────────────
  {
    id: "sky",
    name: "Sky",
    h1Color: "#0c4a6e", accentColor: "#0284c7",
    borderLight: "#bae6fd", borderLighter: "#e0f2fe", bgTint: "#f0f9ff",
    codeFg: "#be123c", codeBg: "#fff1f2", codeBorder: "#fecdd3",
  },
  {
    id: "navy",
    name: "Navy",
    h1Color: "#172554", accentColor: "#3b82f6",
    borderLight: "#93c5fd", borderLighter: "#bfdbfe", bgTint: "#eff6ff",
    codeFg: "#c2410c", codeBg: "#fff7ed", codeBorder: "#fed7aa",
  },
  {
    id: "cobalt",
    name: "Cobalt",
    h1Color: "#1e3a8a", accentColor: "#4f46e5",
    borderLight: "#c7d2fe", borderLighter: "#e0e7ff", bgTint: "#eef2ff",
    codeFg: "#be123c", codeBg: "#fff1f2", codeBorder: "#fecdd3",
  },
  {
    id: "cerulean",
    name: "Cerulean",
    h1Color: "#155e75", accentColor: "#06b6d4",
    borderLight: "#a5f3fc", borderLighter: "#cffafe", bgTint: "#ecfeff",
    codeFg: "#7c3aed", codeBg: "#f5f3ff", codeBorder: "#ddd6fe",
  },
  {
    id: "steel",
    name: "Steel",
    h1Color: "#1e3a5f", accentColor: "#60a5fa",
    borderLight: "#bfdbfe", borderLighter: "#dbeafe", bgTint: "#f1f5f9",
    codeFg: "#c2410c", codeBg: "#fff7ed", codeBorder: "#fed7aa",
  },

  // ── Purples ────────────────────────────────────────────────────────────────
  {
    id: "plum",
    name: "Plum",
    h1Color: "#3b0764", accentColor: "#a855f7",
    borderLight: "#e9d5ff", borderLighter: "#f3e8ff", bgTint: "#faf5ff",
    codeFg: "#be123c", codeBg: "#fff1f2", codeBorder: "#fecdd3",
  },
  {
    id: "lavender",
    name: "Lavender",
    h1Color: "#4a1d96", accentColor: "#8b5cf6",
    borderLight: "#ddd6fe", borderLighter: "#ede9fe", bgTint: "#f5f3ff",
    codeFg: "#0369a1", codeBg: "#f0f9ff", codeBorder: "#bae6fd",
    pageBg: "#faf8ff",
  },
  {
    id: "grape",
    name: "Grape",
    h1Color: "#581c87", accentColor: "#9333ea",
    borderLight: "#d8b4fe", borderLighter: "#e9d5ff", bgTint: "#faf5ff",
    codeFg: "#be123c", codeBg: "#fff1f2", codeBorder: "#fecdd3",
  },
  {
    id: "mauve",
    name: "Mauve",
    h1Color: "#4a044e", accentColor: "#c026d3",
    borderLight: "#f0abfc", borderLighter: "#f5d0fe", bgTint: "#fdf4ff",
    codeFg: "#0369a1", codeBg: "#f0f9ff", codeBorder: "#bae6fd",
  },
  {
    id: "indigo",
    name: "Indigo",
    h1Color: "#312e81", accentColor: "#6366f1",
    borderLight: "#c7d2fe", borderLighter: "#e0e7ff", bgTint: "#eef2ff",
    codeFg: "#be123c", codeBg: "#fff1f2", codeBorder: "#fecdd3",
  },

  // ── Reds / Pinks ───────────────────────────────────────────────────────────
  {
    id: "rose",
    name: "Rose",
    h1Color: "#881337", accentColor: "#f43f5e",
    borderLight: "#fda4af", borderLighter: "#fecdd3", bgTint: "#fff1f2",
    codeFg: "#1d4ed8", codeBg: "#eff6ff", codeBorder: "#bfdbfe",
  },
  {
    id: "coral",
    name: "Coral",
    h1Color: "#7f1d1d", accentColor: "#ef4444",
    borderLight: "#fca5a5", borderLighter: "#fecaca", bgTint: "#fef2f2",
    codeFg: "#166534", codeBg: "#f0fdf4", codeBorder: "#bbf7d0",
  },
  {
    id: "blush",
    name: "Blush",
    h1Color: "#831843", accentColor: "#ec4899",
    borderLight: "#f9a8d4", borderLighter: "#fbcfe8", bgTint: "#fdf2f8",
    codeFg: "#1d4ed8", codeBg: "#eff6ff", codeBorder: "#bfdbfe",
    pageBg: "#fff8fc",
  },
  {
    id: "ruby",
    name: "Ruby",
    h1Color: "#7f1d1d", accentColor: "#dc2626",
    borderLight: "#fca5a5", borderLighter: "#fee2e2", bgTint: "#fef2f2",
    codeFg: "#0369a1", codeBg: "#f0f9ff", codeBorder: "#bae6fd",
  },
  {
    id: "cherry",
    name: "Cherry",
    h1Color: "#500724", accentColor: "#e11d48",
    borderLight: "#fda4af", borderLighter: "#fecdd3", bgTint: "#fff1f2",
    codeFg: "#065f46", codeBg: "#ecfdf5", codeBorder: "#a7f3d0",
  },

  // ── Oranges / Yellows ──────────────────────────────────────────────────────
  {
    id: "sunset",
    name: "Sunset",
    h1Color: "#7c2d12", accentColor: "#ea580c",
    borderLight: "#fdba74", borderLighter: "#fed7aa", bgTint: "#fff7ed",
    codeFg: "#7c3aed", codeBg: "#f5f3ff", codeBorder: "#ddd6fe",
    pageBg: "#fffaf5",
  },
  {
    id: "tangerine",
    name: "Tangerine",
    h1Color: "#7c2d12", accentColor: "#f97316",
    borderLight: "#fdba74", borderLighter: "#fed7aa", bgTint: "#fff7ed",
    codeFg: "#1d4ed8", codeBg: "#eff6ff", codeBorder: "#bfdbfe",
  },
  {
    id: "honey",
    name: "Honey",
    h1Color: "#713f12", accentColor: "#ca8a04",
    borderLight: "#fde047", borderLighter: "#fef08a", bgTint: "#fefce8",
    codeFg: "#166534", codeBg: "#f0fdf4", codeBorder: "#bbf7d0",
    pageBg: "#fffef0",
  },
  {
    id: "gold",
    name: "Gold",
    h1Color: "#92400e", accentColor: "#f59e0b",
    borderLight: "#fcd34d", borderLighter: "#fde68a", bgTint: "#fffbeb",
    codeFg: "#7c3aed", codeBg: "#f5f3ff", codeBorder: "#ddd6fe",
  },
  {
    id: "saffron",
    name: "Saffron",
    h1Color: "#854d0e", accentColor: "#eab308",
    borderLight: "#fef08a", borderLighter: "#fef9c3", bgTint: "#fefce8",
    codeFg: "#9f1239", codeBg: "#fff1f2", codeBorder: "#fda4af",
    pageBg: "#fffef2",
  },

  // ── Teals / Cyans ──────────────────────────────────────────────────────────
  {
    id: "aqua",
    name: "Aqua",
    h1Color: "#164e63", accentColor: "#22d3ee",
    borderLight: "#a5f3fc", borderLighter: "#cffafe", bgTint: "#ecfeff",
    codeFg: "#be123c", codeBg: "#fff1f2", codeBorder: "#fecdd3",
  },
  {
    id: "seafoam",
    name: "Seafoam",
    h1Color: "#042f2e", accentColor: "#14b8a6",
    borderLight: "#99f6e4", borderLighter: "#ccfbf1", bgTint: "#f0fdfa",
    codeFg: "#c2410c", codeBg: "#fff7ed", codeBorder: "#fed7aa",
  },
  {
    id: "turquoise",
    name: "Turquoise",
    h1Color: "#0f3460", accentColor: "#0891b2",
    borderLight: "#a5f3fc", borderLighter: "#cffafe", bgTint: "#ecfeff",
    codeFg: "#9f1239", codeBg: "#fff1f2", codeBorder: "#fda4af",
  },
  {
    id: "lagoon",
    name: "Lagoon",
    h1Color: "#0c4a6e", accentColor: "#38bdf8",
    borderLight: "#bae6fd", borderLighter: "#e0f2fe", bgTint: "#f0f9ff",
    codeFg: "#be123c", codeBg: "#fff1f2", codeBorder: "#fecdd3",
  },

  // ── Neutrals ───────────────────────────────────────────────────────────────
  {
    id: "slate",
    name: "Slate",
    h1Color: "#0f172a", accentColor: "#475569",
    borderLight: "#cbd5e1", borderLighter: "#e2e8f0", bgTint: "#f8fafc",
    codeFg: "#c2410c", codeBg: "#fff7ed", codeBorder: "#fed7aa",
  },
  {
    id: "stone",
    name: "Stone",
    h1Color: "#1c1917", accentColor: "#57534e",
    borderLight: "#d6d3d1", borderLighter: "#e7e5e4", bgTint: "#fafaf9",
    codeFg: "#be123c", codeBg: "#fff1f2", codeBorder: "#fecdd3",
    pageBg: "#fafaf9",
  },
  {
    id: "zinc",
    name: "Zinc",
    h1Color: "#18181b", accentColor: "#52525b",
    borderLight: "#d4d4d8", borderLighter: "#e4e4e7", bgTint: "#fafafa",
    codeFg: "#7c3aed", codeBg: "#f5f3ff", codeBorder: "#ddd6fe",
  },
  {
    id: "mono",
    name: "Mono",
    h1Color: "#000000", accentColor: "#404040",
    borderLight: "#d4d4d4", borderLighter: "#e5e5e5", bgTint: "#f5f5f5",
    codeFg: "#404040", codeBg: "#f5f5f5", codeBorder: "#d4d4d4",
  },
  {
    id: "warm-gray",
    name: "Warm Gray",
    h1Color: "#292524", accentColor: "#78716c",
    borderLight: "#d6d3d1", borderLighter: "#e7e5e4", bgTint: "#fafaf9",
    codeFg: "#c2410c", codeBg: "#fff7ed", codeBorder: "#fed7aa",
    pageBg: "#fdf9f7",
  },

  // ── Pastels ────────────────────────────────────────────────────────────────
  {
    id: "pastel-blue",
    name: "Pastel Blue",
    h1Color: "#1e3a8a", accentColor: "#93c5fd",
    borderLight: "#bfdbfe", borderLighter: "#dbeafe", bgTint: "#eff6ff",
    codeFg: "#be123c", codeBg: "#fff1f2", codeBorder: "#fecdd3",
    pageBg: "#f5f9ff",
  },
  {
    id: "pastel-purple",
    name: "Pastel Purple",
    h1Color: "#4c1d95", accentColor: "#c4b5fd",
    borderLight: "#ddd6fe", borderLighter: "#ede9fe", bgTint: "#f5f3ff",
    codeFg: "#be123c", codeBg: "#fff1f2", codeBorder: "#fecdd3",
    pageBg: "#fbf9ff",
  },
  {
    id: "pastel-pink",
    name: "Pastel Pink",
    h1Color: "#831843", accentColor: "#f9a8d4",
    borderLight: "#fbcfe8", borderLighter: "#fce7f3", bgTint: "#fdf2f8",
    codeFg: "#1d4ed8", codeBg: "#eff6ff", codeBorder: "#bfdbfe",
    pageBg: "#fff8fd",
  },
  {
    id: "pastel-green",
    name: "Pastel Green",
    h1Color: "#14532d", accentColor: "#86efac",
    borderLight: "#bbf7d0", borderLighter: "#dcfce7", bgTint: "#f0fdf4",
    codeFg: "#c2410c", codeBg: "#fff7ed", codeBorder: "#fed7aa",
    pageBg: "#f7fff9",
  },
  {
    id: "pastel-orange",
    name: "Pastel Orange",
    h1Color: "#7c2d12", accentColor: "#fdba74",
    borderLight: "#fed7aa", borderLighter: "#ffedd5", bgTint: "#fff7ed",
    codeFg: "#166534", codeBg: "#f0fdf4", codeBorder: "#bbf7d0",
    pageBg: "#fffaf5",
  },

  // ── Vivid / Bold ───────────────────────────────────────────────────────────
  {
    id: "electric",
    name: "Electric",
    h1Color: "#1e3a8a", accentColor: "#3b82f6",
    borderLight: "#93c5fd", borderLighter: "#bfdbfe", bgTint: "#eff6ff",
    codeFg: "#9333ea", codeBg: "#faf5ff", codeBorder: "#d8b4fe",
  },
  {
    id: "hot-pink",
    name: "Hot Pink",
    h1Color: "#500724", accentColor: "#f472b6",
    borderLight: "#fbcfe8", borderLighter: "#fce7f3", bgTint: "#fdf2f8",
    codeFg: "#0369a1", codeBg: "#f0f9ff", codeBorder: "#bae6fd",
  },
  {
    id: "lime",
    name: "Lime",
    h1Color: "#1a2e05", accentColor: "#84cc16",
    borderLight: "#d9f99d", borderLighter: "#ecfccb", bgTint: "#f7fee7",
    codeFg: "#7c3aed", codeBg: "#f5f3ff", codeBorder: "#ddd6fe",
    pageBg: "#f9fff0",
  },
  {
    id: "deep-orange",
    name: "Deep Orange",
    h1Color: "#431407", accentColor: "#f97316",
    borderLight: "#fdba74", borderLighter: "#fed7aa", bgTint: "#fff7ed",
    codeFg: "#1d4ed8", codeBg: "#eff6ff", codeBorder: "#bfdbfe",
  },
  {
    id: "magenta",
    name: "Magenta",
    h1Color: "#4a044e", accentColor: "#e879f9",
    borderLight: "#f0abfc", borderLighter: "#f5d0fe", bgTint: "#fdf4ff",
    codeFg: "#0369a1", codeBg: "#f0f9ff", codeBorder: "#bae6fd",
  },
  {
    id: "neon-teal",
    name: "Neon Teal",
    h1Color: "#042f2e", accentColor: "#2dd4bf",
    borderLight: "#99f6e4", borderLighter: "#ccfbf1", bgTint: "#f0fdfa",
    codeFg: "#9f1239", codeBg: "#fff1f2", codeBorder: "#fda4af",
  },
];

export default themes;
export const themeMap = Object.fromEntries(themes.map((t) => [t.id, t]));
