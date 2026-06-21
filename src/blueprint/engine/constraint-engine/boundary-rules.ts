import { Blueprint } from "../../types/blueprint";
import { ConstraintViolation } from "./room-rules";

export function validateBoundaryRules(blueprint: Blueprint): ConstraintViolation[] {
  const violations: ConstraintViolation[] = [];
  const plot = blueprint.plot;

  for (const room of blueprint.rooms) {
    if (room.x < 0 || room.y < 0) {
      violations.push({
        code: "OUT_OF_BOUNDS_NEGATIVE",
        severity: "error",
        message: `Room "${room.name}" starts at negative coordinates (${room.x.toFixed(1)}, ${room.y.toFixed(1)}).`,
        targetId: room.id,
      });
    }

    if (room.x + room.width > plot.width) {
      violations.push({
        code: "OUT_OF_BOUNDS_X",
        severity: "error",
        message: `Room "${room.name}" extends beyond plot width (x + width = ${(room.x + room.width).toFixed(1)} ft, plot width = ${plot.width} ft).`,
        targetId: room.id,
      });
    }

    if (room.y + room.height > plot.height) {
      violations.push({
        code: "OUT_OF_BOUNDS_Y",
        severity: "error",
        message: `Room "${room.name}" extends beyond plot height (y + height = ${(room.y + room.height).toFixed(1)} ft, plot height = ${plot.height} ft).`,
        targetId: room.id,
      });
    }
  }

  return violations;
}
