import { PlacedRoom } from "../engine/layout-engine/placement-algorithm";
import { MIN_ROOM_DIMENSIONS } from "../engine/constraint-engine/size-rules";

export function repairSizes(rooms: PlacedRoom[]): PlacedRoom[] {
  const repaired = [...rooms];

  for (const r of repaired) {
    const key = r.type.toLowerCase().replace(/[^a-z]/g, "");
    const spec = MIN_ROOM_DIMENSIONS[key];
    if (!spec) continue;

    if (r.width < spec.minW) {
      r.width = spec.minW;
    }
    if (r.height < spec.minH) {
      r.height = spec.minH;
    }
  }

  return repaired;
}
