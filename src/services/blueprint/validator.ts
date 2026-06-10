/**
 * Blueprint Validator — validates AI model output against the Blueprint JSON schema.
 *
 * Checks:
 * - JSON structure validity
 * - Required fields present
 * - Room coordinates within plot boundaries
 * - No overlapping rooms
 * - Positive dimensions
 * - Valid room types
 */

import type { BlueprintAIOutput } from "./schema";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

const VALID_ROOM_TYPES = new Set([
  "bedroom",
  "master_bedroom",
  "kitchen",
  "living_room",
  "dining",
  "bathroom",
  "hallway",
  "garage",
  "garden",
  "office",
  "utility",
  "laundry",
  "closet",
  "study",
  "balcony",
  "terrace",
  "pool",
  "storage",
  "living",
]);

export function validateBlueprintJSON(raw: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!raw || typeof raw !== "object") {
    return { valid: false, errors: ["Output is not a JSON object"], warnings };
  }

  const obj = raw as Record<string, unknown>;

  if (!obj.plot || typeof obj.plot !== "object") {
    errors.push("Missing or invalid 'plot' field");
  } else {
    const plot = obj.plot as Record<string, unknown>;
    if (typeof plot.width !== "number" || plot.width < 10 || plot.width > 200) {
      errors.push(`Invalid plot.width: ${plot.width} (must be 10-200)`);
    }
    if (typeof plot.height !== "number" || plot.height < 10 || plot.height > 300) {
      errors.push(`Invalid plot.height: ${plot.height} (must be 10-300)`);
    }
  }

  if (!Array.isArray(obj.rooms)) {
    errors.push("Missing or invalid 'rooms' array");
  } else if (obj.rooms.length === 0) {
    errors.push("Rooms array is empty");
  } else {
    const plotW = (obj.plot as any)?.width || 60;
    const plotH = (obj.plot as any)?.height || 80;

    for (let i = 0; i < obj.rooms.length; i++) {
      const room = obj.rooms[i] as Record<string, unknown>;

      if (!room.id) errors.push(`Room ${i}: missing 'id'`);
      if (!room.type || !VALID_ROOM_TYPES.has(room.type as string)) {
        errors.push(`Room ${i} (${room.id}): invalid type '${room.type}'`);
      }
      if (typeof room.x !== "number" || room.x < 0) {
        errors.push(`Room ${i} (${room.id}): invalid x: ${room.x}`);
      }
      if (typeof room.y !== "number" || room.y < 0) {
        errors.push(`Room ${i} (${room.id}): invalid y: ${room.y}`);
      }
      if (typeof room.width !== "number" || room.width < 3) {
        errors.push(`Room ${i} (${room.id}): invalid width: ${room.width}`);
      }
      if (typeof room.height !== "number" || room.height < 3) {
        errors.push(`Room ${i} (${room.id}): invalid height: ${room.height}`);
      }

      if (
        typeof room.x === "number" &&
        typeof room.width === "number" &&
        typeof room.y === "number" &&
        typeof room.height === "number"
      ) {
        if (room.x + room.width > plotW + 1) {
          errors.push(
            `Room ${i} (${room.id}): extends beyond plot width (${room.x + room.width} > ${plotW})`,
          );
        }
        if (room.y + room.height > plotH + 1) {
          errors.push(
            `Room ${i} (${room.id}): extends beyond plot height (${room.y + room.height} > ${plotH})`,
          );
        }
      }
    }

    for (let i = 0; i < obj.rooms.length; i++) {
      for (let j = i + 1; j < obj.rooms.length; j++) {
        const a = obj.rooms[i] as any;
        const b = obj.rooms[j] as any;
        if (
          a.x < b.x + b.width &&
          a.x + a.width > b.x &&
          a.y < b.y + b.height &&
          a.y + a.height > b.y
        ) {
          errors.push(
            `Rooms '${a.id}' and '${b.id}' overlap`,
          );
        }
      }
    }
  }

  if (obj.doors && !Array.isArray(obj.doors)) {
    errors.push("'doors' must be an array");
  }

  if (obj.windows && !Array.isArray(obj.windows)) {
    errors.push("'windows' must be an array");
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function validateAndClean(raw: unknown): {
  data: BlueprintAIOutput | null;
  result: ValidationResult;
} {
  const result = validateBlueprintJSON(raw);

  if (!result.valid) {
    return { data: null, result };
  }

  const obj = raw as Record<string, unknown>;
  const plot = obj.plot as { width: number; height: number };

  const rooms = (obj.rooms as any[]).map((r, i) => ({
    id: r.id || `room_${i + 1}`,
    type: r.type || "bedroom",
    x: Math.max(0, Math.round(r.x)),
    y: Math.max(0, Math.round(r.y)),
    width: Math.max(3, Math.round(r.width)),
    height: Math.max(3, Math.round(r.height)),
  }));

  const doors = Array.isArray(obj.doors)
    ? (obj.doors as any[]).map((d, i) => ({
        id: d.id || `door_${i + 1}`,
        x: Number(d.x) || 0,
        y: Number(d.y) || 0,
        width: Math.max(1, Number(d.width) || 3),
        orientation: d.orientation || "horizontal",
      }))
    : [];

  const windows = Array.isArray(obj.windows)
    ? (obj.windows as any[]).map((w, i) => ({
        id: w.id || `window_${i + 1}`,
        x: Number(w.x) || 0,
        y: Number(w.y) || 0,
        width: Math.max(1, Number(w.width) || 4),
        orientation: w.orientation || "horizontal",
      }))
    : [];

  return {
    data: { plot, rooms, doors, windows },
    result,
  };
}
