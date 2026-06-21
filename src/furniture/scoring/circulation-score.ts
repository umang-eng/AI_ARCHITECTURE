import { FurnitureItem } from "../types";
import { Blueprint } from "../../blueprint/types/blueprint";
import { checkWalkways } from "../validators/walkway-validator";
import { checkDoorBlocking } from "../validators/door-validator";

export function calculateCirculationScore(
  furniture: FurnitureItem[],
  blueprint: Blueprint,
): number {
  let score = 100;

  // 1. Walkway warnings penalty
  const walkwayWarnings = checkWalkways(furniture, blueprint);
  score -= walkwayWarnings.length * 15;

  // 2. Door blockage penalty (in addition to absolute blocker error)
  const doorBlocked = checkDoorBlocking(furniture, blueprint);
  score -= doorBlocked.length * 20;

  return Math.min(100, Math.max(0, score));
}
