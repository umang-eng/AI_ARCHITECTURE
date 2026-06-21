import { PlacedRoom } from "../engine/layout-engine/placement-algorithm";

export function repairBoundaries(
  rooms: PlacedRoom[],
  plotWidth: number,
  plotHeight: number,
): PlacedRoom[] {
  const repaired = [...rooms];

  for (const r of repaired) {
    // Clamp size first if it exceeds plot dimensions
    if (r.width > plotWidth) r.width = plotWidth;
    if (r.height > plotHeight) r.height = plotHeight;

    // Clamp coordinates
    if (r.x < 0) {
      r.x = 0;
    }
    if (r.y < 0) {
      r.y = 0;
    }

    if (r.x + r.width > plotWidth) {
      r.x = plotWidth - r.width;
    }
    if (r.y + r.height > plotHeight) {
      r.y = plotHeight - r.height;
    }
  }

  return repaired;
}
