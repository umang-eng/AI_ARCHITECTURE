import { DecorationSpec } from "../types";

export class DecorationPlacer {
  /**
   * Place decorative objects (rugs, paintings, plants) in standard geometric positions.
   */
  public static placeDecorations(
    roomType: string,
    width: number,
    height: number,
    style: string
  ): DecorationSpec[] {
    const decorations: DecorationSpec[] = [];

    // 1. Center Area Rug
    decorations.push({
      id: "decor_rug_center",
      type: "rug",
      x: width / 2,
      y: height / 2,
      width: Math.min(12, width * 0.7),
      height: Math.min(10, height * 0.6),
      colorHex: "#e2e8f0",
    });

    // 2. Wall Art / Painting (Offset from center on a wall plane)
    decorations.push({
      id: "decor_painting_front",
      type: "painting",
      x: 0.1,
      y: height / 2,
      width: 4.0,
      height: 3.0,
      colorHex: "#3b82f6",
    });

    // 3. Potted Plant (Placed in corner slot)
    decorations.push({
      id: "decor_plant_corner",
      type: "plant",
      x: width - 1.5,
      y: 1.5,
      width: 2.0,
      height: 2.0,
      colorHex: "#16a34a",
    });

    return decorations;
  }
}
