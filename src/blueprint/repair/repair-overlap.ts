import { PlacedRoom } from "../engine/layout-engine/placement-algorithm";

export function repairOverlaps(rooms: PlacedRoom[]): PlacedRoom[] {
  const repaired = [...rooms];
  let changed = false;

  // Run up to 10 passes of pair-wise separation to resolve multi-room collisions
  for (let pass = 0; pass < 5; pass++) {
    changed = false;
    for (let i = 0; i < repaired.length; i++) {
      for (let j = i + 1; j < repaired.length; j++) {
        const a = repaired[i];
        const b = repaired[j];

        const overlapX = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
        const overlapY = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);

        if (overlapX > 0 && overlapY > 0) {
          changed = true;
          // Overlap exists, separate along the axis of minimum overlap
          if (overlapX < overlapY) {
            const shift = overlapX / 2;
            if (a.x + a.width / 2 < b.x + b.width / 2) {
              a.x -= shift;
              b.x += shift;
            } else {
              a.x += shift;
              b.x -= shift;
            }
          } else {
            const shift = overlapY / 2;
            if (a.y + a.height / 2 < b.y + b.height / 2) {
              a.y -= shift;
              b.y += shift;
            } else {
              a.y += shift;
              b.y -= shift;
            }
          }
        }
      }
    }
    if (!changed) break;
  }

  return repaired;
}
