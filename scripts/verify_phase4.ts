import { VisionValidator } from "../src/vision/validators/vision-validator";
import { DimensionEstimator } from "../src/vision/estimators/dimension-estimator";
import { LayoutAnalyzer } from "../src/vision/analyzers/layout-analyzer";
import { FurnitureRecommendationEngine } from "../src/vision/analyzers/furniture-recommendation";
import { RenovationAnalyzer } from "../src/vision/analyzers/renovation-analyzer";
import { VisionCanvasRenderer } from "../src/vision/renderers/vision-canvas-renderer";
import type { VisionAnalysisResult } from "../src/vision/types";

function testPhase4() {
  console.log("--- STARTING PHASE 4 VISION INTELLIGENCE ENGINE INTEGRATION TEST ---");

  // Mocking visual detection payload from a bedroom photo
  const rawVlmOutput: any = {
    roomType: "bedroom",
    dimensions: { width: 10.0, height: 12.0 }, // slightly downscaled raw pixels or estimates
    furniture: [
      { id: "bed_1", type: "bed", x: 2.0, y: 1.0, width: 4.5, height: 5.0, rotation: 0 },
      { id: "nightstand_1", type: "nightstand", x: 0.5, y: 1.0, width: 1.2, height: 1.2, rotation: 0 },
    ],
    doors: [
      { id: "door_1", x: 8.5, y: 12.0, width: 2.5, orientation: "horizontal" }, // door is 2.5ft (should be calibrated to standard 3ft)
    ],
    windows: [
      { id: "window_1", x: 5.0, y: 0.0, width: 3.5, orientation: "horizontal" },
    ],
    layoutScore: 78
  };

  console.log("Step 1: Validating Raw VLM response schema...");
  const validation = VisionValidator.validate(rawVlmOutput);
  console.log(`Validation result: isValid=${validation.isValid}, errors=${validation.errors.length}`);
  if (!validation.isValid) {
    throw new Error(`Validation failed: ${validation.errors.join(", ")}`);
  }

  console.log("Step 2: Calibrating coordinate scales relative to 3.0ft door anchor...");
  const calibrated = DimensionEstimator.calibrateScale(rawVlmOutput, "door", 3.0);
  console.log(`Original dimensions: ${rawVlmOutput.dimensions.width} x ${rawVlmOutput.dimensions.height}`);
  console.log(`Calibrated dimensions: ${calibrated.dimensions.width} x ${calibrated.dimensions.height}`);

  console.log("Step 3: Calculating spatial layout scores...");
  const layoutReport = LayoutAnalyzer.analyze(calibrated);
  console.log("Layout Diagnostics Score:", layoutReport.score);
  console.log("Sub-scores:", JSON.stringify(layoutReport.subScores, null, 2));
  console.log("Critiques:", layoutReport.critiques);

  console.log("Step 4: Executing Furniture Recommendation Engine...");
  const recommendations = FurnitureRecommendationEngine.getRecommendations(calibrated);
  console.log(`Recommended ${recommendations.length} missing items:`);
  recommendations.forEach(r => {
    console.log(` - Add ${r.furnitureType} (${r.priority}): ${r.reason}`);
  });

  console.log("Step 5: Generating interior renovation suggestions...");
  const renovationSuggestions = RenovationAnalyzer.generateSuggestions(calibrated, "modern");
  console.log(`Created ${renovationSuggestions.length} suggestions:`);
  renovationSuggestions.forEach(s => {
    console.log(` - [${s.category}] ${s.description} (Cost: ${s.costEstimate})`);
  });

  console.log("Step 6: Converting layout to canvas drawing commands...");
  const commands = VisionCanvasRenderer.convertToCommands(calibrated);
  console.log(`Generated ${commands.length} canvas drawing commands successfully.`);
  
  const roomCmd = commands.find(c => c.type === "DRAW_ROOM");
  const furnitureCmds = commands.filter(c => c.type === "DRAW_FURNITURE");
  console.log(` - DRAW_ROOM command payload:`, JSON.stringify(roomCmd?.payload, null, 2));
  console.log(` - Generated ${furnitureCmds.length} DRAW_FURNITURE commands.`);

  console.log("--- PHASE 4 VISION INTELLIGENCE ENGINE INTEGRATION TEST SUCCESSFUL ---");
}

testPhase4();
