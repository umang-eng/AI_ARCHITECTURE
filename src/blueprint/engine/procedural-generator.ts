import { Blueprint } from "../types/blueprint";
import { BuildingRequirements } from "../schema/building-schema";
import { allocateRooms } from "./room-allocator/room-allocator";
import { placeRooms, PlacedRoom } from "./layout-engine/placement-algorithm";
import { scoreLayout } from "./scoring/layout-score";
import { autoRepairLayout } from "../repair/auto-repair-engine";

const CANDIDATE_COUNT = 100;

interface BuildingRequirementsExtended extends BuildingRequirements {
  prompt?: string;
}

export function generateProceduralBlueprint(
  requirements: BuildingRequirementsExtended,
): Blueprint {
  const promptLower = (requirements.prompt || "").toLowerCase();

  const allocations = allocateRooms({
    bedrooms: requirements.bedrooms,
    bathrooms: requirements.bathrooms,
    floors: requirements.floors,
    hasGarage: promptLower.includes("garage") || promptLower.includes("parking"),
    hasGarden: promptLower.includes("garden") || promptLower.includes("lawn") || promptLower.includes("yard"),
    hasOffice: promptLower.includes("office") || promptLower.includes("study") || promptLower.includes("work"),
  });

  let bestLayout: PlacedRoom[] = [];
  let bestScore = -1;

  // Track the layout candidate scores for analytics/history
  const candidates: { rooms: PlacedRoom[]; score: number }[] = [];

  // Random seed component changes on each call for unique layouts
  const randomSeedComponent = Math.floor(Math.random() * 1000000);

  // Implement seeded randomness derived from a baseline seed for repeatability
  const baseSeed = requirements.bedrooms * 100 + requirements.bathrooms * 10 + requirements.floors;

  for (let i = 0; i < CANDIDATE_COUNT; i++) {
    // Unique seed per variation with random component
    const seed = baseSeed + randomSeedComponent + i * 179426549; 
    
    // 1. Placement
    let rooms = placeRooms(
      allocations,
      requirements.plotWidth,
      requirements.plotHeight,
      seed,
    );

    if (rooms.length === 0) continue;

    // 2. Auto Repair (Module 6)
    rooms = autoRepairLayout(rooms, requirements.plotWidth, requirements.plotHeight);

    // 3. Scoring (Module 4)
    const scoreResult = scoreLayout(rooms, requirements.plotWidth, requirements.plotHeight);

    candidates.push({ rooms, score: scoreResult.score });

    if (scoreResult.score > bestScore) {
      bestScore = scoreResult.score;
      bestLayout = rooms;
    }
  }

  // Fallback if none succeeded
  if (bestLayout.length === 0) {
    return {
      plot: { width: requirements.plotWidth, height: requirements.plotHeight },
      rooms: [],
      doors: [],
      windows: [],
    };
  }

  return {
    plot: {
      width: requirements.plotWidth,
      height: requirements.plotHeight,
    },
    rooms: bestLayout.map((r) => ({
      id: r.id,
      name: r.name,
      type: r.type,
      x: r.x,
      y: r.y,
      width: r.width,
      height: r.height,
    })),
    doors: [],
    windows: [],
  };
}
export type { PlacedRoom };
