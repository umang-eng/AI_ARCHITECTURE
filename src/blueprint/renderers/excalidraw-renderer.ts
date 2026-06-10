import { BlueprintCommand } from "../commands/command";
import { CommandType } from "../commands/command-types";

let _seed = 42;
function nextSeed(): number {
  _seed = (_seed * 16807 + 0) % 2147483647;
  return _seed;
}

export function resetSeed(seed?: number): void {
  _seed = seed ?? 42;
}

export function commandsToExcalidrawElements(
  commands: BlueprintCommand[],
): any[] {
  const elements: any[] = [];

  for (const cmd of commands) {
    switch (cmd.type) {
      case CommandType.DRAW_PLOT: {
        const p = cmd.payload;
        elements.push({
          id: "plot_border",
          type: "rectangle",
          x: 0,
          y: 0,
          width: p.width,
          height: p.height,
          strokeColor: "#1e2530",
          backgroundColor: "#f0f0f0",
          fillStyle: "solid",
          strokeWidth: 2,
          strokeStyle: "solid",
          roughness: 0,
          opacity: 100,
          angle: 0,
          groupIds: ["plot"],
          frameId: null,
          roundness: { type: 3 },
          seed: nextSeed(),
          version: 1,
          versionNonce: nextSeed(),
          isDeleted: false,
          boundElements: null,
          updated: Date.now(),
          link: null,
          locked: false,
        });
        break;
      }

      case CommandType.DRAW_ROOM: {
        const p = cmd.payload;
        elements.push({
          id: `room_${p.id}`,
          type: "rectangle",
          x: p.x,
          y: p.y,
          width: p.width,
          height: p.height,
          strokeColor: "#1e2530",
          backgroundColor: "#ffffff",
          fillStyle: "solid",
          strokeWidth: 2,
          roughness: 0,
          opacity: 100,
          angle: 0,
          groupIds: [`room_${p.id}`],
          frameId: null,
          roundness: { type: 3 },
          seed: nextSeed(),
          version: 1,
          versionNonce: nextSeed(),
          isDeleted: false,
          boundElements: null,
          updated: Date.now(),
          link: null,
          locked: false,
        });
        break;
      }

      case CommandType.DRAW_TEXT: {
        const p = cmd.payload;
        const fontSize = 20;
        const charWidth = fontSize * 0.6;
        const textW = p.text.length * charWidth;
        const textH = fontSize * 1.25;
        elements.push({
          id: `text_${p.id}`,
          type: "text",
          x: p.x - textW / 2,
          y: p.y - textH / 2,
          width: textW,
          height: textH,
          text: p.text,
          fontSize,
          fontFamily: 1,
          textAlign: "center",
          verticalAlign: "middle",
          strokeColor: "#1e2530",
          backgroundColor: "transparent",
          fillStyle: "solid",
          strokeWidth: 1,
          roughness: 0,
          opacity: 100,
          angle: 0,
          groupIds: [],
          frameId: null,
          roundness: null,
          seed: nextSeed(),
          version: 1,
          versionNonce: nextSeed(),
          isDeleted: false,
          boundElements: null,
          updated: Date.now(),
          link: null,
          locked: false,
          originalText: p.text,
          autoResize: true,
          lineHeight: 1.25,
        });
        break;
      }

      case CommandType.DRAW_DOOR: {
        const p = cmd.payload;
        elements.push({
          id: `door_${p.id}`,
          type: "rectangle",
          x: p.x - (p.width || 3) / 2,
          y: p.y - 0.2,
          width: p.width || 3,
          height: 0.4,
          strokeColor: "#e11d48",
          backgroundColor: "#e11d48",
          fillStyle: "solid",
          strokeWidth: 1,
          roughness: 0,
          opacity: 100,
          angle: 0,
          groupIds: [],
          frameId: null,
          roundness: null,
          seed: nextSeed(),
          version: 1,
          versionNonce: nextSeed(),
          isDeleted: false,
          boundElements: null,
          updated: Date.now(),
          link: null,
          locked: false,
        });
        break;
      }

      case CommandType.DRAW_WINDOW: {
        const p = cmd.payload;
        elements.push({
          id: `window_${p.id}`,
          type: "rectangle",
          x: p.x - (p.width || 4) / 2,
          y: p.y - 0.15,
          width: p.width || 4,
          height: 0.3,
          strokeColor: "#0ea5e9",
          backgroundColor: "#0ea5e9",
          fillStyle: "solid",
          strokeWidth: 1,
          roughness: 0,
          opacity: 100,
          angle: 0,
          groupIds: [],
          frameId: null,
          roundness: null,
          seed: nextSeed(),
          version: 1,
          versionNonce: nextSeed(),
          isDeleted: false,
          boundElements: null,
          updated: Date.now(),
          link: null,
          locked: false,
        });
        break;
      }

      case CommandType.DRAW_DIMENSION: {
        const p = cmd.payload;
        elements.push({
          id: `dim_${p.id}`,
          type: "line",
          x: p.x1,
          y: p.y1,
          width: Math.abs(p.x2 - p.x1),
          height: Math.abs(p.y2 - p.y1),
          points: [[0, 0], [p.x2 - p.x1, p.y2 - p.y1]],
          strokeColor: "#4f46e5",
          backgroundColor: "transparent",
          fillStyle: "solid",
          strokeWidth: 1,
          strokeStyle: "dashed",
          roughness: 0,
          opacity: 100,
          angle: 0,
          groupIds: [],
          frameId: null,
          roundness: null,
          seed: nextSeed(),
          version: 1,
          versionNonce: nextSeed(),
          isDeleted: false,
          boundElements: null,
          updated: Date.now(),
          link: null,
          locked: false,
        });
        break;
      }
    }
  }

  return elements;
}
