import { FurnitureItem } from "../types";
import { validateOverlaps } from "./overlap-validator";
import { validateClearances } from "./clearance-validator";
import { checkDoorBlocking } from "./door-validator";
import { checkWindowBlocking } from "./window-validator";
import { checkWalkways } from "./walkway-validator";
import { checkRoomBoundaries } from "./room-boundary-validator";
import { Blueprint } from "../../blueprint/types/blueprint";

export interface FurnitureValidationReport {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateFurnitureLayout(
  furniture: FurnitureItem[],
  blueprint: Blueprint,
): FurnitureValidationReport {
  const errors: string[] = [
    ...validateOverlaps(furniture),
    ...checkDoorBlocking(furniture, blueprint),
    ...checkRoomBoundaries(furniture, blueprint),
  ];

  const warnings: string[] = [
    ...validateClearances(furniture),
    ...checkWindowBlocking(furniture, blueprint),
    ...checkWalkways(furniture, blueprint),
  ];

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
export type { FurnitureItem };
