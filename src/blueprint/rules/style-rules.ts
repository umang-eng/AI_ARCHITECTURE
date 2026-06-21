export interface StyleRules {
  sizeMultiplier: number;
  minCorridorWidth: number;
  windowDensity: "low" | "medium" | "high";
  allowZoningOverlap: boolean;
  circulationEfficiencyTarget: number; // 0 to 1
  idealAspectRatioMax: number;
}

export const STYLE_RULES: Record<string, StyleRules> = {
  modern: {
    sizeMultiplier: 1.1,
    minCorridorWidth: 3.5,
    windowDensity: "high",
    allowZoningOverlap: true,
    circulationEfficiencyTarget: 0.85,
    idealAspectRatioMax: 2.2,
  },
  luxury: {
    sizeMultiplier: 1.4,
    minCorridorWidth: 5.0,
    windowDensity: "high",
    allowZoningOverlap: false,
    circulationEfficiencyTarget: 0.75, // prioritizes large rooms over compact hallways
    idealAspectRatioMax: 2.0,
  },
  minimalist: {
    sizeMultiplier: 0.9,
    minCorridorWidth: 3.0,
    windowDensity: "medium",
    allowZoningOverlap: true,
    circulationEfficiencyTarget: 0.9,
    idealAspectRatioMax: 2.0,
  },
  commercial: {
    sizeMultiplier: 1.3,
    minCorridorWidth: 6.0, // wide walkways for public occupancy
    windowDensity: "medium",
    allowZoningOverlap: false,
    circulationEfficiencyTarget: 0.8,
    idealAspectRatioMax: 2.5,
  },
  apartment: {
    sizeMultiplier: 0.85,
    minCorridorWidth: 3.0,
    windowDensity: "medium",
    allowZoningOverlap: true,
    circulationEfficiencyTarget: 0.95, // extremely efficient
    idealAspectRatioMax: 2.2,
  },
  duplex: {
    sizeMultiplier: 1.0,
    minCorridorWidth: 3.5,
    windowDensity: "medium",
    allowZoningOverlap: true,
    circulationEfficiencyTarget: 0.85,
    idealAspectRatioMax: 2.2,
  },
  office: {
    sizeMultiplier: 1.15,
    minCorridorWidth: 5.0,
    windowDensity: "high",
    allowZoningOverlap: false,
    circulationEfficiencyTarget: 0.85,
    idealAspectRatioMax: 2.4,
  },
};

export function getStyleRules(style: string): StyleRules {
  const normStyle = style.toLowerCase();
  if (normStyle.includes("luxury") || normStyle.includes("villa")) {
    return STYLE_RULES.luxury;
  }
  return STYLE_RULES[normStyle] || STYLE_RULES.modern;
}
