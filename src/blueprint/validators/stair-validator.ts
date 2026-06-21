import { Blueprint } from "../types/blueprint";
import { edgeDistance } from "../engine/geometry/distance";

export interface StairError {
  detail: string;
}

export function checkStairs(blueprint: Blueprint, floors: number = 1): StairError[] {
  const errors: StairError[] = [];
  const rooms = blueprint.rooms;

  const staircases = rooms.filter((r) => r.type === "staircase");
  const hallways = rooms.filter((r) => r.type === "hallway");
  const livings = rooms.filter((r) => r.type === "livingRoom" || r.type === "living");

  // 1. Check if stairs are missing for multi-level houses
  if (floors > 1 && staircases.length === 0) {
    errors.push({
      detail: `Staircase is required for a ${floors}-story building, but none was found.`,
    });
  }

  // 2. Check staircase proximity to circulation
  for (const stair of staircases) {
    let nearCirculation = false;

    // Check hallways
    for (const h of hallways) {
      if (edgeDistance(stair, h) < 5.0) {
        nearCirculation = true;
        break;
      }
    }

    // Check living rooms as fallback
    if (!nearCirculation) {
      for (const l of livings) {
        if (edgeDistance(stair, l) < 5.0) {
          nearCirculation = true;
          break;
        }
      }
    }

    if (!nearCirculation && (hallways.length > 0 || livings.length > 0)) {
      errors.push({
        detail: `Staircase "${stair.name}" is isolated. It should be adjacent to a Hallway or Living Room for access.`,
      });
    }
  }

  return errors;
}
