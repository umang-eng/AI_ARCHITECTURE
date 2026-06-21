import { StyleConfig } from "../types";

export const STYLE_TEMPLATES: Record<string, StyleConfig> = {
  modern: {
    sizeMultiplier: 1.0,
    itemDensity: "medium",
    themeColors: {
      sofa: "#3b82f6",     // Slate Blue
      bed: "#6366f1",      // Indigo
      dining: "#10b981",   // Emerald
      office: "#8b5cf6",   // Violet
      cabinet: "#64748b",  // Slate Grey
      fixture: "#0ea5e9",  // Sky Blue
    },
  },
  luxury: {
    sizeMultiplier: 1.15,
    itemDensity: "high",
    themeColors: {
      sofa: "#b45309",     // Amber/Gold Accent
      bed: "#701a75",      // Velvet Wine
      dining: "#0f766e",   // Rich Teal
      office: "#4c1d95",   // Royal Purple
      cabinet: "#451a03",  // Dark Mahogany
      fixture: "#0369a1",  // Deep Ocean Blue
    },
  },
  minimalist: {
    sizeMultiplier: 0.85,
    itemDensity: "low",
    themeColors: {
      sofa: "#94a3b8",     // Cool Grey
      bed: "#cbd5e1",      // Light Slate
      dining: "#64748b",   // Muted Charcoal
      office: "#475569",   // Dark Slate
      cabinet: "#e2e8f0",  // Soft Off-White
      fixture: "#cbd5e1",  // Neutral Grey
    },
  },
  scandinavian: {
    sizeMultiplier: 0.95,
    itemDensity: "medium",
    themeColors: {
      sofa: "#a7f3d0",     // Pale Mint
      bed: "#fbcfe8",      // Light Rose
      dining: "#fef08a",   // Light Birch Yellow
      office: "#c084fc",   // Lavender
      cabinet: "#f1f5f9",  // Ash White
      fixture: "#a5f3fc",  // Ice Blue
    },
  },
  industrial: {
    sizeMultiplier: 1.05,
    itemDensity: "medium",
    themeColors: {
      sofa: "#78350f",     // Distressed Leather
      bed: "#1e293b",      // Steel Black
      dining: "#451a03",   // Reclaimed Wood Dark
      office: "#0f172a",   // Wrought Iron
      cabinet: "#334155",  // Gunmetal Grey
      fixture: "#0f172a",  // Matte Black
    },
  },
  traditional: {
    sizeMultiplier: 1.1,
    itemDensity: "high",
    themeColors: {
      sofa: "#991b1b",     // Burgundy Red
      bed: "#1e3a8a",      // Classic Navy
      dining: "#78350f",   // Classic Oak
      office: "#14532d",   // Forest Green
      cabinet: "#7c2d12",  // Warm Cherry Wood
      fixture: "#0369a1",  // Classical Blue
    },
  },
  contemporary: {
    sizeMultiplier: 1.0,
    itemDensity: "medium",
    themeColors: {
      sofa: "#f43f5e",     // Coral Red
      bed: "#ec4899",      // Vibrant Pink
      dining: "#14b8a6",   // Turquoise
      office: "#f59e0b",   // Amber Yellow
      cabinet: "#1e293b",  // Charcoal Black
      fixture: "#06b6d4",  // Cyan Accent
    },
  },
};

export function getStyleTemplate(style: string): StyleConfig {
  const norm = style.toLowerCase();
  if (norm.includes("luxury") || norm.includes("villa")) return STYLE_TEMPLATES.luxury;
  if (norm.includes("minimal")) return STYLE_TEMPLATES.minimalist;
  if (norm.includes("scandi")) return STYLE_TEMPLATES.scandinavian;
  if (norm.includes("industrial")) return STYLE_TEMPLATES.industrial;
  if (norm.includes("traditional")) return STYLE_TEMPLATES.traditional;
  if (norm.includes("contemporary")) return STYLE_TEMPLATES.contemporary;
  return STYLE_TEMPLATES.modern;
}
