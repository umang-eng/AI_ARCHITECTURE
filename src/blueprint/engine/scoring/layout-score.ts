import { PlacedRoom } from "../layout-engine/placement-algorithm";
import { centerDistance } from "../geometry/distance";

export interface ScoreResult {
  score: number;
  reasons: string[];
}

export function scoreLayout(rooms: PlacedRoom[]): ScoreResult {
  let score = 0;
  const reasons: string[] = [];

  const find = (type: string) => rooms.find((r) => r.type === type);
  const findAll = (type: string) => rooms.filter((r) => r.type === type);

  const kitchen = find("kitchen");
  const dining = find("dining");
  const living = find("livingRoom");
  const hallway = find("hallway");
  const bedrooms = findAll("bedroom");
  const bathrooms = findAll("bathroom");

  // Kitchen near Dining
  if (kitchen && dining) {
    const dist = centerDistance(kitchen, dining);
    if (dist < 20) {
      score += 10;
      reasons.push("Kitchen near Dining (+10)");
    } else {
      score -= 5;
      reasons.push("Kitchen far from Dining (-5)");
    }
  }

  // Kitchen near Living Room
  if (kitchen && living) {
    const dist = centerDistance(kitchen, living);
    if (dist < 25) {
      score += 10;
      reasons.push("Kitchen near Living Room (+10)");
    } else {
      score -= 5;
      reasons.push("Kitchen far from Living Room (-5)");
    }
  }

  // Bedroom near Bathroom
  for (const bedroom of bedrooms) {
    let nearBath = false;
    for (const bathroom of bathrooms) {
      const dist = centerDistance(bedroom, bathroom);
      if (dist < 25) {
        nearBath = true;
        break;
      }
    }
    if (nearBath) {
      score += 10;
      reasons.push(`${bedroom.name} near Bathroom (+10)`);
    } else {
      score -= 20;
      reasons.push(`${bedroom.name} far from Bathroom (-20)`);
    }
  }

  // Hallway connects rooms
  if (hallway) {
    let connectedRooms = 0;
    for (const room of rooms) {
      if (room.type === "hallway") continue;
      const dist = centerDistance(hallway, room);
      if (dist < 30) connectedRooms++;
    }
    if (connectedRooms >= 3) {
      score += 15;
      reasons.push(`Hallway connects ${connectedRooms} rooms (+15)`);
    }
  }

  // Penalty for no hallway
  if (!hallway && rooms.length > 5) {
    score -= 10;
    reasons.push("No hallway in large layout (-10)");
  }

  // Bonus for balanced layout
  const totalArea = rooms.reduce((sum, r) => sum + r.width * r.height, 0);
  const avgRoomSize = rooms.length > 0 ? totalArea / rooms.length : 0;
  if (avgRoomSize > 80 && avgRoomSize < 200) {
    score += 10;
    reasons.push("Balanced room sizes (+10)");
  }

  return { score, reasons };
}

export function rankLayouts(layouts: PlacedRoom[][]): {
  rooms: PlacedRoom[];
  score: number;
  reasons: string[];
}[] {
  return layouts
    .map((rooms) => ({
      rooms,
      ...scoreLayout(rooms),
    }))
    .sort((a, b) => b.score - a.score);
}
