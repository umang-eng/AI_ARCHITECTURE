import { Blueprint, Room } from "../../types/blueprint";

export interface ConstraintViolation {
  code: string;
  severity: "error" | "warning";
  message: string;
  targetId?: string;
}

export function validateRoomRules(blueprint: Blueprint): ConstraintViolation[] {
  const violations: ConstraintViolation[] = [];
  const rooms = blueprint.rooms;

  // 1. Master Bedroom largest check
  const bedrooms = rooms.filter((r) => r.type === "bedroom" || r.type === "master_bedroom");
  const masterBedrooms = rooms.filter((r) => r.type === "master_bedroom" || r.name.toLowerCase().includes("master"));

  if (masterBedrooms.length > 0 && bedrooms.length > 1) {
    const masterArea = Math.max(...masterBedrooms.map((r) => r.width * r.height));
    const normalBedrooms = bedrooms.filter((r) => !masterBedrooms.includes(r));
    
    for (const normal of normalBedrooms) {
      const normalArea = normal.width * normal.height;
      if (normalArea >= masterArea) {
        violations.push({
          code: "MASTER_BEDROOM_NOT_LARGEST",
          severity: "warning",
          message: `Standard bedroom "${normal.name}" (${normal.width}x${normal.height}) is larger than or equal to Master Bedroom.`,
          targetId: normal.id,
        });
      }
    }
  }

  // 2. Room Aspect Ratio Limit
  const MAX_ASPECT_RATIO = 2.5;
  for (const room of rooms) {
    if (room.width <= 0 || room.height <= 0) continue;
    const ratio = Math.max(room.width / room.height, room.height / room.width);
    if (ratio > MAX_ASPECT_RATIO) {
      violations.push({
        code: "INVALID_ASPECT_RATIO",
        severity: "error",
        message: `Room "${room.name}" has an aspect ratio of ${ratio.toFixed(2)}:1, which exceeds the limit of ${MAX_ASPECT_RATIO}:1.`,
        targetId: room.id,
      });
    }
  }

  // 3. Bathroom Size vs Bedroom check
  const bathrooms = rooms.filter((r) => r.type === "bathroom");
  if (bathrooms.length > 0 && bedrooms.length > 0) {
    const avgBedroomArea = bedrooms.reduce((sum, r) => sum + r.width * r.height, 0) / bedrooms.length;
    for (const bath of bathrooms) {
      const bathArea = bath.width * bath.height;
      if (bathArea > avgBedroomArea * 0.75) {
        violations.push({
          code: "BATHROOM_TOO_LARGE",
          severity: "warning",
          message: `Bathroom "${bath.name}" is disproportionately large (${bath.width}x${bath.height}) compared to bedrooms.`,
          targetId: bath.id,
        });
      }
    }
  }

  return violations;
}
