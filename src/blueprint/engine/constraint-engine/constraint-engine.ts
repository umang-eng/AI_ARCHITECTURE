import { Blueprint } from "../../types/blueprint";
import { validateRoomRules, ConstraintViolation } from "./room-rules";
import { validateAdjacencyRules } from "./adjacency-rules";
import { validateSizeRules } from "./size-rules";
import { validateBoundaryRules } from "./boundary-rules";
import { validateCorridorRules } from "./corridor-rules";

export interface ConstraintReport {
  valid: boolean;
  violations: ConstraintViolation[];
  errorsCount: number;
  warningsCount: number;
}

export function evaluateConstraints(blueprint: Blueprint): ConstraintReport {
  const violations: ConstraintViolation[] = [
    ...validateRoomRules(blueprint),
    ...validateAdjacencyRules(blueprint),
    ...validateSizeRules(blueprint),
    ...validateBoundaryRules(blueprint),
    ...validateCorridorRules(blueprint),
  ];

  const errorsCount = violations.filter((v) => v.severity === "error").length;
  const warningsCount = violations.filter((v) => v.severity === "warning").length;

  return {
    valid: errorsCount === 0,
    violations,
    errorsCount,
    warningsCount,
  };
}
export type { ConstraintViolation };
