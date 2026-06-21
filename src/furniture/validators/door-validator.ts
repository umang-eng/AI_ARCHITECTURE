import { FurnitureItem } from "../types";
import { getFurnitureBounds } from "./overlap-validator";
import { Blueprint } from "../../blueprint/types/blueprint";
import { FURNITURE_PLACEMENT_RULES } from "../rules/furniture-rules";

export function checkDoorBlocking(furniture: FurnitureItem[], blueprint: Blueprint): string[] {
  const errors: string[] = [];
  const doors = blueprint.doors;
  const buffer = FURNITURE_PLACEMENT_RULES.doorBuffer;

  for (const door of doors) {
    for (const f of furniture) {
      const box = getFurnitureBounds(f);
      const dist = pointToRectDistance(door.x, door.y, box.x1, box.y1, box.x2, box.y2);
      
      if (dist < buffer) {
        errors.push(
          `Door Blocked: Furniture "${f.type}" (ID: ${f.id}) is blocking Door (ID: ${door.id}) within swing clearance (${dist.toFixed(1)} ft < ${buffer} ft).`
        );
      }
    }
  }

  return errors;
}

function pointToRectDistance(
  px: number,
  py: number,
  rx1: number,
  ry1: number,
  rx2: number,
  ry2: number,
): number {
  const dx = Math.max(0, rx1 - px, px - rx2);
  const dy = Math.max(0, ry1 - py, py - ry2);
  return Math.sqrt(dx * dx + dy * dy);
}
export { pointToRectDistance };
