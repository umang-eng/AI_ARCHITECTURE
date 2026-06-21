import { Blueprint } from "../../types/blueprint";
import { ConstraintViolation } from "./room-rules";

export function validateCorridorRules(blueprint: Blueprint): ConstraintViolation[] {
  const violations: ConstraintViolation[] = [];
  const rooms = blueprint.rooms;

  const hallways = rooms.filter((r) => r.type === "hallway");

  // 1. Check corridor width
  for (const hallway of hallways) {
    const minDim = Math.min(hallway.width, hallway.height);
    if (minDim < 3.0) {
      violations.push({
        code: "CORRIDOR_TOO_NARROW",
        severity: "error",
        message: `Hallway/Corridor "${hallway.name}" is too narrow (${minDim.toFixed(1)} ft). Minimum width is 3.0 ft.`,
        targetId: hallway.id,
      });
    }
  }

  // 2. Large layout missing hallways warning
  if (rooms.length > 5 && hallways.length === 0) {
    violations.push({
      code: "MISSING_CORRIDORS",
      severity: "warning",
      message: `Layout contains ${rooms.length} rooms but has no Hallways/Corridors. This can lead to accessibility or privacy issues.`,
    });
  }

  return violations;
}
