/**
 * Blueprint Command Engine — converts BlueprintSchema to BlueprintCommands.
 *
 * Architecture: Blueprint Schema → Blueprint Commands → Excalidraw Elements
 *
 * This is the bridge between the abstract schema and the concrete renderer.
 */

import type { BlueprintSchema } from "@/types/blueprint-schema";
import type { BlueprintCommand } from "@/types/blueprint-commands";

let cmdId = 0;
function uid(prefix: string): string {
  return `cmd_${prefix}_${++cmdId}`;
}

export function resetCommandIds(): void {
  cmdId = 0;
}

export function schemaToCommands(blueprint: BlueprintSchema): BlueprintCommand[] {
  resetCommandIds();
  const commands: BlueprintCommand[] = [];
  const { plot, rooms, walls, doors, windows, stairs } = blueprint;

  // 1. Plot boundary
  commands.push({
    type: "DRAW_PLOT_BOUNDARY",
    id: uid("plot"),
    x: 0,
    y: 0,
    width: plot.width,
    height: plot.height,
  });

  // 2. Rooms
  for (const room of rooms) {
    commands.push({
      type: "DRAW_ROOM",
      id: uid("room"),
      x: room.x,
      y: room.y,
      width: room.width,
      height: room.height,
      name: room.name,
      room_type: room.room_type,
      color_hex: room.color_hex,
      level: room.level,
    });
  }

  // 3. Walls
  for (const wall of walls) {
    commands.push({
      type: "DRAW_WALL",
      id: uid("wall"),
      x1: wall.x1,
      y1: wall.y1,
      x2: wall.x2,
      y2: wall.y2,
      thickness: wall.thickness,
      wall_type: wall.wall_type,
    });
  }

  // 4. Doors
  for (const door of doors) {
    commands.push({
      type: "DRAW_DOOR",
      id: uid("door"),
      x: door.x,
      y: door.y,
      width: door.width,
      orientation: door.orientation,
      is_main_entrance: door.is_main_entrance,
    });
  }

  // 5. Windows
  for (const win of windows) {
    commands.push({
      type: "DRAW_WINDOW",
      id: uid("win"),
      x: win.x,
      y: win.y,
      width: win.width,
      orientation: win.orientation,
    });
  }

  // 6. Stairs
  for (const stair of stairs) {
    commands.push({
      type: "DRAW_STAIR",
      id: uid("stair"),
      x: stair.x,
      y: stair.y,
      width: stair.width,
      height: stair.height,
      direction: stair.direction,
    });
  }

  // 7. Room labels (text commands)
  for (const room of rooms) {
    const fontSize = Math.max(8, Math.min(14, room.width * 0.08));
    commands.push({
      type: "DRAW_TEXT",
      id: uid("text"),
      x: room.x + room.width / 2,
      y: room.y + room.height / 2 - fontSize / 2,
      text: room.name.toUpperCase(),
      font_size: fontSize,
      color: "#1e2530",
    });

    // Area label
    const area = Math.round(room.width * room.height);
    commands.push({
      type: "DRAW_TEXT",
      id: uid("text"),
      x: room.x + room.width / 2,
      y: room.y + room.height / 2 + fontSize / 2,
      text: `${area} sqft`,
      font_size: Math.max(6, fontSize - 3),
      color: "#6b7280",
    });
  }

  // 8. Dimension annotations (plot size)
  commands.push({
    type: "DRAW_DIMENSION",
    id: uid("dim"),
    x1: 0, y1: -10,
    x2: plot.width, y2: -10,
    label: `${plot.width} ft`,
  });
  commands.push({
    type: "DRAW_DIMENSION",
    id: uid("dim"),
    x1: -10, y1: 0,
    x2: -10, y2: plot.height,
    label: `${plot.height} ft`,
  });

  return commands;
}
