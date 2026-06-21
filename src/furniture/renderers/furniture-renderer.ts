import { FurnitureItem } from "../types";
import { BlueprintCommand } from "../../blueprint/commands/command";
import { CommandType } from "../../blueprint/commands/command-types";

export function generateFurnitureCommands(
  furniture: FurnitureItem[],
): BlueprintCommand[] {
  const commands: BlueprintCommand[] = [];

  for (const f of furniture) {
    commands.push({
      type: CommandType.DRAW_FURNITURE,
      payload: {
        id: f.id,
        type: f.type,
        x: f.x,
        y: f.y,
        width: f.width,
        height: f.height,
        rotation: f.rotation,
        color: f.color_hex || "#64748b",
      },
    });
  }

  return commands;
}
