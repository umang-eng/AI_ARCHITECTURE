import { Blueprint } from "../types/blueprint";
import { BlueprintCommand } from "../commands/command";
import { CommandType } from "../commands/command-types";
import { generateFurnitureCommands } from "../../furniture/renderers/furniture-renderer";

export function generateCommands(blueprint: Blueprint): BlueprintCommand[] {
  const commands: BlueprintCommand[] = [];

  const pw = blueprint.plot.width;
  const ph = blueprint.plot.height;

  // 1. Draw Plot Boundary
  commands.push({
    type: CommandType.DRAW_PLOT,
    payload: {
      id: "plot",
      width: pw,
      height: ph,
    },
  });

  // 2. Plot Dimensions (Annotations along the top and left edges)
  commands.push({
    type: CommandType.DRAW_DIMENSION,
    payload: {
      id: "plot_width_dim",
      x1: 0,
      y1: -4,
      x2: pw,
      y2: -4,
      label: `${pw}'`,
    },
  });

  commands.push({
    type: CommandType.DRAW_DIMENSION,
    payload: {
      id: "plot_height_dim",
      x1: -4,
      y1: 0,
      x2: -4,
      y2: ph,
      label: `${ph}'`,
    },
  });

  // 3. Draw Rooms, Labels, and Room Dimensions
  const ROOM_COLORS: Record<string, string> = {
    livingRoom: "#e8f4f8",
    kitchen: "#fef3c7",
    dining: "#fce7f3",
    hallway: "#f1f5f9",
    bedroom: "#ede9fe",
    bathroom: "#dbeafe",
    garage: "#e2e8f0",
    office: "#ecfdf5",
    staircase: "#f8fafc",
    garden: "#d1fae5",
  };

  for (const room of blueprint.rooms) {
    if (room.type === "staircase") {
      // Draw custom staircase geometric elements instead of normal room rectangle
      commands.push({
        type: CommandType.DRAW_STAIRCASE,
        payload: {
          id: room.id,
          x: room.x,
          y: room.y,
          width: room.width,
          height: room.height,
          name: room.name,
        },
      });
      continue;
    }

    commands.push({
      type: CommandType.DRAW_ROOM,
      payload: {
        id: room.id,
        x: room.x,
        y: room.y,
        width: room.width,
        height: room.height,
        name: room.name,
        roomType: room.type,
        color_hex: (room as any).color_hex || ROOM_COLORS[room.type] || "#ffffff",
      },
    });
  }

  // 4. Draw Doors
  for (const door of blueprint.doors) {
    commands.push({
      type: CommandType.DRAW_DOOR,
      payload: {
        id: door.id,
        x: door.x,
        y: door.y,
        width: door.width,
      },
    });
  }

  // 5. Draw Windows
  for (const win of blueprint.windows) {
    commands.push({
      type: CommandType.DRAW_WINDOW,
      payload: {
        id: win.id,
        x: win.x,
        y: win.y,
        width: win.width,
      },
    });
  }

  // 5.5. Draw Furniture
  if (blueprint.furniture && blueprint.furniture.length > 0) {
    const furnitureCommands = generateFurnitureCommands(blueprint.furniture);
    commands.push(...furnitureCommands);
  }

  // 6. Draw North Arrow (Top-Right Corner of plot)
  commands.push({
    type: CommandType.DRAW_NORTH_ARROW,
    payload: {
      x: pw - 8,
      y: 8,
      size: 5,
    },
  });

  // 7. Draw Scale Indicator (Bottom-Left Corner of plot)
  commands.push({
    type: CommandType.DRAW_SCALE_INDICATOR,
    payload: {
      x: 5,
      y: ph - 5,
      length: 10,
    },
  });

  // 8. Draw Area Summary Card (Bottom-Right Corner of plot)
  const builtArea = blueprint.rooms.reduce((sum, r) => sum + r.width * r.height, 0);
  const plotArea = pw * ph;
  const utilization = Math.round((builtArea / plotArea) * 100);

  commands.push({
    type: CommandType.DRAW_AREA_SUMMARY,
    payload: {
      x: pw - 25,
      y: ph - 15,
      width: 22,
      height: 12,
      plotArea,
      builtArea,
      utilization,
    },
  });

  return commands;
}
