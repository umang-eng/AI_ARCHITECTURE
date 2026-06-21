import { PlacedRoom } from "../engine/layout-engine/placement-algorithm";
import { repairSizes } from "./repair-size";
import { repairBoundaries } from "./repair-boundary";
import { repairOverlaps } from "./repair-overlap";
import { repairAdjacencies } from "./repair-adjacency";
import { repairCirculation } from "./repair-circulation";

export function autoRepairLayout(
  rooms: PlacedRoom[],
  plotWidth: number,
  plotHeight: number,
): PlacedRoom[] {
  let repaired = rooms.map((r) => ({ ...r }));

  // Up to 5 iterations of repair-validate cycles
  for (let iter = 0; iter < 5; iter++) {
    // 1. Repair sizes
    repaired = repairSizes(repaired);

    // 2. Repair boundaries
    repaired = repairBoundaries(repaired, plotWidth, plotHeight);

    // 3. Repair overlaps
    repaired = repairOverlaps(repaired);

    // 4. Repair adjacencies
    repaired = repairAdjacencies(repaired);

    // 5. Repair circulation accessibility
    repaired = repairCirculation(repaired, plotWidth, plotHeight);

    // 6. Final boundary pass
    repaired = repairBoundaries(repaired, plotWidth, plotHeight);
  }

  return repaired;
}
