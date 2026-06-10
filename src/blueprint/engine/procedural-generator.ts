import { Blueprint } from "../types/blueprint";
import { BuildingRequirements } from "../schema/building-schema";
import { allocateRooms } from "./room-allocator/room-allocator";
import { placeRooms, PlacedRoom } from "./layout-engine/placement-algorithm";
import { scoreLayout, rankLayouts } from "./scoring/layout-score";
import { checkOverlaps } from "../validators/overlap-validator";
import { checkBoundaries } from "../validators/boundary-validator";
import { checkSizes } from "../validators/size-validator";

const CANDIDATE_COUNT = 100;

export function generateProceduralBlueprint(
  requirements: BuildingRequirements,
): Blueprint {
  const allocations = allocateRooms({
    bedrooms: requirements.bedrooms,
    bathrooms: requirements.bathrooms,
    floors: requirements.floors,
  });

  const candidates: PlacedRoom[][] = [];

  for (let i = 0; i < CANDIDATE_COUNT; i++) {
    const seed = Math.floor(Math.random() * 2147483647);
    const rooms = placeRooms(
      allocations,
      requirements.plotWidth,
      requirements.plotHeight,
      seed,
    );
    candidates.push(rooms);
  }

  const ranked = rankLayouts(candidates);

  if (ranked.length === 0) {
    return {
      plot: { width: requirements.plotWidth, height: requirements.plotHeight },
      rooms: [],
      doors: [],
      windows: [],
    };
  }

  const best = ranked[0];

  return {
    plot: {
      width: requirements.plotWidth,
      height: requirements.plotHeight,
    },
    rooms: best.rooms.map((r) => ({
      id: r.id,
      name: r.name,
      type: r.type,
      x: r.x,
      y: r.y,
      width: r.width,
      height: r.height,
    })),
    doors: [],
    windows: [],
  };
}
