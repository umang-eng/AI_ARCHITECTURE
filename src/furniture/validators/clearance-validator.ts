import { FurnitureItem } from "../types";
import { getFurnitureBounds } from "./overlap-validator";
import { getLibraryItem } from "../library/furniture-library";

export function checkClearanceOverlap(a: FurnitureItem, b: FurnitureItem): boolean {
  const libA = getLibraryItem(a.type);
  if (!libA || libA.clearance <= 0) return false;

  const boxA = getFurnitureBounds(a);
  const boxB = getFurnitureBounds(b);

  // Expand A's box by its clearance value
  const cl = libA.clearance;
  const clearA = {
    x1: boxA.x1 - cl,
    y1: boxA.y1 - cl,
    x2: boxA.x2 + cl,
    y2: boxA.y2 + cl,
  };

  // Check if A's clearance zone intersects B's solid body
  return (
    clearA.x1 < boxB.x2 &&
    clearA.x2 > boxB.x1 &&
    clearA.y1 < boxB.y2 &&
    clearA.y2 > boxB.y1
  );
}

export function validateClearances(furniture: FurnitureItem[]): string[] {
  const warnings: string[] = [];
  for (let i = 0; i < furniture.length; i++) {
    for (let j = 0; j < furniture.length; j++) {
      if (i === j) continue;
      if (checkClearanceOverlap(furniture[i], furniture[j])) {
        warnings.push(
          `Clearance Warning: "${furniture[i].type}" clearance zone is obstructed by "${furniture[j].type}".`
        );
      }
    }
  }
  return warnings;
}
