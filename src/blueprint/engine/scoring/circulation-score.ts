import { PlacedRoom } from "../layout-engine/placement-algorithm";
import { centerDistance } from "../geometry/distance";

export function calculateCirculationScore(rooms: PlacedRoom[]): number {
  if (rooms.length === 0) return 0;

  const hallways = rooms.filter((r) => r.type === "hallway");
  const nonHallways = rooms.filter((r) => r.type !== "hallway");

  let score = 80; // baseline

  if (rooms.length > 4) {
    if (hallways.length === 0) {
      score -= 30; // heavy penalty for lack of hallways in large plans
    } else {
      score += 10;
    }
  }

  // Calculate hallway area ratio
  const totalArea = rooms.reduce((sum, r) => sum + r.width * r.height, 0);
  const hallwayArea = hallways.reduce((sum, h) => sum + h.width * h.height, 0);
  const hallwayRatio = hallwayArea / totalArea;

  // Hallway area should ideally be 5% to 15% of the total built area
  if (hallwayRatio > 0.2) {
    score -= (hallwayRatio - 0.2) * 100; // Penalize excessive hallway space (wasted square footage)
  }

  // Check average connectivity from hallways to non-hallway rooms
  if (hallways.length > 0) {
    let connectivitySum = 0;
    for (const h of hallways) {
      let connections = 0;
      for (const nh of nonHallways) {
        if (centerDistance(h, nh) < 25.0) {
          connections++;
        }
      }
      connectivitySum += connections;
    }
    const avgConnections = connectivitySum / hallways.length;
    if (avgConnections >= 3) {
      score += 10;
    } else if (avgConnections < 1.5) {
      score -= 10;
    }
  }

  return Math.min(100, Math.max(0, score));
}
