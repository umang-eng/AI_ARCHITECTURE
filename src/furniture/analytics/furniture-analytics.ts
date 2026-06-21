import { FurnitureItem } from "../types";
import { Blueprint } from "../../blueprint/types/blueprint";
import { calculateComfortScore } from "../scoring/comfort-score";
import { calculateCirculationScore } from "../scoring/circulation-score";
import { calculateSymmetryScore } from "../scoring/symmetry-score";

export interface FurnitureAnalyticsReport {
  furnitureCount: number;
  coveragePercentage: number;
  freeSpace: number; // sq ft
  walkabilityScore: number;
  luxuryScore: number;
  comfortScore: number;
  accessibilityScore: number;
}

export function computeFurnitureAnalytics(
  furniture: FurnitureItem[],
  blueprint: Blueprint,
): FurnitureAnalyticsReport {
  const plotArea = blueprint.plot.width * blueprint.plot.height;
  const activeRooms = blueprint.rooms.filter(
    (r) => r.type !== "hallway" && r.type !== "garden" && r.type !== "staircase"
  );
  const totalRoomArea = activeRooms.reduce((sum, r) => sum + r.width * r.height, 0);

  if (furniture.length === 0 || totalRoomArea === 0) {
    return {
      furnitureCount: 0,
      coveragePercentage: 0,
      freeSpace: totalRoomArea,
      walkabilityScore: 100,
      luxuryScore: 0,
      comfortScore: 100,
      accessibilityScore: 100,
    };
  }

  const furnitureArea = furniture.reduce((sum, f) => sum + f.width * f.height, 0);
  const coveragePercentage = Math.round((furnitureArea / totalRoomArea) * 100);
  const freeSpace = totalRoomArea - furnitureArea;

  const comfortScore = calculateComfortScore(furniture, blueprint);
  const walkabilityScore = calculateCirculationScore(furniture, blueprint);
  const symmetryScore = calculateSymmetryScore(furniture);

  // Luxury score scales with symmetry, size, and layout quality
  const luxuryScore = Math.round(symmetryScore * 0.4 + comfortScore * 0.6);

  return {
    furnitureCount: furniture.length,
    coveragePercentage,
    freeSpace: Math.round(freeSpace),
    walkabilityScore,
    luxuryScore,
    comfortScore,
    accessibilityScore: walkabilityScore,
  };
}
