import { type Theme } from "./themes";

// ── Keyword → palette map ─────────────────────────────────────────────────────
interface Palette {
  h1Color: string;
  accentColor: string;
  borderLight: string;
  borderLighter: string;
  bgTint: string;
  codeFg: string;
  codeBg: string;
  codeBorder: string;
  pageBg?: string;
}

const KEYWORD_PALETTES: { keywords: string[]; palette: Palette }[] = [
  {
    keywords: ["ice", "frost", "arctic", "glacier", "frozen", "tundra", "blizzard", "snow", "winter", "crystal"],
    palette: {
      h1Color: "#0c4a6e", accentColor: "#38bdf8",
      borderLight: "#bae6fd", borderLighter: "#e0f2fe", bgTint: "#f0f9ff",
      codeFg: "#6d28d9", codeBg: "#f5f3ff", codeBorder: "#ddd6fe",
      pageBg: "#f0f9ff",
    },
  },
  {
    keywords: ["fire", "flame", "lava", "volcano", "inferno", "blaze", "ember", "hot", "burn"],
    palette: {
      h1Color: "#7c2d12", accentColor: "#f97316",
      borderLight: "#fdba74", borderLighter: "#fed7aa", bgTint: "#fff7ed",
      codeFg: "#be123c", codeBg: "#fff1f2", codeBorder: "#fecdd3",
      pageBg: "#fffaf5",
    },
  },
  {
    keywords: ["ocean", "sea", "wave", "marine", "nautical", "deep", "water", "tide", "reef", "pacific"],
    palette: {
      h1Color: "#1e3a8a", accentColor: "#0ea5e9",
      borderLight: "#bae6fd", borderLighter: "#dbeafe", bgTint: "#eff6ff",
      codeFg: "#7c3aed", codeBg: "#f5f3ff", codeBorder: "#ddd6fe",
      pageBg: "#f5f9ff",
    },
  },
  {
    keywords: ["forest", "jungle", "nature", "tree", "leaf", "moss", "fern", "botanical", "woodland"],
    palette: {
      h1Color: "#14532d", accentColor: "#16a34a",
      borderLight: "#bbf7d0", borderLighter: "#d1fae5", bgTint: "#f0fdf4",
      codeFg: "#be123c", codeBg: "#fff1f2", codeBorder: "#fecdd3",
    },
  },
  {
    keywords: ["sunset", "dusk", "twilight", "golden", "horizon", "dawn", "sunrise"],
    palette: {
      h1Color: "#7c2d12", accentColor: "#f59e0b",
      borderLight: "#fcd34d", borderLighter: "#fde68a", bgTint: "#fff7ed",
      codeFg: "#db2777", codeBg: "#fdf2f8", codeBorder: "#fbcfe8",
      pageBg: "#fffbf0",
    },
  },
  {
    keywords: ["night", "dark", "midnight", "space", "galaxy", "cosmos", "star", "universe", "void", "abyss"],
    palette: {
      h1Color: "#1e1b4b", accentColor: "#818cf8",
      borderLight: "#c7d2fe", borderLighter: "#e0e7ff", bgTint: "#eef2ff",
      codeFg: "#c026d3", codeBg: "#fdf4ff", codeBorder: "#f0abfc",
      pageBg: "#f5f5ff",
    },
  },
  {
    keywords: ["cherry", "blossom", "sakura", "spring", "bloom", "floral", "petal", "flower", "garden"],
    palette: {
      h1Color: "#881337", accentColor: "#f43f5e",
      borderLight: "#fda4af", borderLighter: "#fecdd3", bgTint: "#fff1f2",
      codeFg: "#0284c7", codeBg: "#f0f9ff", codeBorder: "#bae6fd",
      pageBg: "#fff8f9",
    },
  },
  {
    keywords: ["autumn", "fall", "harvest", "maple", "pumpkin", "october", "russet", "foliage"],
    palette: {
      h1Color: "#78350f", accentColor: "#b45309",
      borderLight: "#fcd34d", borderLighter: "#fde68a", bgTint: "#fef3c7",
      codeFg: "#b91c1c", codeBg: "#fef2f2", codeBorder: "#fca5a5",
      pageBg: "#fefdf5",
    },
  },
  {
    keywords: ["candy", "sweet", "bubblegum", "cotton", "pastel", "kawaii", "sugar", "marshmallow"],
    palette: {
      h1Color: "#9d174d", accentColor: "#ec4899",
      borderLight: "#fbcfe8", borderLighter: "#fce7f3", bgTint: "#fdf2f8",
      codeFg: "#7c3aed", codeBg: "#f5f3ff", codeBorder: "#ddd6fe",
      pageBg: "#fff8fd",
    },
  },
  {
    keywords: ["coffee", "mocha", "chocolate", "espresso", "latte", "cocoa", "brown", "caramel", "toffee"],
    palette: {
      h1Color: "#292524", accentColor: "#a16207",
      borderLight: "#d6d3d1", borderLighter: "#e7e5e4", bgTint: "#fafaf9",
      codeFg: "#b91c1c", codeBg: "#fef2f2", codeBorder: "#fca5a5",
      pageBg: "#fdf9f7",
    },
  },
  {
    keywords: ["lavender", "lilac", "violet", "purple", "grape", "amethyst", "mauve", "plum", "orchid"],
    palette: {
      h1Color: "#4c1d95", accentColor: "#8b5cf6",
      borderLight: "#ddd6fe", borderLighter: "#ede9fe", bgTint: "#f5f3ff",
      codeFg: "#be123c", codeBg: "#fff1f2", codeBorder: "#fecdd3",
      pageBg: "#fbf9ff",
    },
  },
  {
    keywords: ["mint", "spearmint", "fresh", "menthol", "clean", "crisp", "lime", "citrus"],
    palette: {
      h1Color: "#065f46", accentColor: "#10b981",
      borderLight: "#a7f3d0", borderLighter: "#d1fae5", bgTint: "#ecfdf5",
      codeFg: "#0369a1", codeBg: "#f0f9ff", codeBorder: "#bae6fd",
    },
  },
  {
    keywords: ["gold", "luxury", "royal", "premium", "elegant", "opulent", "rich", "regal"],
    palette: {
      h1Color: "#713f12", accentColor: "#d97706",
      borderLight: "#fcd34d", borderLighter: "#fde68a", bgTint: "#fffbeb",
      codeFg: "#7c3aed", codeBg: "#f5f3ff", codeBorder: "#ddd6fe",
    },
  },
  {
    keywords: ["neon", "cyber", "electric", "glitch", "tech", "digital", "matrix", "synthwave", "retro"],
    palette: {
      h1Color: "#172554", accentColor: "#06b6d4",
      borderLight: "#a5f3fc", borderLighter: "#cffafe", bgTint: "#ecfeff",
      codeFg: "#a21caf", codeBg: "#fdf4ff", codeBorder: "#f0abfc",
      pageBg: "#f0feff",
    },
  },
  {
    keywords: ["rose", "blush", "pink", "flamingo", "peony", "coral", "salmon"],
    palette: {
      h1Color: "#9d174d", accentColor: "#f472b6",
      borderLight: "#fbcfe8", borderLighter: "#fce7f3", bgTint: "#fdf2f8",
      codeFg: "#1d4ed8", codeBg: "#eff6ff", codeBorder: "#bfdbfe",
      pageBg: "#fff8fc",
    },
  },
  {
    keywords: ["sky", "cloud", "air", "breeze", "light", "serene", "calm", "clear", "blue"],
    palette: {
      h1Color: "#1e40af", accentColor: "#60a5fa",
      borderLight: "#bfdbfe", borderLighter: "#dbeafe", bgTint: "#eff6ff",
      codeFg: "#be123c", codeBg: "#fff1f2", codeBorder: "#fecdd3",
      pageBg: "#f5f9ff",
    },
  },
  {
    keywords: ["desert", "sand", "dune", "sahara", "arid", "warm", "earth", "clay", "terracotta"],
    palette: {
      h1Color: "#7c2d12", accentColor: "#ea580c",
      borderLight: "#fed7aa", borderLighter: "#ffedd5", bgTint: "#fff7ed",
      codeFg: "#166534", codeBg: "#f0fdf4", codeBorder: "#bbf7d0",
      pageBg: "#fefaf5",
    },
  },
  {
    keywords: ["storm", "thunder", "lightning", "rain", "cloud", "gray", "grey", "overcast", "fog", "mist"],
    palette: {
      h1Color: "#1e293b", accentColor: "#64748b",
      borderLight: "#cbd5e1", borderLighter: "#e2e8f0", bgTint: "#f1f5f9",
      codeFg: "#c2410c", codeBg: "#fff7ed", codeBorder: "#fed7aa",
      pageBg: "#f8fafc",
    },
  },
  {
    keywords: ["wine", "merlot", "burgundy", "bordeaux", "crimson", "red", "blood", "scarlet"],
    palette: {
      h1Color: "#4c0519", accentColor: "#e11d48",
      borderLight: "#fda4af", borderLighter: "#fecdd3", bgTint: "#fff1f2",
      codeFg: "#0369a1", codeBg: "#f0f9ff", codeBorder: "#bae6fd",
    },
  },
  {
    keywords: ["teal", "aqua", "turquoise", "caribbean", "tropical", "lagoon", "maldives"],
    palette: {
      h1Color: "#134e4a", accentColor: "#0d9488",
      borderLight: "#99f6e4", borderLighter: "#ccfbf1", bgTint: "#f0fdfa",
      codeFg: "#be123c", codeBg: "#fff1f2", codeBorder: "#fecdd3",
    },
  },
  {
    keywords: ["rainbow", "pride", "colorful", "vibrant", "multicolor", "spectrum"],
    palette: {
      h1Color: "#7c3aed", accentColor: "#ec4899",
      borderLight: "#fda4af", borderLighter: "#fce7f3", bgTint: "#fdf4ff",
      codeFg: "#0284c7", codeBg: "#f0f9ff", codeBorder: "#bae6fd",
    },
  },
  {
    keywords: ["moss", "earth", "organic", "natural", "clay", "mud", "soil", "terrain"],
    palette: {
      h1Color: "#365314", accentColor: "#65a30d",
      borderLight: "#d9f99d", borderLighter: "#ecfccb", bgTint: "#f7fee7",
      codeFg: "#c2410c", codeBg: "#fff7ed", codeBorder: "#fed7aa",
    },
  },
];

// Simple deterministic hash → hsl for unknown inputs
function hashColor(str: string, saturation = 65, lightness = 35): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

function hslLight(str: string, s = 70, l = 93): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, ${s}%, ${l}%)`;
}

export function generateThemeFromPrompt(input: string): Theme {
  const tokens = input.toLowerCase().split(/\s+|,|;/);

  // Score each palette by keyword matches
  let bestScore = 0;
  let bestPalette: Palette | null = null;

  for (const entry of KEYWORD_PALETTES) {
    const score = tokens.filter(t => entry.keywords.some(k => k.includes(t) || t.includes(k))).length;
    if (score > bestScore) {
      bestScore = score;
      bestPalette = entry.palette;
    }
  }

  // Fallback: generate from hash
  if (!bestPalette || bestScore === 0) {
    const seed = input.trim() || "custom";
    const h1 = hashColor(seed, 60, 28);
    const accent = hashColor(seed + "a", 70, 42);
    const light = hslLight(seed, 60, 88);
    const lighter = hslLight(seed, 50, 94);
    const bg = hslLight(seed, 40, 97);
    bestPalette = {
      h1Color: h1, accentColor: accent,
      borderLight: light, borderLighter: lighter, bgTint: bg,
      codeFg: hashColor(seed + "code", 65, 35),
      codeBg: hslLight(seed + "code", 55, 96),
      codeBorder: hslLight(seed + "code", 55, 88),
    };
  }

  return {
    id: `custom-${input.toLowerCase().replace(/\s+/g, "-").slice(0, 32)}`,
    name: input.trim().slice(0, 24) || "Custom",
    ...bestPalette,
  };
}
