import { PlacedRoom } from "../engine/layout-engine/placement-algorithm";
import { checkAccessibility } from "../validators/accessibility-validator";
import { Blueprint } from "../types/blueprint";

export function repairCirculation(rooms: PlacedRoom[], plotWidth: number, plotHeight: number): PlacedRoom[] {
  const repaired = [...rooms];

  const hallway = repaired.find((r) => r.type === "hallway");
  if (!hallway) return repaired;

  // Build a dummy blueprint for the validator (with empty doors to use adjacency check)
  const bp: Blueprint = {
    plot: { width: plotWidth, height: plotHeight },
    rooms: repaired.map((r) => ({
      id: r.id,
      name: r.name,
      type: r.type,
      x: r.x,
      y: r.y,
      width: r.width,
      height: r.height,
    })),
    doors: [],
    windows: [],
  };

  const accessErrors = checkAccessibility(bp);
  if (accessErrors.length === 0) return repaired;

  for (const err of accessErrors) {
    const isolatedRoom = repaired.find((r) => r.name === err.room);
    if (!isolatedRoom || isolatedRoom.type === "hallway") continue;

    // Shift isolated room next to hallway
    const dx = isolatedRoom.x - hallway.x;
    const dy = isolatedRoom.y - hallway.y;

    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0) {
        isolatedRoom.x = hallway.x + hallway.width;
      } else {
        isolatedRoom.x = hallway.x - isolatedRoom.width;
      }
      // Center vertically with the hallway to maintain connection
      isolatedRoom.y = hallway.y + (hallway.height - isolatedRoom.height) / 2;
    } else {
      if (dy > 0) {
        isolatedRoom.y = hallway.y + hallway.height;
      } else {
        isolatedRoom.y = hallway.y - isolatedRoom.height;
      }
      // Center horizontally with the hallway
      isolatedRoom.x = hallway.x + (hallway.width - isolatedRoom.width) / 2;
    }
  }

  return repaired;
}
