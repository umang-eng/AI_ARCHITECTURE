import { InteriorDesignResult, PipelineFurnitureItem } from "../types";
import { MaterialRecommender } from "./material-recommender";
import { LightingDesigner } from "./lighting-designer";
import { DecorationPlacer } from "./decoration-placer";
import { LayoutOptimizer } from "./layout-optimizer";
import { InteriorScorer } from "./interior-scorer";

export class InteriorPipeline {
  /**
   * Run the interior design pipeline.
   */
  public static async generateDesign(input: {
    roomType: string;
    width: number;
    height: number;
    furniture: PipelineFurnitureItem[];
    style: string;
    budget: string;
  }): Promise<InteriorDesignResult> {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    console.log(`[InteriorPipeline] Fetching design recommendations: style=${input.style}, budget=${input.budget}`);

    try {
      const response = await fetch(`${apiBase}/api/v1/interior/design`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomType: input.roomType,
          width: input.width,
          height: input.height,
          furniture: input.furniture,
          style: input.style,
          budget: input.budget,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          return {
            style: data.style || input.style,
            budget: data.budget || input.budget,
            materialJson: data.materialJson || [],
            lightingJson: data.lightingJson || [],
            interiorJson: data.interiorJson || [],
            designScore: data.designScore || 0,
            scoreBreakdown: data.scoreBreakdown || {
              colorHarmony: 0,
              lightingAdequacy: 0,
              spaceClearance: 0,
              materialBalance: 0,
            },
            critiques: data.critiques || [],
          };
        }
      }
      console.warn("[InteriorPipeline] Backend API failed, falling back to local design engine execution.");
    } catch (e) {
      console.warn("[InteriorPipeline] Backend connection error, falling back to local design engine execution.", e);
    }

    // Client-side local execution fallback
    const furnitureIds = input.furniture.map(f => f.id);
    const materials = MaterialRecommender.recommendMaterials(input.style, input.budget, furnitureIds);
    const lights = LightingDesigner.designLighting(input.roomType, input.width, input.height, input.style);
    const rawDecorations = DecorationPlacer.placeDecorations(input.roomType, input.width, input.height, input.style);
    
    // Optimize layout (e.g. boundary checks & door clearance)
    const optimizedDecorations = LayoutOptimizer.optimizeLayout(rawDecorations, input.width, input.height, [
      { x: 0, y: 0, width: 3.0 }
    ]);

    const scored = InteriorScorer.scoreInterior(materials, lights, input.style, input.budget);

    return {
      style: input.style,
      budget: input.budget,
      materialJson: materials,
      lightingJson: lights,
      interiorJson: optimizedDecorations,
      designScore: scored.score,
      scoreBreakdown: scored.breakdown,
      critiques: scored.critiques,
    };
  }
}
