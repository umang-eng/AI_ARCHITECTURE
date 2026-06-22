import { MaterialSpec, LightSpec, DecorationSpec } from "../types";

export class StyleEngine {
  /**
   * Client-side mapping of style parameters to allow instant styling overrides.
   */
  public static getThemeColors(style: string): {
    floorHex: string;
    wallsHex: string;
    ceilingHex: string;
    furnitureHex: string;
    kelvin: number;
  } {
    const s = style.toLowerCase().trim();
    if (s.includes("minimal")) {
      return { floorHex: "#e2e8f0", wallsHex: "#f8fafc", ceilingHex: "#ffffff", furnitureHex: "#64748b", kelvin: 3500 };
    }
    if (s.includes("scandi") || s.includes("japandi")) {
      return { floorHex: "#cbd5e1", wallsHex: "#f1f5f9", ceilingHex: "#ffffff", furnitureHex: "#a7f3d0", kelvin: 3000 };
    }
    if (s.includes("japanese")) {
      return { floorHex: "#eab308", wallsHex: "#fef08a", ceilingHex: "#ffffff", furnitureHex: "#78350f", kelvin: 2700 };
    }
    if (s.includes("industrial")) {
      return { floorHex: "#94a3b8", wallsHex: "#b45309", ceilingHex: "#ffffff", furnitureHex: "#1e293b", kelvin: 2500 };
    }
    if (s.includes("luxury")) {
      return { floorHex: "#ffffff", wallsHex: "#f5e0c3", ceilingHex: "#ffffff", furnitureHex: "#b45309", kelvin: 2700 };
    }
    if (s.includes("traditional")) {
      return { floorHex: "#451a03", wallsHex: "#fef3c7", ceilingHex: "#ffffff", furnitureHex: "#991b1b", kelvin: 2700 };
    }
    if (s.includes("contemporary")) {
      return { floorHex: "#0f172a", wallsHex: "#d1d5db", ceilingHex: "#ffffff", furnitureHex: "#f43f5e", kelvin: 3000 };
    }
    // Default Modern
    return { floorHex: "#cbd5e1", wallsHex: "#ffffff", ceilingHex: "#ffffff", furnitureHex: "#3b82f6", kelvin: 3000 };
  }
}
