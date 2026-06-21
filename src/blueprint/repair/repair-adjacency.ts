import { PlacedRoom } from "../engine/layout-engine/placement-algorithm";
import { edgeDistance } from "../engine/geometry/distance";

export function repairAdjacencies(rooms: PlacedRoom[]): PlacedRoom[] {
  const repaired = [...rooms];

  const find = (type: string) => repaired.find((r) => r.type === type);

  const kitchen = find("kitchen");
  const dining = find("dining");

  // Kitchen should touch Dining
  if (kitchen && dining) {
    const dist = edgeDistance(kitchen, dining);
    if (dist > 15) {
      // Pull dining next to kitchen
      const dx = dining.x - kitchen.x;
      const dy = dining.y - kitchen.y;

      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0) {
          dining.x = kitchen.x + kitchen.width + 1;
        } else {
          dining.x = kitchen.x - dining.width - 1;
        }
        dining.y = kitchen.y;
      } else {
        if (dy > 0) {
          dining.y = kitchen.y + kitchen.height + 1;
        } else {
          dining.y = kitchen.y - dining.height - 1;
        }
        dining.x = kitchen.x;
      }
    }
  }

  return repaired;
}
