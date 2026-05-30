/**
 * Validation Engine — validates blueprints against architectural rules.
 *
 * Returns detailed errors for: overlap, boundary, size, accessibility, doors, windows.
 */

import type { BlueprintSchema, RoomData, DoorData } from "@/types/blueprint-schema";

export interface ValidationError {
  code: string;
  message: string;
  severity: "error" | "warning";
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

const MIN_ROOM: Record<string, { w: number; h: number }> = {
  bedroom: { w: 10, h: 10 },
  bathroom: { w: 5, h: 5 },
  kitchen: { w: 8, h: 8 },
  living: { w: 12, h: 10 },
  dining: { w: 8, h: 8 },
  hallway: { w: 3, h: 3 },
  garage: { w: 10, h: 18 },
  office: { w: 8, h: 8 },
  staircase: { w: 4, h: 6 },
};

export function validateBlueprint(blueprint: BlueprintSchema): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  const { rooms, doors, plot } = blueprint;

  // 1. Boundary check
  for (const room of rooms) {
    if (room.x < -0.01 || room.y < -0.01) {
      errors.push({
        code: "ROOM_OUTSIDE_PLOT",
        message: `Room '${room.name}' starts at negative coordinates (${room.x}, ${room.y})`,
        severity: "error",
      });
    }
    if (room.x + room.width > plot.width + 0.01) {
      errors.push({
        code: "ROOM_EXCEEDS_PLOT",
        message: `Room '${room.name}' extends ${(room.x + room.width - plot.width).toFixed(1)} units beyond plot width`,
        severity: "error",
      });
    }
    if (room.y + room.height > plot.height + 0.01) {
      errors.push({
        code: "ROOM_EXCEEDS_PLOT",
        message: `Room '${room.name}' extends ${(room.y + room.height - plot.height).toFixed(1)} units beyond plot height`,
        severity: "error",
      });
    }
  }

  // 2. Overlap check
  for (let i = 0; i < rooms.length; i++) {
    for (let j = i + 1; j < rooms.length; j++) {
      const a = rooms[i];
      const b = rooms[j];
      const overlapX = a.x < b.x + b.width && a.x + a.width > b.x;
      const overlapY = a.y < b.y + b.height && a.y + a.height > b.y;
      if (overlapX && overlapY) {
        const ow = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
        const oh = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
        if (ow > 0.5 && oh > 0.5) {
          errors.push({
            code: "ROOM_OVERLAP",
            message: `Rooms '${a.name}' and '${b.name}' overlap by ${ow.toFixed(1)}×${oh.toFixed(1)} units`,
            severity: "error",
          });
        }
      }
    }
  }

  // 3. Minimum size check
  for (const room of rooms) {
    const min = MIN_ROOM[room.room_type];
    if (min) {
      if (room.width < min.w) {
        errors.push({
          code: "ROOM_TOO_SMALL",
          message: `Room '${room.name}' width ${room.width.toFixed(1)} < minimum ${min.w}`,
          severity: "error",
        });
      }
      if (room.height < min.h) {
        errors.push({
          code: "ROOM_TOO_SMALL",
          message: `Room '${room.name}' height ${room.height.toFixed(1)} < minimum ${min.h}`,
          severity: "error",
        });
      }
    }
  }

  // 4. Door placement
  for (const door of doors) {
    if (door.width < 2.5) {
      warnings.push({
        code: "DOOR_TOO_NARROW",
        message: `Door at (${door.x}, ${door.y}) width ${door.width.toFixed(1)} < recommended 2.5`,
        severity: "warning",
      });
    }
    if (door.x < 0 || door.x > plot.width || door.y < 0 || door.y > plot.height) {
      errors.push({
        code: "DOOR_OUTSIDE_PLOT",
        message: `Door at (${door.x}, ${door.y}) is outside plot boundary`,
        severity: "error",
      });
    }
  }

  // 5. Accessibility check
  const accessibleRooms = new Set<string>();
  for (const door of doors) {
    for (const room of rooms) {
      if (isDoorOnRoomBoundary(door, room)) {
        accessibleRooms.add(room.name);
      }
    }
  }
  for (const room of rooms) {
    if (["hallway", "staircase", "garden", "garage", "storage"].includes(room.room_type)) continue;
    if (!accessibleRooms.has(room.name)) {
      warnings.push({
        code: "ROOM_INACCESSIBLE",
        message: `Room '${room.name}' has no door connecting to it`,
        severity: "warning",
      });
    }
  }

  const result: ValidationResult = {
    valid: errors.length === 0,
    errors,
    warnings,
  };

  blueprint.metadata.validation_status = result.valid ? "valid" : "invalid";
  blueprint.metadata.validation_errors = [...errors.map(e => e.message), ...warnings.map(w => w.message)];

  return result;
}

function isDoorOnRoomBoundary(door: DoorData, room: RoomData, tolerance: number = 1.0): boolean {
  const onTop = Math.abs(door.y - room.y) < tolerance && room.x <= door.x && door.x <= room.x + room.width;
  const onBottom = Math.abs(door.y - (room.y + room.height)) < tolerance && room.x <= door.x && door.x <= room.x + room.width;
  const onLeft = Math.abs(door.x - room.x) < tolerance && room.y <= door.y && door.y <= room.y + room.height;
  const onRight = Math.abs(door.x - (room.x + room.width)) < tolerance && room.y <= door.y && door.y <= room.y + room.height;
  return onTop || onBottom || onLeft || onRight;
}
