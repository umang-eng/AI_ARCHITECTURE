import { PlacedRoom } from "../layout-engine/placement-algorithm";

export function calculateExpandabilityScore(
  rooms: PlacedRoom[],
  plotWidth: number,
  plotHeight: number,
): number {
  if (rooms.length === 0) return 0;

  const plotArea = plotWidth * plotHeight;
  const builtArea = rooms.reduce((sum, r) => sum + r.width * r.height, 0);
  const unusedArea = plotArea - builtArea;

  const gardens = rooms.filter((r) => r.type === "garden");
  const gardenArea = gardens.reduce((sum, g) => sum + g.width * g.height, 0);

  // If there are large designated outdoor areas (garden, patio) or open space, expandability is high
  let score = 50; // baseline

  if (gardenArea > 100) {
    score += 25;
  }
  if (unusedArea > plotArea * 0.35) {
    score += 25;
  }

  // Wasted space penalty (if unused area is tiny gaps spread everywhere instead of solid backyard/frontyard)
  if (unusedArea > 0 && unusedArea < plotArea * 0.1) {
    score -= 20; // layout is cramped, no room to expand
  }

  return Math.min(100, Math.max(0, score));
}
