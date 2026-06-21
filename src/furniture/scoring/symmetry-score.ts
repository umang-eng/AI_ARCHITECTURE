import { FurnitureItem } from "../types";
import { getFurnitureBounds } from "../validators/overlap-validator";

export function calculateSymmetryScore(furniture: FurnitureItem[]): number {
  let score = 50; // baseline

  const find = (type: string) => furniture.find((f) => f.type === type);
  const findAll = (type: string) => furniture.filter((f) => f.type === type);

  // 1. Sofa vs TV Unit Alignment
  const sofas = findAll("sofa").concat(findAll("l_sofa"));
  const tvs = findAll("tv_unit");

  if (sofas.length > 0 && tvs.length > 0) {
    for (const sofa of sofas) {
      for (const tv of tvs) {
        // If they reside in the same room
        if (sofa.roomId !== tv.roomId) continue;

        // Check alignment
        const dx = Math.abs(sofa.x - tv.x);
        const dy = Math.abs(sofa.y - tv.y);

        if (dx < 4.0 || dy < 4.0) {
          score += 25; // Good visual alignment
        }
      }
    }
  }

  // 2. Bed bedside table placement check
  const beds = findAll("queen_bed").concat(findAll("king_bed"));
  const sideTables = findAll("side_table");

  for (const bed of beds) {
    const tables = sideTables.filter((t) => t.roomId === bed.roomId);
    if (tables.length >= 2) {
      score += 15; // bonus for symmetrical bedroom tables
    } else if (tables.length === 1) {
      score += 5;
    }
  }

  return Math.min(100, Math.max(0, score));
}
