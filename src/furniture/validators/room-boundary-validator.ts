import { FurnitureItem } from "../types";
import { getFurnitureBounds } from "./overlap-validator";
import { Blueprint } from "../../blueprint/types/blueprint";

export function checkRoomBoundaries(furniture: FurnitureItem[], blueprint: Blueprint): string[] {
  const errors: string[] = [];

  for (const f of furniture) {
    const parentRoom = blueprint.rooms.find((r) => r.id === f.roomId);
    if (!parentRoom) {
      errors.push(`Orphan Furniture: Furniture "${f.type}" (ID: ${f.id}) has no matching parent room.`);
      continue;
    }

    const box = getFurnitureBounds(f);
    const rx1 = parentRoom.x;
    const rx2 = parentRoom.x + parentRoom.width;
    const ry1 = parentRoom.y;
    const ry2 = parentRoom.y + parentRoom.height;

    // A small buffer of 0.1 ft to allow rounding/wall contact
    const margin = 0.1;

    if (
      box.x1 < rx1 - margin ||
      box.x2 > rx2 + margin ||
      box.y1 < ry1 - margin ||
      box.y2 > ry2 + margin
    ) {
      errors.push(
        `Room Bounds Violation: "${f.type}" (ID: ${f.id}) extends outside parent Room "${parentRoom.name}".`
      );
    }
  }

  return errors;
}
