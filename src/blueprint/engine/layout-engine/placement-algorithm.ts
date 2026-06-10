import { Rectangle } from "../geometry/rectangle";
import { findPlacement } from "../geometry/placement";
import { ROOM_LIBRARY, RoomSpec } from "../room-library";
import { RoomAllocation } from "../room-allocator/room-allocator";

export interface PlacedRoom {
  id: string;
  type: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export function placeRooms(
  allocations: RoomAllocation[],
  plotWidth: number,
  plotHeight: number,
  seed: number,
): PlacedRoom[] {
  const placed: PlacedRoom[] = [];
  const occupied: Rectangle[] = [];
  let id = 0;

  const rng = seededRandom(seed);

  const priorityOrder = [
    "livingRoom",
    "kitchen",
    "dining",
    "hallway",
    "bedroom",
    "bathroom",
    "garage",
    "office",
    "staircase",
    "garden",
  ];

  const sorted = [...allocations].sort((a, b) => {
    const ai = priorityOrder.indexOf(a.type);
    const bi = priorityOrder.indexOf(b.type);
    return ai - bi;
  });

  for (const alloc of sorted) {
    const spec = ROOM_LIBRARY[alloc.type];
    if (!spec) continue;

    for (let i = 0; i < alloc.count; i++) {
      const baseWidth = spec.idealWidth || spec.minWidth;
      const baseHeight = spec.idealHeight || spec.minHeight;

      // Use seed-based RNG to add slight size variation
      const sizeVariation = 0.8 + rng() * 0.4;
      const width = Math.round(baseWidth * sizeVariation);
      const height = Math.round(baseHeight * sizeVariation);

      // Use RNG to slightly offset the margin
      const dynamicMargin = 3 + Math.floor(rng() * 5);

      const result = findPlacement(
        width,
        height,
        plotWidth,
        plotHeight,
        occupied,
        dynamicMargin,
      );

      if (result) {
        const room: PlacedRoom = {
          id: String(++id),
          type: alloc.type,
          name: formatName(alloc.type, i, alloc.count),
          ...result,
        };
        placed.push(room);
        occupied.push({ x: result.x, y: result.y, width, height });
      } else {
        const fallback = findPlacement(
          spec.minWidth,
          spec.minHeight,
          plotWidth,
          plotHeight,
          occupied,
          3,
        );

        if (fallback) {
          const room: PlacedRoom = {
            id: String(++id),
            type: alloc.type,
            name: formatName(alloc.type, i, alloc.count),
            x: fallback.x,
            y: fallback.y,
            width: fallback.width,
            height: fallback.height,
          };
          placed.push(room);
          occupied.push({ x: fallback.x, y: fallback.y, width: fallback.width, height: fallback.height });
        }
      }
    }
  }

  return placed;
}

function formatName(type: string, index: number, total: number): string {
  const names: Record<string, string> = {
    livingRoom: "Living Room",
    kitchen: "Kitchen",
    dining: "Dining",
    hallway: "Hallway",
    bedroom: "Bedroom",
    bathroom: "Bathroom",
    garage: "Garage",
    office: "Office",
    staircase: "Staircase",
    garden: "Garden",
  };

  const base = names[type] || type;

  if (type === "bedroom" && index === 0) return "Master Bedroom";
  if (total <= 1) return base;
  return `${base} ${index + 1}`;
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}
