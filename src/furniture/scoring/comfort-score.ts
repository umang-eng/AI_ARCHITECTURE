import { FurnitureItem } from "../types";
import { getFurnitureBounds } from "../validators/overlap-validator";
import { Blueprint } from "../../blueprint/types/blueprint";
import { validateClearances } from "../validators/clearance-validator";
import { pointToRectDistance } from "../validators/door-validator";

export function calculateComfortScore(
  furniture: FurnitureItem[],
  blueprint: Blueprint,
): number {
  let score = 100;

  // 1. Penalty for clearance issues
  const clearanceWarnings = validateClearances(furniture);
  score -= clearanceWarnings.length * 10;

  // 2. Bonus for Study Desk near Window
  const desks = furniture.filter((f) => f.type === "study_desk" || f.type === "office_desk");
  const windows = blueprint.windows;

  for (const desk of desks) {
    const box = getFurnitureBounds(desk);
    let nearWindow = false;
    for (const win of windows) {
      const dist = pointToRectDistance(win.x, win.y, box.x1, box.y1, box.x2, box.y2);
      if (dist < 6.0) {
        nearWindow = true;
        break;
      }
    }
    if (nearWindow) {
      score += 10; // comfort bonus for natural light desk placement
    } else {
      score -= 5; // penalty for dark working area
    }
  }

  return Math.min(100, Math.max(0, score));
}
