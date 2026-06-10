import { Blueprint } from "../types/blueprint";
import { BlueprintCommand } from "../commands/command";
import { CommandType } from "../commands/command-types";

export function generateCommands(blueprint: Blueprint): BlueprintCommand[] {
  const commands: BlueprintCommand[] = [];

  commands.push({
    type: CommandType.DRAW_PLOT,
    payload: {
      id: "plot",
      width: blueprint.plot.width,
      height: blueprint.plot.height,
    },
  });

  for (const room of blueprint.rooms) {
    commands.push({
      type: CommandType.DRAW_ROOM,
      payload: {
        id: room.id,
        x: room.x,
        y: room.y,
        width: room.width,
        height: room.height,
        name: room.name,
      },
    });

    commands.push({
      type: CommandType.DRAW_TEXT,
      payload: {
        id: `text_${room.id}`,
        x: room.x + room.width / 2,
        y: room.y + room.height / 2,
        text: room.name,
      },
    });
  }

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

  return commands;
}
