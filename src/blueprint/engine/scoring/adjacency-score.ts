import { PlacedRoom } from "../layout-engine/placement-algorithm";
import { edgeDistance } from "../geometry/distance";

export function calculateAdjacencyScore(rooms: PlacedRoom[]): number {
  let score = 50; // baseline
  let checks = 0;
  let matches = 0;

  const find = (type: string) => rooms.find((r) => r.type === type);
  const findAll = (type: string) => rooms.filter((r) => r.type === type);

  const kitchen = find("kitchen");
  const dining = find("dining");
  const living = find("livingRoom") || find("living");
  const bedrooms = findAll("bedroom").concat(findAll("master_bedroom"));
  const bathrooms = findAll("bathroom");

  // 1. Kitchen near Dining
  if (kitchen && dining) {
    checks++;
    const dist = edgeDistance(kitchen, dining);
    if (dist < 10) {
      matches += 1;
      score += 15;
    } else if (dist < 20) {
      matches += 0.5;
      score += 5;
    } else {
      score -= 10;
    }
  }

  // 2. Kitchen near Living
  if (kitchen && living) {
    checks++;
    const dist = edgeDistance(kitchen, living);
    if (dist < 20) {
      matches += 1;
      score += 10;
    } else if (dist < 30) {
      matches += 0.5;
      score += 2;
    } else {
      score -= 5;
    }
  }

  // 3. Bedrooms near Bathrooms
  if (bedrooms.length > 0 && bathrooms.length > 0) {
    checks += bedrooms.length;
    for (const bed of bedrooms) {
      let minB = Infinity;
      for (const bath of bathrooms) {
        const dist = edgeDistance(bed, bath);
        if (dist < minB) minB = dist;
      }
      if (minB < 15) {
        matches += 1;
        score += 10;
      } else if (minB < 25) {
        matches += 0.5;
        score += 3;
      } else {
        score -= 15;
      }
    }
  }

  // Compute final normalised score based on matches
  const matchRatio = checks > 0 ? matches / checks : 1.0;
  const normalized = Math.round(matchRatio * 50 + (score > 50 ? (score - 50) : 0));

  return Math.min(100, Math.max(0, normalized));
}
