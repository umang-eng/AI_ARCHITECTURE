import { Blueprint } from "../../types/blueprint";
import { ConstraintViolation } from "./room-rules";

export const MIN_ROOM_DIMENSIONS: Record<string, { minW: number; minH: number; minArea: number }> = {
  bedroom: { minW: 10, minH: 10, minArea: 100 },
  master_bedroom: { minW: 12, minH: 12, minArea: 144 },
  bathroom: { minW: 5, minH: 5, minArea: 35 },
  kitchen: { minW: 8, minH: 8, minArea: 64 },
  livingroom: { minW: 12, minH: 12, minArea: 180 },
  living: { minW: 12, minH: 12, minArea: 180 },
  dining: { minW: 8, minH: 8, minArea: 64 },
  hallway: { minW: 3, minH: 3, minArea: 15 },
  garage: { minW: 10, minH: 18, minArea: 180 },
  office: { minW: 8, minH: 8, minArea: 64 },
  staircase: { minW: 4, minH: 6, minArea: 24 },
};

export function validateSizeRules(blueprint: Blueprint): ConstraintViolation[] {
  const violations: ConstraintViolation[] = [];

  for (const room of blueprint.rooms) {
    const key = room.type.toLowerCase().replace(/[^a-z]/g, "");
    const spec = MIN_ROOM_DIMENSIONS[key];
    if (!spec) continue;

    const minW = spec.minW;
    const minH = spec.minH;
    const minArea = spec.minArea;
    const area = room.width * room.height;

    if (room.width < minW) {
      violations.push({
        code: "ROOM_WIDTH_TOO_SMALL",
        severity: "error",
        message: `Room "${room.name}" width (${room.width} ft) is below minimum of ${minW} ft.`,
        targetId: room.id,
      });
    }

    if (room.height < minH) {
      violations.push({
        code: "ROOM_HEIGHT_TOO_SMALL",
        severity: "error",
        message: `Room "${room.name}" height (${room.height} ft) is below minimum of ${minH} ft.`,
        targetId: room.id,
      });
    }

    if (area < minArea) {
      violations.push({
        code: "ROOM_AREA_TOO_SMALL",
        severity: "error",
        message: `Room "${room.name}" area (${area} sq ft) is below minimum of ${minArea} sq ft.`,
        targetId: room.id,
      });
    }
  }

  return violations;
}
