import { generateProceduralBlueprint } from "../src/blueprint/engine/procedural-generator";
import { generateProceduralFurniture } from "../src/furniture/engine/procedural-furniture";
import { validateFurnitureLayout } from "../src/furniture/validators/furniture-validator";
import { computeFurnitureAnalytics } from "../src/furniture/analytics/furniture-analytics";
import { generateCommands } from "../src/blueprint/generators/command-generator";

function testPhase3() {
  console.log("--- STARTING PHASE 3 FURNITURE ENGINE TEST ---");

  const requirements = {
    plotWidth: 60,
    plotHeight: 80,
    bedrooms: 3,
    bathrooms: 2,
    floors: 1,
    buildingType: "villa",
    style: "modern",
    prompt: "Modern villa with 3 bedrooms, garage, office, garden"
  };

  console.log("Step 1: Generating procedural room layout...");
  const bp = generateProceduralBlueprint(requirements as any);
  console.log(`Placed ${bp.rooms.length} rooms successfully.`);

  console.log("Step 2: Placing furniture in all rooms (100 candidate layouts search)...");
  const start = Date.now();
  const furniture = generateProceduralFurniture(bp, requirements.style);
  const elapsed = Date.now() - start;
  console.log(`Furniture placement completed in ${elapsed} ms! Placed ${furniture.length} items.`);

  bp.furniture = furniture;

  console.log("Step 3: Running furniture validator...");
  const report = validateFurnitureLayout(furniture, bp);
  console.log("Furniture Validation Report:", JSON.stringify(report, null, 2));

  console.log("Step 4: Running furniture spatial analytics...");
  const analytics = computeFurnitureAnalytics(furniture, bp);
  console.log("Furniture Analytics Report:", JSON.stringify(analytics, null, 2));

  console.log("Step 5: Generating drawing commands (including DRAW_FURNITURE)...");
  const commands = generateCommands(bp);
  const furnitureCmds = commands.filter((c) => c.type === "DRAW_FURNITURE");
  console.log(`Generated ${commands.length} total drawing commands, including ${furnitureCmds.length} DRAW_FURNITURE commands.`);
  
  if (furnitureCmds.length > 0) {
    console.log("First placed furniture command sample:", JSON.stringify(furnitureCmds[0], null, 2));
  }

  console.log("--- PHASE 3 FURNITURE ENGINE TEST SUCCESSFUL ---");
}

testPhase3();
