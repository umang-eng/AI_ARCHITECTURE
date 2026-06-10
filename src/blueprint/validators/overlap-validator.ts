import { Blueprint } from "../types/blueprint";

export interface OverlapError {
  roomA: string;
  roomB: string;
}

export function checkOverlaps(blueprint: Blueprint): OverlapError[] {
  const errors: OverlapError[] = [];

  for (let i = 0; i < blueprint.rooms.length; i++) {
    for (let j = i + 1; j < blueprint.rooms.length; j++) {
      const a = blueprint.rooms[i];
      const b = blueprint.rooms[j];

      const overlapsX = a.x < b.x + b.width && a.x + a.width > b.x;
      const overlapsY = a.y < b.y + b.height && a.y + a.height > b.y;

      if (overlapsX && overlapsY) {
        errors.push({ roomA: a.name, roomB: b.name });
      }
    }
  }

  return errors;
}
