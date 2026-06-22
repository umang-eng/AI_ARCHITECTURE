import { MaterialSpec } from "../types";
import { StyleEngine } from "./style-engine";

export class MaterialRecommender {
  /**
   * Recommend material specifications for spatial components based on style and budget.
   */
  public static recommendMaterials(
    style: string,
    budget: string,
    furnitureIds: string[]
  ): MaterialSpec[] {
    const theme = StyleEngine.getThemeColors(style);
    const s = style.toLowerCase().trim();
    const b = budget.toLowerCase().trim();

    // Determine floor material names
    let floorMat = "Oak Hardwood Plank";
    let floorType = "wood";
    let roughness = 0.5;
    let metalness = 0.0;

    if (s.includes("minimal")) {
      floorMat = "Bleached Maple Plank";
    } else if (s.includes("scandi") || s.includes("japandi")) {
      floorMat = "Light Ash Hardwood";
    } else if (s.includes("japanese")) {
      floorMat = "Tatami Straw Mats";
      floorType = "tatami";
      roughness = 0.95;
    } else if (s.includes("industrial")) {
      floorMat = "Polished Concrete Slab";
      floorType = "concrete";
      roughness = 0.3;
      metalness = 0.2;
    } else if (s.includes("luxury")) {
      floorMat = "Carrara White Marble";
      floorType = "marble";
      roughness = 0.1;
      metalness = 0.3;
    } else if (s.includes("traditional")) {
      floorMat = "Dark Walnut Hardwood";
    } else if (s.includes("contemporary")) {
      floorMat = "Ebony Stained Maple";
    }

    // Budget adjustments
    if (b === "economy") {
      floorMat = "Laminate " + floorMat.split(" ").slice(-1)[0];
      roughness = Math.min(0.9, roughness * 1.2);
    } else if (b === "premium") {
      floorMat = "Imported Premium Select " + floorMat;
      roughness = Math.max(0.05, roughness * 0.9);
    }

    const materials: MaterialSpec[] = [
      {
        element: "floor",
        materialName: floorMat,
        colorHex: theme.floorHex,
        roughness,
        metalness,
        textureType: floorType,
      },
      {
        element: "walls",
        materialName: s.includes("industrial") ? "Exposed Brick Wall" : "Matte Paint Finish",
        colorHex: theme.wallsHex,
        roughness: 0.9,
        metalness: 0.0,
        textureType: s.includes("industrial") ? "brick" : "paint",
      },
      {
        element: "ceiling",
        materialName: "Standard Plaster White",
        colorHex: theme.ceilingHex,
        roughness: 0.95,
        metalness: 0.0,
        textureType: "paint",
      },
    ];

    furnitureIds.forEach(fid => {
      materials.push({
        element: fid,
        materialName: "Styled Fabric / Wood Spec",
        colorHex: theme.furnitureHex,
        roughness: 0.6,
        metalness: 0.1,
        textureType: "upholstery",
      });
    });

    return materials;
  }
}
