import { Blueprint } from "../types/blueprint";

const MIN_SIZES: Record<string, { width: number; height: number }> = {
  bedroom: { width: 10, height: 10 },
  "master bedroom": { width: 10, height: 10 },
  bathroom: { width: 5, height: 8 },
  kitchen: { width: 8, height: 8 },
  "living room": { width: 12, height: 10 },
  living: { width: 12, height: 10 },
  dining: { width: 8, height: 8 },
  hallway: { width: 3, height: 3 },
  garage: { width: 10, height: 18 },
  office: { width: 8, height: 8 },
};

export interface SizeError {
  room: string;
  detail: string;
}

export function checkSizes(blueprint: Blueprint): SizeError[] {
  const errors: SizeError[] = [];

  for (const room of blueprint.rooms) {
    const key = room.name.toLowerCase().replace(/\s*\d+$/, "");
    const min = MIN_SIZES[key];

    if (min) {
      if (room.width < min.width) {
        errors.push({
          room: room.name,
          detail: `Width ${room.width} < minimum ${min.width}`,
        });
      }
      if (room.height < min.height) {
        errors.push({
          room: room.name,
          detail: `Height ${room.height} < minimum ${min.height}`,
        });
      }
    }
  }

  return errors;
}
