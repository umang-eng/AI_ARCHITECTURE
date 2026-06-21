import { FurnitureItem } from "../types";
import { Blueprint } from "../../blueprint/types/blueprint";

export function calculateSpaceUtilizationScore(
  furniture: FurnitureItem[],
  blueprint: Blueprint,
): number {
  if (blueprint.rooms.length === 0) return 100;

  let totalScore = 0;
  let activeRoomsCount = 0;

  for (const room of blueprint.rooms) {
    // Skip corridors/gardens
    if (room.type === "hallway" || room.type === "garden" || room.type === "staircase") {
      continue;
    }
    activeRoomsCount++;

    const roomFurniture = furniture.filter((f) => f.roomId === room.id);
    const roomArea = room.width * room.height;
    const furnitureArea = roomFurniture.reduce((sum, f) => sum + f.width * f.height, 0);
    const ratio = furnitureArea / roomArea;

    let roomScore = 100;

    if (roomFurniture.length === 0) {
      roomScore -= 40; // empty room penalty
    } else if (ratio < 0.15) {
      roomScore -= (0.15 - ratio) * 200; // under-utilized
    } else if (ratio > 0.45) {
      roomScore -= (ratio - 0.45) * 250; // over-cluttered
    }

    totalScore += roomScore;
  }

  if (activeRoomsCount === 0) return 100;
  return Math.min(100, Math.max(0, Math.round(totalScore / activeRoomsCount)));
}
