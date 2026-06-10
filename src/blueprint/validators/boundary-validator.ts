import { Blueprint } from "../types/blueprint";

export interface BoundaryError {
  room: string;
  detail: string;
}

export function checkBoundaries(blueprint: Blueprint): BoundaryError[] {
  const errors: BoundaryError[] = [];
  const plot = blueprint.plot;

  for (const room of blueprint.rooms) {
    if (room.x < 0 || room.y < 0) {
      errors.push({
        room: room.name,
        detail: `Room starts at negative coordinates (${room.x}, ${room.y})`,
      });
    }

    if (room.x + room.width > plot.width) {
      errors.push({
        room: room.name,
        detail: `Room extends ${room.x + room.width - plot.width} units beyond plot width`,
      });
    }

    if (room.y + room.height > plot.height) {
      errors.push({
        room: room.name,
        detail: `Room extends ${room.y + room.height - plot.height} units beyond plot height`,
      });
    }
  }

  return errors;
}
