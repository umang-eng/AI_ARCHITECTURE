import { Rectangle } from "./rectangle";
import { hasCollision } from "./collision";

export interface PlacementResult {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function findPlacement(
  width: number,
  height: number,
  plotWidth: number,
  plotHeight: number,
  existing: Rectangle[],
  margin: number = 5,
): PlacementResult | null {
  for (let y = margin; y + height <= plotHeight - margin; y += 2) {
    for (let x = margin; x + width <= plotWidth - margin; x += 2) {
      const candidate: Rectangle = { x, y, width, height };
      const collision = existing.some((r) => hasCollision(r, candidate));
      if (!collision) {
        return { x, y, width, height };
      }
    }
  }
  return null;
}

export function findPlacementInZone(
  width: number,
  height: number,
  zoneX: number,
  zoneY: number,
  zoneWidth: number,
  zoneHeight: number,
  existing: Rectangle[],
): PlacementResult | null {
  for (let y = zoneY; y + height <= zoneY + zoneHeight; y += 2) {
    for (let x = zoneX; x + width <= zoneX + zoneWidth; x += 2) {
      const candidate: Rectangle = { x, y, width, height };
      const collision = existing.some((r) => hasCollision(r, candidate));
      if (!collision) {
        return { x, y, width, height };
      }
    }
  }
  return null;
}
