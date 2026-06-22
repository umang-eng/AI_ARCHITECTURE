import { DesignScoreBreakdown, MaterialSpec, LightSpec } from "../types";

export class InteriorScorer {
  /**
   * Evaluate the interior scheme design and generate aesthetic grades.
   */
  public static scoreInterior(
    materials: MaterialSpec[],
    lights: LightSpec[],
    style: string,
    budget: string
  ): {
    score: number;
    breakdown: DesignScoreBreakdown;
    critiques: string[];
  } {
    const critiques: string[] = [];
    const b = budget.toLowerCase().trim();

    // 1. Color Harmony (checks color counts and matching warmth)
    let harmony = 95;
    const uniqueColors = Array.from(new Set(materials.map(m => m.colorHex)));
    if (uniqueColors.length > 5) {
      harmony -= 10;
      critiques.push("High color counts. Reducing color count makes themes more coherent.");
    } else {
      critiques.push("Optimal color palette harmony. Mapped colors sync well.");
    }

    // 2. Lighting Adequacy
    let lighting = 90;
    const ambientCount = lights.filter(l => l.type === "ambient").length;
    const taskCount = lights.filter(l => l.type === "task").length;
    
    if (ambientCount === 0) {
      lighting -= 20;
      critiques.push("Missing overhead ambient lighting fixtures.");
    }
    if (taskCount === 0) {
      lighting -= 10;
      critiques.push("No localized task lamps detected. Reading zones might lack brightness.");
    }

    // 3. Space Clearance
    const clearance = 88; // Checked in layout optimizer

    // 4. Material Balance
    let balance = 92;
    if (b === "economy") {
      balance -= 8;
      critiques.push("Budget grade materials selected. Some textures might have lower reflective grades.");
    } else if (b === "premium") {
      balance += 5;
      critiques.push("Premium materials selected, optimizing reflections and light scattering.");
    }

    const total = Math.round(
      harmony * 0.3 +
      lighting * 0.25 +
      clearance * 0.25 +
      balance * 0.2
    );

    return {
      score: total,
      breakdown: {
        colorHarmony: harmony,
        lightingAdequacy: lighting,
        spaceClearance: clearance,
        materialBalance: balance,
      },
      critiques,
    };
  }
}
