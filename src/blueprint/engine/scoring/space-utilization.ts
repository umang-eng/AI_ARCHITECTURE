import { PlacedRoom } from "../layout-engine/placement-algorithm";

export function calculateSpaceUtilization(
  rooms: PlacedRoom[],
  plotWidth: number,
  plotHeight: number,
): number {
  if (rooms.length === 0) return 0;

  const plotArea = plotWidth * plotHeight;
  const builtArea = rooms.reduce((sum, r) => sum + r.width * r.height, 0);
  const ratio = builtArea / plotArea;

  let score = 100;

  // Ideal built area ratio is between 40% and 75% for residential
  if (ratio < 0.3) {
    score -= (0.3 - ratio) * 200; // Penalize excessively low coverage
  } else if (ratio > 0.8) {
    score -= (ratio - 0.8) * 150; // Penalize lack of outdoor setbacks
  }

  // Penalize bad room aspect ratios
  let aspectPenalty = 0;
  for (const r of rooms) {
    const aspect = Math.max(r.width / r.height, r.height / r.width);
    if (aspect > 2.0) {
      aspectPenalty += (aspect - 2.0) * 10;
    }
  }

  score -= aspectPenalty;

  return Math.min(100, Math.max(0, score));
}
