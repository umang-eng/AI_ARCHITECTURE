import { BlueprintCommand } from "../commands/command";
import { CommandType } from "../commands/command-types";

const SCALE = 16;

let _seed = 42;
function nextSeed(): number {
  _seed = (_seed * 16807 + 0) % 2147483647;
  return _seed;
}

export function resetSeed(seed?: number): void {
  _seed = seed ?? 42;
}

function s(v: number): number {
  return Math.round(v * SCALE);
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
          id: `plot_border`,
          type: "rectangle",
          x: 0,
          y: 0,
          width: s(p.width),
          height: s(p.height),
          strokeColor: "#1e2530",
          backgroundColor: "#f8f9fa",
          fillStyle: "solid",
          strokeWidth: 3,
          strokeStyle: "solid",
          roughness: 0,
          opacity: 100,
          angle: 0,
          groupIds: [],
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
          x: s(p.x),
          y: s(p.y),
          width: s(p.width),
          height: s(p.height),
          strokeColor: "#1e2530",
          backgroundColor: "#ffffff",
          fillStyle: "solid",
          strokeWidth: 2,
          roughness: 0,
          opacity: 100,
          angle: 0,
          groupIds: [],
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
        const fontSize = 14;
        const textWidth = p.text.length * 7;
        elements.push({
          id: `text_${p.id}`,
          type: "text",
          x: s(p.x) - textWidth / 2,
          y: s(p.y) - fontSize / 2,
          width: textWidth,
          height: fontSize * 1.25,
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
        const doorW = s(p.width || 3);
        const doorH = s(0.25);
        elements.push({
          id: `door_${p.id}`,
          type: "rectangle",
          x: s(p.x) - doorW / 2,
          y: s(p.y) - doorH / 2,
          width: doorW,
          height: doorH,
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
        const winW = s(p.width || 4);
        const winH = s(0.2);
        elements.push({
          id: `window_${p.id}`,
          type: "rectangle",
          x: s(p.x) - winW / 2,
          y: s(p.y) - winH / 2,
          width: winW,
          height: winH,
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
          x: s(p.x1),
          y: s(p.y1),
          width: Math.abs(s(p.x2) - s(p.x1)),
          height: Math.abs(s(p.y2) - s(p.y1)),
          points: [[0, 0], [s(p.x2) - s(p.x1), s(p.y2) - s(p.y1)]],
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
