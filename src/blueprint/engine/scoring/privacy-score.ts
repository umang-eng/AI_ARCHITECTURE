import { PlacedRoom } from "../layout-engine/placement-algorithm";
import { areAdjacent } from "../geometry/distance";

export function calculatePrivacyScore(rooms: PlacedRoom[]): number {
  if (rooms.length === 0) return 0;

  const bedrooms = rooms.filter((r) => r.type === "bedroom" || r.type === "master_bedroom");
  const bathrooms = rooms.filter((r) => r.type === "bathroom");
  const publicRooms = rooms.filter((r) => r.type === "livingRoom" || r.type === "living" || r.type === "dining");
  const kitchen = rooms.filter((r) => r.type === "kitchen");

  let score = 100;

  // Rule 1: Bedrooms directly sharing a wall with the main public living area gets a small warning/penalty if no hallway separates them
  const hallwayExists = rooms.some((r) => r.type === "hallway");
  for (const bed of bedrooms) {
    for (const pub of publicRooms) {
      if (areAdjacent(bed, pub, 0.5)) {
        if (!hallwayExists) {
          score -= 10; // penalty for sharing wall without hallway buffer
        } else {
          score -= 5;
        }
      }
    }
  }

  // Rule 2: Bathroom direct adjacency to dining / kitchen is a privacy check
  for (const bath of bathrooms) {
    for (const k of kitchen) {
      if (areAdjacent(bath, k, 0.5)) {
        score -= 15;
      }
    }
    const dining = rooms.find((r) => r.type === "dining");
    if (dining && areAdjacent(bath, dining, 0.5)) {
      score -= 15;
    }
  }

  return Math.min(100, Math.max(50, score));
}
