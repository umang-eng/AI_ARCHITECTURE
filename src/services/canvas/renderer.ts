/**
 * Canvas Renderer Service — wraps the core Excalidraw renderer.
 * Converts commands to Excalidraw elements and manages the rendering pipeline.
 */

import type { BlueprintCommand } from "@/blueprint/commands/command";
import { commandsToExcalidrawElements, resetSeed } from "@/blueprint/renderers/excalidraw-renderer";

export interface RenderResult {
  elements: any[];
  elementCount: number;
  plotWidth: number;
  plotHeight: number;
}

export function renderCommandsToCanvas(
  commands: BlueprintCommand[],
  seed?: number,
): RenderResult {
  resetSeed(seed);

  const elements = commandsToExcalidrawElements(commands);

  let plotWidth = 60;
  let plotHeight = 80;

  const plotCmd = commands.find((c) => c.type === "DRAW_PLOT");
  if (plotCmd?.payload) {
    plotWidth = plotCmd.payload.width || 60;
    plotHeight = plotCmd.payload.height || 80;
  }

  return {
    elements,
    elementCount: elements.length,
    plotWidth,
    plotHeight,
  };
}
