import { LightSpec } from "../types";
import { StyleEngine } from "./style-engine";

export class LightingDesigner {
  /**
   * Layout light fixtures inside a room coordinate system.
   */
  public static designLighting(
    roomType: string,
    width: number,
    height: number,
    style: string
  ): LightSpec[] {
    const theme = StyleEngine.getThemeColors(style);
    const lights: LightSpec[] = [];

    // 1. Ambient Central Chandelier/Flush mount
    lights.push({
      id: "light_center",
      type: "ambient",
      x: width / 2,
      y: height / 2,
      z: 8.8,
      intensity: 1.0,
      colorKelvin: theme.kelvin,
      colorHex: theme.kelvin < 3000 ? "#ffebd6" : "#f1f5f9",
    });

    const isBedroom = roomType.toLowerCase().includes("bed");
    const isLiving = roomType.toLowerCase().includes("living");

    // 2. Task / Accent Fixtures
    if (isBedroom) {
      // Bedside task lamps
      lights.push({
        id: "light_bedside_l",
        type: "task",
        x: Math.max(1.0, width / 2 - 4.5),
        y: Math.max(1.0, height / 3),
        z: 3.5,
        intensity: 0.7,
        colorKelvin: 2700, // warm reading light
        colorHex: "#ffe4e6",
      });
      lights.push({
        id: "light_bedside_r",
        type: "task",
        x: Math.min(width - 1.0, width / 2 + 4.5),
        y: Math.max(1.0, height / 3),
        z: 3.5,
        intensity: 0.7,
        colorKelvin: 2700,
        colorHex: "#ffe4e6",
      });
    } else if (isLiving) {
      // Warm spotlight on art/TV panel
      lights.push({
        id: "light_spot_focus",
        type: "accent",
        x: width / 2,
        y: height - 1.0,
        z: 7.5,
        intensity: 1.2,
        colorKelvin: 3200,
        colorHex: "#fef08a",
      });
    }

    return lights;
  }
}
