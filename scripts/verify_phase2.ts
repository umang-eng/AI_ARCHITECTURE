import { generateProceduralBlueprint } from "../src/blueprint/engine/procedural-generator";
import { validateBlueprint } from "../src/blueprint/validators/blueprint-validator";
import { computeBlueprintAnalytics } from "../src/blueprint/analytics/blueprint-analytics";
import { generateCommands } from "../src/blueprint/generators/command-generator";

function testPhase2() {
  console.log("--- STARTING PHASE 2 INTEGRATION TEST ---");

  const requirements = {
    plotWidth: 60,
    plotHeight: 80,
    bedrooms: 4,
    bathrooms: 2.5,
    floors: 2,
    buildingType: "villa",
    style: "luxury",
    prompt: "Luxury villa with a garage, office, garden, and staircase"
  };

  console.log("Generating 100 layouts, repairing, and selecting best layout...");
  const start = Date.now();
  const bp = generateProceduralBlueprint(requirements as any);
  const elapsed = Date.now() - start;

  console.log(`Layout selection completed in ${elapsed} ms!`);

  console.log("Selected Blueprint details:");
  console.log(`Plot size: ${bp.plot.width} x ${bp.plot.height}`);
  console.log(`Total Rooms placed: ${bp.rooms.length}`);
  for (const r of bp.rooms) {
    console.log(` - ${r.name} (${r.type}): coordinates (${r.x}, ${r.y}), size ${r.width}x${r.height}`);
  }

  console.log("Running validator on the selected blueprint...");
  const report = validateBlueprint(bp, requirements.floors);
  console.log("Validation Report:", JSON.stringify(report, null, 2));

  console.log("Running analytics on the selected blueprint...");
  const analytics = computeBlueprintAnalytics(bp);
  console.log("Analytics Report:", JSON.stringify(analytics, null, 2));

  console.log("Generating Drawing Commands...");
  const commands = generateCommands(bp);
  console.log(`Generated ${commands.length} canvas drawing commands successfully!`);
  const listTypes = commands.map((c) => c.type);
  console.log("Command distribution:", listTypes.reduce((acc: any, t) => {
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {}));

  console.log("--- PHASE 2 INTEGRATION TEST SUCCESSFUL ---");
}

testPhase2();
