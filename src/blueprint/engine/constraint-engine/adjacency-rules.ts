import { Blueprint } from "../../types/blueprint";
import { centerDistance, edgeDistance, areAdjacent } from "../geometry/distance";
import { ConstraintViolation } from "./room-rules";

export function validateAdjacencyRules(blueprint: Blueprint): ConstraintViolation[] {
  const violations: ConstraintViolation[] = [];
  const rooms = blueprint.rooms;

  const find = (type: string) => rooms.find((r) => r.type === type);
  const findAll = (type: string) => rooms.filter((r) => r.type === type);

  const kitchen = find("kitchen");
  const dining = find("dining");
  const living = find("livingRoom") || find("living");
  const bedrooms = findAll("bedroom").concat(findAll("master_bedroom"));
  const bathrooms = findAll("bathroom");
  const garage = find("garage");
  const staircases = findAll("staircase");

  // 1. Kitchen near Dining
  if (kitchen && dining) {
    const dist = edgeDistance(kitchen, dining);
    if (dist > 15) {
      violations.push({
        code: "KITCHEN_FAR_FROM_DINING",
        severity: "warning",
        message: `Kitchen is far from Dining (${dist.toFixed(1)} ft). Ideal distance is under 15 ft.`,
        targetId: kitchen.id,
      });
    }
  }

  // 2. Kitchen near Living Room (in Open Plan layouts)
  if (kitchen && living) {
    const dist = edgeDistance(kitchen, living);
    if (dist > 25) {
      violations.push({
        code: "KITCHEN_FAR_FROM_LIVING",
        severity: "warning",
        message: `Kitchen is far from Living Room (${dist.toFixed(1)} ft).`,
        targetId: kitchen.id,
      });
    }
  }

  // 3. Bedroom near Bathroom
  for (const bedroom of bedrooms) {
    let minBathDist = Infinity;
    for (const bathroom of bathrooms) {
      const dist = edgeDistance(bedroom, bathroom);
      if (dist < minBathDist) {
        minBathDist = dist;
      }
    }
    if (minBathDist > 20) {
      violations.push({
        code: "BEDROOM_FAR_FROM_BATHROOM",
        severity: "warning",
        message: `Bedroom "${bedroom.name}" is far from any Bathroom (${minBathDist.toFixed(1)} ft).`,
        targetId: bedroom.id,
      });
    }
  }

  // 4. Bathroom directly sharing a wall with Kitchen (Acoustic & Hygiene check)
  if (kitchen) {
    for (const bathroom of bathrooms) {
      if (areAdjacent(kitchen, bathroom, 0.5)) {
        violations.push({
          code: "BATHROOM_ADJACENT_KITCHEN",
          severity: "warning",
          message: `Bathroom "${bathroom.name}" shares a wall with Kitchen. Direct adjacency is not ideal for hygiene.`,
          targetId: bathroom.id,
        });
      }
    }
  }

  // 5. Bedroom sharing wall with Garage (Noise concern)
  if (garage) {
    for (const bedroom of bedrooms) {
      if (areAdjacent(garage, bedroom, 0.5)) {
        violations.push({
          code: "BEDROOM_ADJACENT_GARAGE",
          severity: "warning",
          message: `Bedroom "${bedroom.name}" shares a wall with Garage, leading to potential noise issues.`,
          targetId: bedroom.id,
        });
      }
    }
  }

  return violations;
}
