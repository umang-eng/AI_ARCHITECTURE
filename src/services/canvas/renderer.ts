import type { BlueprintCommand } from "@/blueprint/commands/command";
import { CommandType } from "@/blueprint/commands/command-types";

export interface RenderResult {
  commands: BlueprintCommand[];
  commandCount: number;
  plotWidth: number;
  plotHeight: number;
}

export function renderCommandsToCanvas(
  commands: BlueprintCommand[],
): RenderResult {
  let plotWidth = 60;
  let plotHeight = 80;

  const plotCmd = commands.find((c) => c.type === CommandType.DRAW_PLOT);
  if (plotCmd?.payload) {
    plotWidth = plotCmd.payload.width || 60;
    plotHeight = plotCmd.payload.height || 80;
  }

  return {
    commands,
    commandCount: commands.length,
    plotWidth,
    plotHeight,
  };
}
