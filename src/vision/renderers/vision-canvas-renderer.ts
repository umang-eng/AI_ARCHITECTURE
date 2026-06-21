import { BlueprintCommand } from "../../blueprint/commands/command";
import { CommandType } from "../../blueprint/commands/command-types";
import { VisionAnalysisResult, VisionRoomLayout } from "../types";

export class VisionCanvasRenderer {
  /**
   * Translate a VisionAnalysisResult into a list of drawing commands.
   */
  public static convertToCommands(result: VisionAnalysisResult): BlueprintCommand[] {
    const commands: BlueprintCommand[] = [];

    // 1. Draw Plot boundary from global dimensions
    const plotWidth = result.dimensions.width || 20.0;
    const plotHeight = result.dimensions.height || 20.0;

    commands.push({
      type: CommandType.DRAW_PLOT,
      payload: {
        id: "vision_plot",
        width: plotWidth,
        height: plotHeight,
      },
    });

    // Plot outer dimensions annotations
    commands.push({
      type: CommandType.DRAW_DIMENSION,
      payload: {
        id: "plot_w_dim",
        x1: 0,
        y1: -4,
        x2: plotWidth,
        y2: -4,
        label: `${plotWidth}'`,
      },
    });

    commands.push({
      type: CommandType.DRAW_DIMENSION,
      payload: {
        id: "plot_h_dim",
        x1: -4,
        y1: 0,
        x2: -4,
        y2: plotHeight,
        label: `${plotHeight}'`,
      },
    });

    // 2. Determine rooms to draw
    const roomsList: VisionRoomLayout[] = result.rooms || [
      {
        id: "room_main",
        roomType: result.roomType || "living_room",
        x: 0,
        y: 0,
        dimensions: result.dimensions,
        furniture: result.furniture || [],
        doors: result.doors || [],
        windows: result.windows || [],
      },
    ];

    // 3. Generate room, wall, door, window, and furniture commands
    roomsList.forEach((room, index) => {
      const rx = room.x;
      const ry = room.y;
      const rw = room.dimensions.width;
      const rh = room.dimensions.height;

      // Draw Room
      commands.push({
        type: CommandType.DRAW_ROOM,
        payload: {
          id: room.id || `room_${index + 1}`,
          x: rx,
          y: ry,
          width: rw,
          height: rh,
          name: this.formatRoomName(room.roomType),
          roomType: room.roomType,
        },
      });

      // Add Room Text label
      commands.push({
        type: CommandType.DRAW_TEXT,
        payload: {
          id: `text_lbl_${room.id}`,
          x: rx + rw / 2,
          y: ry + rh / 2 - 1.5,
          text: this.formatRoomName(room.roomType),
          size: 14,
        },
      });

      // Add Room Size text label
      commands.push({
        type: CommandType.DRAW_TEXT,
        payload: {
          id: `text_dim_${room.id}`,
          x: rx + rw / 2,
          y: ry + rh / 2 + 1.5,
          text: `${rw}' x ${rh}'`,
          size: 11,
          color: "#4f46e5",
        },
      });

      // Draw Doors
      room.doors.forEach(d => {
        commands.push({
          type: CommandType.DRAW_DOOR,
          payload: {
            id: d.id,
            x: rx + d.x,
            y: ry + d.y,
            width: d.width || 3.0,
            orientation: d.orientation,
          },
        });
      });

      // Draw Windows
      room.windows.forEach(w => {
        commands.push({
          type: CommandType.DRAW_WINDOW,
          payload: {
            id: w.id,
            x: rx + w.x,
            y: ry + w.y,
            width: w.width || 4.0,
            orientation: w.orientation,
          },
        });
      });

      // Draw Furniture
      room.furniture.forEach(f => {
        commands.push({
          type: CommandType.DRAW_FURNITURE,
          payload: {
            id: f.id,
            type: f.type,
            x: rx + f.x + f.width / 2,
            y: ry + f.y + f.height / 2,
            width: f.width,
            height: f.height,
            rotation: f.rotation,
            color: this.getFurnitureColor(f.type),
          },
        });
      });
    });

    return commands;
  }

  private static formatRoomName(roomType: string): string {
    return roomType
      .split("_")
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }

  private static getFurnitureColor(type: string): string {
    const t = type.toLowerCase();
    if (t.includes("bed")) return "#d9f99d"; // light green
    if (t.includes("sofa")) return "#fef08a"; // light yellow
    if (t.includes("table") || t.includes("desk")) return "#fed7aa"; // light orange
    if (t.includes("tv")) return "#e2e8f0"; // light slate
    if (t.includes("wardrobe") || t.includes("closet")) return "#ddd6fe"; // light purple
    if (t.includes("toilet") || t.includes("basin") || t.includes("shower")) return "#bae6fd"; // light blue
    return "#e2e8f0";
  }
}
