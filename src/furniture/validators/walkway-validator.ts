import { FurnitureItem } from "../types";
import { getFurnitureBounds } from "./overlap-validator";
import { Blueprint } from "../../blueprint/types/blueprint";
import { FURNITURE_PLACEMENT_RULES } from "../rules/furniture-rules";

export function checkWalkways(furniture: FurnitureItem[], blueprint: Blueprint): string[] {
  const warnings: string[] = [];
  const minWalkway = FURNITURE_PLACEMENT_RULES.minWalkwayWidth;

  for (const f of furniture) {
    const parentRoom = blueprint.rooms.find((r) => r.id === f.roomId);
    if (!parentRoom) continue;

    const box = getFurnitureBounds(f);

    // Check if the item blocks the entire room's width (horizontal blockade)
    const spaceLeft = box.x1 - parentRoom.x;
    const spaceRight = (parentRoom.x + parentRoom.width) - box.x2;

    if (spaceLeft < minWalkway && spaceRight < minWalkway) {
      warnings.push(
        `Walkway Blocked: "${f.type}" blocks horizontal circulation in Room "${parentRoom.name}". Left space: ${spaceLeft.toFixed(1)} ft, Right space: ${spaceRight.toFixed(1)} ft.`
      );
    }

    // Check if the item blocks the entire room's height (vertical blockade)
    const spaceTop = box.y1 - parentRoom.y;
    const spaceBottom = (parentRoom.y + parentRoom.height) - box.y2;

    if (spaceTop < minWalkway && spaceBottom < minWalkway) {
      warnings.push(
        `Walkway Blocked: "${f.type}" blocks vertical circulation in Room "${parentRoom.name}". Top space: ${spaceTop.toFixed(1)} ft, Bottom space: ${spaceBottom.toFixed(1)} ft.`
      );
    }
  }

  return warnings;
}
