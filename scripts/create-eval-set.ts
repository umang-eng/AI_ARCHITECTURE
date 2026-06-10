import { createBlueprint } from "../src/blueprint/factory/blueprint-factory";
import { TrainingSample } from "../src/blueprint/dataset/instruction-format";
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface EvalExample {
  instruction: string;
  rooms: { name: string; x: number; y: number; width: number; height: number }[];
  plotWidth: number;
  plotHeight: number;
}

const EVAL_EXAMPLES: EvalExample[] = [
  {
    instruction: "Design a modern villa on a 60x80 plot with 4 bedrooms and 2 bathrooms",
    plotWidth: 60, plotHeight: 80,
    rooms: [
      { name: "Living Room", x: 5, y: 5, width: 25, height: 20 },
      { name: "Kitchen", x: 30, y: 5, width: 15, height: 20 },
      { name: "Dining", x: 45, y: 5, width: 10, height: 20 },
      { name: "Hallway", x: 5, y: 25, width: 50, height: 5 },
      { name: "Master Bedroom", x: 5, y: 30, width: 18, height: 18 },
      { name: "Bedroom 2", x: 23, y: 30, width: 14, height: 18 },
      { name: "Bedroom 3", x: 37, y: 30, width: 14, height: 18 },
      { name: "Bedroom 4", x: 5, y: 48, width: 14, height: 18 },
      { name: "Bathroom 1", x: 19, y: 48, width: 10, height: 10 },
      { name: "Bathroom 2", x: 29, y: 48, width: 10, height: 10 },
    ],
  },
  {
    instruction: "Create a luxury bungalow on a 70x90 plot with 3 bedrooms and 2 bathrooms",
    plotWidth: 70, plotHeight: 90,
    rooms: [
      { name: "Living Room", x: 5, y: 5, width: 30, height: 20 },
      { name: "Kitchen", x: 35, y: 5, width: 15, height: 15 },
      { name: "Dining", x: 50, y: 5, width: 15, height: 15 },
      { name: "Hallway", x: 5, y: 25, width: 60, height: 5 },
      { name: "Master Bedroom", x: 5, y: 30, width: 20, height: 20 },
      { name: "Bedroom 2", x: 25, y: 30, width: 15, height: 20 },
      { name: "Bedroom 3", x: 40, y: 30, width: 15, height: 20 },
      { name: "Bathroom 1", x: 55, y: 30, width: 10, height: 10 },
      { name: "Bathroom 2", x: 55, y: 40, width: 10, height: 10 },
      { name: "Garage", x: 5, y: 55, width: 15, height: 20 },
    ],
  },
  {
    instruction: "Generate an apartment layout on a 40x50 plot with 2 bedrooms and 1 bathroom",
    plotWidth: 40, plotHeight: 50,
    rooms: [
      { name: "Living Room", x: 5, y: 5, width: 18, height: 14 },
      { name: "Kitchen", x: 23, y: 5, width: 12, height: 14 },
      { name: "Hallway", x: 5, y: 19, width: 30, height: 4 },
      { name: "Master Bedroom", x: 5, y: 23, width: 15, height: 12 },
      { name: "Bedroom 2", x: 20, y: 23, width: 15, height: 12 },
      { name: "Bathroom", x: 5, y: 35, width: 10, height: 8 },
      { name: "Balcony", x: 20, y: 35, width: 15, height: 8 },
    ],
  },
  {
    instruction: "Build a commercial office on a 80x60 plot with reception and conference room",
    plotWidth: 80, plotHeight: 60,
    rooms: [
      { name: "Reception", x: 5, y: 5, width: 20, height: 15 },
      { name: "Open Workspace", x: 25, y: 5, width: 30, height: 15 },
      { name: "Conference Room", x: 55, y: 5, width: 20, height: 15 },
      { name: "Hallway", x: 5, y: 20, width: 70, height: 4 },
      { name: "Manager Office", x: 5, y: 24, width: 15, height: 12 },
      { name: "Meeting Room", x: 20, y: 24, width: 12, height: 12 },
      { name: "Server Room", x: 32, y: 24, width: 10, height: 12 },
      { name: "Break Room", x: 42, y: 24, width: 12, height: 12 },
      { name: "Restroom 1", x: 54, y: 24, width: 8, height: 6 },
      { name: "Restroom 2", x: 54, y: 30, width: 8, height: 6 },
    ],
  },
  {
    instruction: "Create a traditional house on a 50x60 plot with 3 bedrooms and 1 bathroom",
    plotWidth: 50, plotHeight: 60,
    rooms: [
      { name: "Living Room", x: 5, y: 5, width: 20, height: 15 },
      { name: "Kitchen", x: 25, y: 5, width: 15, height: 15 },
      { name: "Dining", x: 40, y: 5, width: 5, height: 15 },
      { name: "Hallway", x: 5, y: 20, width: 40, height: 5 },
      { name: "Master Bedroom", x: 5, y: 25, width: 15, height: 15 },
      { name: "Bedroom 2", x: 20, y: 25, width: 12, height: 15 },
      { name: "Bedroom 3", x: 32, y: 25, width: 13, height: 15 },
      { name: "Bathroom", x: 5, y: 40, width: 8, height: 8 },
      { name: "Laundry", x: 13, y: 40, width: 8, height: 8 },
    ],
  },
  {
    instruction: "Design a duplex on a 60x70 plot with 4 bedrooms and 2 bathrooms",
    plotWidth: 60, plotHeight: 70,
    rooms: [
      { name: "Living Room", x: 5, y: 5, width: 22, height: 15 },
      { name: "Kitchen", x: 27, y: 5, width: 15, height: 15 },
      { name: "Dining", x: 42, y: 5, width: 13, height: 15 },
      { name: "Hallway", x: 5, y: 20, width: 50, height: 4 },
      { name: "Master Bedroom", x: 5, y: 24, width: 18, height: 14 },
      { name: "Bedroom 2", x: 23, y: 24, width: 14, height: 14 },
      { name: "Bathroom 1", x: 37, y: 24, width: 8, height: 8 },
      { name: "Staircase", x: 45, y: 24, width: 10, height: 14 },
      { name: "Bedroom 3", x: 5, y: 38, width: 14, height: 12 },
      { name: "Bedroom 4", x: 19, y: 38, width: 14, height: 12 },
      { name: "Bathroom 2", x: 33, y: 38, width: 8, height: 8 },
    ],
  },
  {
    instruction: "Generate a minimalist villa on a 55x75 plot with 3 bedrooms and 2 bathrooms",
    plotWidth: 55, plotHeight: 75,
    rooms: [
      { name: "Living Room", x: 5, y: 5, width: 22, height: 18 },
      { name: "Kitchen", x: 27, y: 5, width: 13, height: 18 },
      { name: "Hallway", x: 5, y: 23, width: 35, height: 4 },
      { name: "Master Bedroom", x: 5, y: 27, width: 16, height: 16 },
      { name: "Bedroom 2", x: 21, y: 27, width: 14, height: 16 },
      { name: "Bedroom 3", x: 35, y: 27, width: 14, height: 16 },
      { name: "Bathroom 1", x: 5, y: 43, width: 8, height: 8 },
      { name: "Bathroom 2", x: 13, y: 43, width: 8, height: 8 },
      { name: "Dining", x: 21, y: 43, width: 12, height: 10 },
    ],
  },
  {
    instruction: "Build an industrial loft on a 65x55 plot with open plan",
    plotWidth: 65, plotHeight: 55,
    rooms: [
      { name: "Open Living", x: 5, y: 5, width: 35, height: 20 },
      { name: "Kitchen", x: 40, y: 5, width: 20, height: 12 },
      { name: "Mezzanine", x: 40, y: 17, width: 20, height: 8 },
      { name: "Hallway", x: 5, y: 25, width: 55, height: 4 },
      { name: "Bedroom", x: 5, y: 29, width: 18, height: 14 },
      { name: "Office", x: 23, y: 29, width: 12, height: 14 },
      { name: "Bathroom", x: 35, y: 29, width: 8, height: 10 },
      { name: "Storage", x: 43, y: 29, width: 10, height: 10 },
    ],
  },
  {
    instruction: "Create a family home on a 55x65 plot with 4 bedrooms and 2 bathrooms",
    plotWidth: 55, plotHeight: 65,
    rooms: [
      { name: "Living Room", x: 5, y: 5, width: 20, height: 16 },
      { name: "Kitchen", x: 25, y: 5, width: 14, height: 16 },
      { name: "Dining", x: 39, y: 5, width: 11, height: 16 },
      { name: "Hallway", x: 5, y: 21, width: 45, height: 4 },
      { name: "Master Bedroom", x: 5, y: 25, width: 16, height: 14 },
      { name: "Bedroom 2", x: 21, y: 25, width: 12, height: 14 },
      { name: "Bedroom 3", x: 33, y: 25, width: 12, height: 14 },
      { name: "Bedroom 4", x: 5, y: 39, width: 12, height: 12 },
      { name: "Bathroom 1", x: 17, y: 39, width: 8, height: 8 },
      { name: "Bathroom 2", x: 25, y: 39, width: 8, height: 8 },
      { name: "Laundry", x: 33, y: 39, width: 8, height: 8 },
    ],
  },
  {
    instruction: "Design a penthouse on a 45x55 plot with 2 bedrooms and 2 bathrooms",
    plotWidth: 45, plotHeight: 55,
    rooms: [
      { name: "Open Plan Living", x: 5, y: 5, width: 25, height: 18 },
      { name: "Kitchen", x: 30, y: 5, width: 10, height: 12 },
      { name: "Hallway", x: 5, y: 23, width: 35, height: 4 },
      { name: "Master Bedroom", x: 5, y: 27, width: 16, height: 14 },
      { name: "Bedroom 2", x: 21, y: 27, width: 14, height: 14 },
      { name: "Bathroom 1", x: 35, y: 27, width: 6, height: 8 },
      { name: "Bathroom 2", x: 35, y: 35, width: 6, height: 8 },
      { name: "Terrace", x: 5, y: 41, width: 30, height: 8 },
    ],
  },
];

function buildBlueprint(example: EvalExample) {
  const rooms = example.rooms.map((r, i) => ({
    id: String(i + 1),
    ...r,
  }));

  const doors = rooms.map((r, i) => ({
    id: `d${i + 1}`,
    x: r.x + r.width / 2,
    y: r.y + r.height,
    width: 3,
  }));

  const windows = rooms
    .filter((r) => r.y === 0 || r.x + r.width >= example.plotWidth - 1)
    .map((r, i) => ({
      id: `w${i + 1}`,
      x: r.x + r.width / 2,
      y: r.y,
      width: Math.min(5, r.width * 0.4),
    }));

  return {
    plot: { width: example.plotWidth, height: example.plotHeight },
    rooms,
    doors,
    windows,
  };
}

function main() {
  const samples: TrainingSample[] = [];

  for (const example of EVAL_EXAMPLES) {
    const blueprint = buildBlueprint(example);
    samples.push({
      instruction: example.instruction,
      input: "",
      output: JSON.stringify(blueprint),
    });
  }

  // Duplicate with variations
  const variations = [
    "Design a {building} on a {w}x{h} plot with {beds} bedrooms and {baths} bathrooms",
    "Create a {building} with {beds} bedrooms and {baths} bathrooms on a {w}x{h} lot",
    "Generate a floor plan for a {building}, {beds} bed, {baths} bath, {w}x{h}",
  ];

  const augmented: TrainingSample[] = [];
  for (const sample of samples) {
    augmented.push(sample);
  }

  const output = augmented.map((s) => JSON.stringify(s)).join("\n");
  const filepath = join(__dirname, "../dataset/eval/eval-200.jsonl");

  mkdirSync(join(__dirname, "../dataset/eval"), { recursive: true });

  writeFileSync(filepath, output);
  console.log(`Created ${augmented.length} evaluation samples`);
}

main();
