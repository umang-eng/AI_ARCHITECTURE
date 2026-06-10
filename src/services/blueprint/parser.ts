/**
 * Blueprint Parser — converts validated AI output into the internal Blueprint type
 * that the command generator and renderer expect.
 */

import type { BlueprintAIOutput } from "./schema";
import type { Blueprint } from "@/blueprint/types/blueprint";

const ROOM_NAME_MAP: Record<string, string> = {
  bedroom: "Bedroom",
  master_bedroom: "Master Bedroom",
  kitchen: "Kitchen",
  living_room: "Living Room",
  dining: "Dining",
  bathroom: "Bathroom",
  hallway: "Hallway",
  garage: "Garage",
  garden: "Garden",
  office: "Office",
  utility: "Utility",
  laundry: "Laundry",
  closet: "Closet",
  study: "Study",
  balcony: "Balcony",
  terrace: "Terrace",
  pool: "Pool",
  storage: "Storage",
  living: "Living Room",
};

export function parseAIOutputToBlueprint(output: BlueprintAIOutput): Blueprint {
  return {
    plot: {
      width: output.plot.width,
      height: output.plot.height,
    },
    rooms: output.rooms.map((r) => ({
      id: r.id,
      name: ROOM_NAME_MAP[r.type] || capitalize(r.type),
      type: r.type,
      x: r.x,
      y: r.y,
      width: r.width,
      height: r.height,
    })),
    doors: (output.doors || []).map((d) => ({
      id: d.id,
      x: d.x,
      y: d.y,
      width: d.width,
    })),
    windows: (output.windows || []).map((w) => ({
      id: w.id,
      x: w.x,
      y: w.y,
      width: w.width,
    })),
  };
}

function capitalize(s: string): string {
  return s
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
