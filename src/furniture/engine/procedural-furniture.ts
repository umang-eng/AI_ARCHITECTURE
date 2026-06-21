import { FurnitureItem } from "../types";
import { Blueprint } from "../../blueprint/types/blueprint";
import { generateRoomFurniture } from "./furniture-generator";
import { optimizeFurnitureLayout } from "../optimization/furniture-optimizer";
import { scoreFurnitureLayout } from "../scoring/furniture-scorer";
import { getStyleTemplate } from "../templates/style-templates";

const FURNITURE_CANDIDATE_COUNT = 100;

export function generateProceduralFurniture(
  blueprint: Blueprint,
  style: string,
): FurnitureItem[] {
  if (blueprint.rooms.length === 0) return [];

  const styleConfig = getStyleTemplate(style);
  const sizeMult = styleConfig.sizeMultiplier;

  let bestLayout: FurnitureItem[] = [];
  let bestScore = -1;

  // Base seed for reproducibility
  const baseSeed = blueprint.rooms.length * 100 + blueprint.doors.length;

  for (let i = 0; i < FURNITURE_CANDIDATE_COUNT; i++) {
    const seed = baseSeed + i * 982451653;
    const rng = seededRandom(seed);

    // 1. Generate items for all rooms
    let candidate: FurnitureItem[] = [];
    for (const room of blueprint.rooms) {
      const roomItems = generateRoomFurniture(room, blueprint, rng, sizeMult);
      candidate.push(...roomItems);
    }

    // 2. Optimize placement
    candidate = optimizeFurnitureLayout(candidate, blueprint);

    // 3. Score layout
    const scoreResult = scoreFurnitureLayout(candidate, blueprint);

    if (scoreResult.score > bestScore) {
      bestScore = scoreResult.score;
      bestLayout = candidate;
    }
  }

  // Assign theme colors based on style template
  for (const f of bestLayout) {
    f.color_hex = getFurnitureColor(f.type, styleConfig.themeColors);
  }

  return bestLayout;
}

function getFurnitureColor(type: string, colors: any): string {
  if (type.includes("sofa")) return colors.sofa;
  if (type.includes("bed")) return colors.bed;
  if (type.includes("dining")) return colors.dining;
  if (type.includes("desk") || type.includes("chair")) return colors.office;
  if (type.includes("cabinet") || type.includes("wardrobe") || type.includes("table")) return colors.cabinet;
  return colors.fixture; // toilet, sink, counter etc.
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}
