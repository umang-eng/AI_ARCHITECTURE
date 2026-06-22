import { StyleEngine } from "../src/interior/engine/style-engine";
import { MaterialRecommender } from "../src/interior/engine/material-recommender";
import { LightingDesigner } from "../src/interior/engine/lighting-designer";
import { DecorationPlacer } from "../src/interior/engine/decoration-placer";
import { LayoutOptimizer } from "../src/interior/engine/layout-optimizer";
import { InteriorScorer } from "../src/interior/engine/interior-scorer";
import { InteriorPipeline } from "../src/interior/engine/interior-pipeline";

async function testPhase6() {
  console.log("--- STARTING PHASE 6 INTERIOR DESIGNER AI INTEGRATION TEST ---");

  // Sample inputs
  const style = "luxury";
  const budget = "premium";
  const roomType = "bedroom";
  const width = 14.0;
  const height = 16.0;
  const dummyFurniture = [
    { id: "f_bed", type: "bed", x: 7.0, y: 5.3, width: 6.0, height: 6.5, rotation: 0 },
    { id: "f_wardrobe", type: "wardrobe", x: 2.0, y: 12.0, width: 5.0, height: 2.2, rotation: 0 }
  ];

  console.log("Step 1: Testing StyleEngine configuration mapping...");
  const theme = StyleEngine.getThemeColors(style);
  console.log(` - Theme floor color: ${theme.floorHex}`);
  console.log(` - Theme walls color: ${theme.wallsHex}`);
  console.log(` - Warmth Kelvin temperature: ${theme.kelvin}K`);
  if (theme.kelvin !== 2700) {
    throw new Error(`StyleEngine Kelvin mismatch: expected 2700, got ${theme.kelvin}`);
  }

  console.log("Step 2: Testing MaterialRecommender texture definitions...");
  const furnitureIds = dummyFurniture.map(f => f.id);
  const materials = MaterialRecommender.recommendMaterials(style, budget, furnitureIds);
  console.log(` - Materials spec count generated: ${materials.length}`);
  const floorSpec = materials.find(m => m.element === "floor");
  if (!floorSpec) {
    throw new Error("Missing flooring spec in material recommendations!");
  }
  console.log(` - Recommended Flooring: ${floorSpec.materialName} (Color: ${floorSpec.colorHex}, Roughness: ${floorSpec.roughness})`);
  if (!floorSpec.materialName.includes("Premium")) {
    throw new Error(`Budget material branding mismatch: expected Premium, got ${floorSpec.materialName}`);
  }

  console.log("Step 3: Testing LightingDesigner fixture layouts...");
  const lights = LightingDesigner.designLighting(roomType, width, height, style);
  console.log(` - Light fixtures nodes generated: ${lights.length}`);
  const ambientLight = lights.find(l => l.type === "ambient");
  if (!ambientLight) {
    throw new Error("Missing overhead ambient lighting spec!");
  }
  console.log(` - Ambient central light: Kelvin=${ambientLight.colorKelvin}K, Coordinates=(${ambientLight.x}, ${ambientLight.y}, ${ambientLight.z})`);

  console.log("Step 4: Testing DecorationPlacer positions...");
  const rawDecorations = DecorationPlacer.placeDecorations(roomType, width, height, style);
  console.log(` - Raw decorations placed: ${rawDecorations.length}`);
  const rug = rawDecorations.find(d => d.type === "rug");
  if (!rug) {
    throw new Error("DecorationPlacer failed to position flooring rug!");
  }
  console.log(` - Rug center position: (${rug.x}, ${rug.y}), Size: ${rug.width}x${rug.height} ft`);

  console.log("Step 5: Testing LayoutOptimizer door swing collision avoidance...");
  // Simulate a door sweep at x=2.0, y=12.0 (near the wardrobe)
  const doors = [{ x: 2.0, y: 12.0, width: 3.0 }];
  const optimizedDecorations = LayoutOptimizer.optimizeLayout(rawDecorations, width, height, doors);
  console.log(` - Optimized decorations count: ${optimizedDecorations.length}`);
  
  // Make sure no decorations (excluding rugs) violate door clearance limits
  optimizedDecorations.forEach(d => {
    if (d.type !== "rug") {
      const dist = Math.hypot(d.x - 2.0, d.y - 12.0);
      if (dist < 2.99) {
        throw new Error(`Layout collision check failed: Item ${d.id} is too close to door (${dist} ft)!`);
      }
    }
  });
  console.log(" - Layout optimizer boundary & door clearance checks passed successfully.");

  console.log("Step 6: Testing InteriorScorer math rules...");
  const scoring = InteriorScorer.scoreInterior(materials, lights, style, budget);
  console.log(` - Aesthetic design score: ${scoring.score}/100`);
  console.log(" - Score breakdown:", scoring.breakdown);
  console.log(" - Critiques list count:", scoring.critiques.length);
  if (scoring.score <= 0 || scoring.score > 100) {
    throw new Error(`Scoring engine produced invalid range value: ${scoring.score}`);
  }

  console.log("Step 7: Testing InteriorPipeline execution fallback...");
  const pipelineResult = await InteriorPipeline.generateDesign({
    roomType,
    width,
    height,
    furniture: dummyFurniture.map(f => ({ ...f, rotation: 0 })),
    style,
    budget
  });
  console.log(` - Pipeline design score: ${pipelineResult.designScore}`);
  console.log(` - Pipeline materials count: ${pipelineResult.materialJson.length}`);
  console.log(` - Pipeline lighting count: ${pipelineResult.lightingJson.length}`);
  console.log(` - Pipeline decorations count: ${pipelineResult.interiorJson.length}`);
  
  if (pipelineResult.designScore !== scoring.score) {
    throw new Error("Pipeline result score does not match direct scorer output!");
  }

  console.log("--- PHASE 6 INTERIOR DESIGNER AI INTEGRATION TEST SUCCESSFUL ---");
}

testPhase6().catch(err => {
  console.error("Integration test encountered failure:", err);
  process.exit(1);
});
