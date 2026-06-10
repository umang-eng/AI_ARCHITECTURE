import { generateProceduralBlueprint } from "../src/blueprint/engine/procedural-generator";
import { createBlueprint } from "../src/blueprint/factory/blueprint-factory";
import { createEntry, entriesToJsonl } from "../src/blueprint/dataset/dataset-generator";
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const OUTPUT_DIR = join(__dirname, "../dataset");

const BUILDING_TYPES = ["villa", "house", "duplex", "apartment", "office"];
const STYLES = ["modern", "minimalist", "industrial", "contemporary", "traditional"];

const TOTAL = 50000;
const BATCH_SIZE = 1000;

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generate(): void {
  const entries: any[] = [];

  for (let i = 0; i < TOTAL; i++) {
    const buildingType = BUILDING_TYPES[randomInt(0, BUILDING_TYPES.length - 1)];
    const style = STYLES[randomInt(0, STYLES.length - 1)];
    const plotWidth = randomInt(30, 100);
    const plotHeight = randomInt(40, 120);
    const bedrooms = randomInt(1, 6);
    const bathrooms = randomInt(1, 4);
    const floors = randomInt(1, 3);

    const procedural = generateProceduralBlueprint({
      plotWidth,
      plotHeight,
      bedrooms,
      bathrooms,
      floors,
      buildingType,
      style,
    });

    const blueprint = createBlueprint(
      procedural.plot.width,
      procedural.plot.height,
      procedural.rooms as any,
    );

    const entry = createEntry(
      buildingType,
      style,
      plotWidth,
      plotHeight,
      bedrooms,
      bathrooms,
      blueprint,
    );

    entries.push(entry);

    if (entries.length >= BATCH_SIZE) {
      const batch = Math.floor(i / BATCH_SIZE) + 1;
      const filename = join(OUTPUT_DIR, `batch-${batch}.jsonl`);
      writeFileSync(filename, entriesToJsonl(entries));
      console.log(`Batch ${batch}: ${entries.length} samples written`);
      entries.length = 0;
    }
  }

  if (entries.length > 0) {
    const batch = Math.ceil(TOTAL / BATCH_SIZE);
    const filename = join(OUTPUT_DIR, `batch-${batch}.jsonl`);
    writeFileSync(filename, entriesToJsonl(entries));
    console.log(`Final batch: ${entries.length} samples written`);
  }

  console.log(`Done: ${TOTAL} blueprints generated`);
}

generate();
