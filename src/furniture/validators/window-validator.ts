import { FurnitureItem } from "../types";
import { getFurnitureBounds } from "./overlap-validator";
import { Blueprint } from "../../blueprint/types/blueprint";
import { FURNITURE_PLACEMENT_RULES } from "../rules/furniture-rules";
import { pointToRectDistance } from "./door-validator";

export function checkWindowBlocking(furniture: FurnitureItem[], blueprint: Blueprint): string[] {
  const warnings: string[] = [];
  const windows = blueprint.windows;
  const allowed = FURNITURE_PLACEMENT_RULES.windowBlockingAllowedTypes;

  for (const win of windows) {
    for (const f of furniture) {
      if (allowed.includes(f.type)) continue; // allowed near windows

      const box = getFurnitureBounds(f);
      const dist = pointToRectDistance(win.x, win.y, box.x1, box.y1, box.x2, box.y2);
      
      if (dist < 2.5) {
        warnings.push(
          `Window Blocked: Tall/opaque furniture "${f.type}" is blocking Window (ID: ${win.id}) within light clearance (${dist.toFixed(1)} ft).`
        );
      }
    }
  }

  return warnings;
}
