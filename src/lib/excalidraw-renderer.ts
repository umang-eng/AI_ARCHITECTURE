/**
 * Excalidraw Renderer — converts BlueprintCommands to Excalidraw elements.
 *
 * Architecture: Blueprint Commands → Excalidraw Elements
 *
 * Uses the @excalidraw/excalidraw API types. Each command maps to one or more
 * Excalidraw elements with stable IDs for undo/redo.
 */

import type { BlueprintCommand } from "@/types/blueprint-commands";

type ExcalidrawAnyElement = any;

// ── ID stability ────────────────────────────────────────────────────

const elementIdMap = new Map<string, string>();

export function clearElementIdMap(): void {
  elementIdMap.clear();
}

function stableId(cmdId: string): string {
  if (!elementIdMap.has(cmdId)) {
    elementIdMap.set(cmdId, `exc_${cmdId}_${Date.now().toString(36)}`);
  }
  return elementIdMap.get(cmdId)!;
}

// ── Base element factory ────────────────────────────────────────────

function baseElement(
  type: string,
  cmdId: string,
  overrides: Partial<ExcalidrawAnyElement> = {},
): ExcalidrawAnyElement {
  return {
    id: stableId(cmdId),
    type: type as any,
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    angle: 0,
    strokeColor: "#1e2530",
    backgroundColor: "transparent",
    fillStyle: "solid",
    strokeWidth: 2,
    strokeStyle: "solid",
    roughness: 0,
    opacity: 100,
    groupIds: [],
    frameId: null,
    index: null as any,
    roundness: null,
    seed: Math.floor(Math.random() * 2000000000),
    version: 1,
    versionNonce: Math.floor(Math.random() * 2000000000),
    isDeleted: false,
    boundElements: null,
    updated: Date.now(),
    link: null,
    locked: false,
    customData: undefined,
    ...overrides,
  } as ExcalidrawAnyElement;
}

// ── Command → Elements ──────────────────────────────────────────────

function renderPlotBoundary(cmd: BlueprintCommand & { type: "DRAW_PLOT_BOUNDARY" }): ExcalidrawAnyElement[] {
  return [
    baseElement("rectangle", cmd.id, {
      x: cmd.x,
      y: cmd.y,
      width: cmd.width,
      height: cmd.height,
      strokeColor: "#222222",
      backgroundColor: "#fbfaf5",
      fillStyle: "solid",
      strokeWidth: 3,
      roughness: 0,
    }),
  ];
}

function renderRoom(cmd: BlueprintCommand & { type: "DRAW_ROOM" }): ExcalidrawAnyElement[] {
  const elements: ExcalidrawAnyElement[] = [];

  // Room rectangle
  elements.push(
    baseElement("rectangle", cmd.id, {
      x: cmd.x,
      y: cmd.y,
      width: cmd.width,
      height: cmd.height,
      strokeColor: "#222222",
      backgroundColor: cmd.color_hex || "#ffffff",
      fillStyle: "solid",
      strokeWidth: 2,
      roughness: 0,
      roundness: { type: 3 },
    }),
  );

  return elements;
}

function renderWall(cmd: BlueprintCommand & { type: "DRAW_WALL" }): ExcalidrawAnyElement[] {
  return [
    baseElement("line", cmd.id, {
      x: cmd.x1,
      y: cmd.y1,
      width: cmd.x2 - cmd.x1,
      height: cmd.y2 - cmd.y1,
      points: [
        [0, 0],
        [cmd.x2 - cmd.x1, cmd.y2 - cmd.y1],
      ] as any,
      strokeColor: cmd.wall_type === "exterior" ? "#111111" : "#333333",
      strokeWidth: cmd.wall_type === "exterior" ? 4 : 2,
      roughness: 0,
    }),
  ];
}

function renderDoor(cmd: BlueprintCommand & { type: "DRAW_DOOR" }): ExcalidrawAnyElement[] {
  const elements: ExcalidrawAnyElement[] = [];
  const isH = cmd.orientation === "horizontal";

  // Door gap (white line to break the wall)
  elements.push(
    baseElement("line", `${cmd.id}_gap`, {
      x: cmd.x - (isH ? cmd.width / 2 : 0),
      y: cmd.y - (isH ? 0 : cmd.width / 2),
      width: isH ? cmd.width : 0,
      height: isH ? 0 : cmd.width,
      points: [
        [0, 0],
        [isH ? cmd.width : 0, isH ? 0 : cmd.width],
      ] as any,
      strokeColor: "#fbfaf5",
      strokeWidth: 8,
      roughness: 0,
    }),
  );

  // Door leaf
  elements.push(
    baseElement("line", `${cmd.id}_leaf`, {
      x: cmd.x - (isH ? cmd.width / 2 : 0),
      y: cmd.y - (isH ? 0 : cmd.width / 2),
      width: isH ? cmd.width : 0,
      height: isH ? 0 : cmd.width,
      points: [
        [0, 0],
        [isH ? cmd.width : 0, isH ? 0 : cmd.width],
      ] as any,
      strokeColor: "#222222",
      strokeWidth: 2,
      roughness: 0,
    }),
  );

  // Door arc (swing indicator)
  const arcRadius = cmd.width * 1.2;
  elements.push(
    baseElement("arc", `${cmd.id}_arc`, {
      x: cmd.x - (isH ? cmd.width / 2 : 0),
      y: cmd.y - (isH ? 0 : cmd.width / 2),
      width: arcRadius,
      height: arcRadius,
      strokeColor: "#222222",
      strokeWidth: 1,
      roughness: 0,
      opacity: 60,
    } as any),
  );

  return elements;
}

function renderWindow(cmd: BlueprintCommand & { type: "DRAW_WINDOW" }): ExcalidrawAnyElement[] {
  const isV = cmd.orientation === "vertical";

  return [
    baseElement("line", cmd.id, {
      x: cmd.x - (isV ? 0 : cmd.width / 2),
      y: cmd.y - (isV ? cmd.width / 2 : 0),
      width: isV ? 0 : cmd.width,
      height: isV ? cmd.width : 0,
      points: [
        [0, 0],
        [isV ? 0 : cmd.width, isV ? cmd.width : 0],
      ] as any,
      strokeColor: "#0ea5e9",
      strokeWidth: 3,
      roughness: 0,
    }),
  ];
}

function renderStair(cmd: BlueprintCommand & { type: "DRAW_STAIR" }): ExcalidrawAnyElement[] {
  const elements: ExcalidrawAnyElement[] = [];

  // Stair outline
  elements.push(
    baseElement("rectangle", cmd.id, {
      x: cmd.x,
      y: cmd.y,
      width: cmd.width,
      height: cmd.height,
      strokeColor: "#7c3aed",
      backgroundColor: "#f3e5f5",
      fillStyle: "solid",
      strokeWidth: 2,
      roughness: 0,
    }),
  );

  // Stair lines (treads)
  const lineCount = Math.max(3, Math.floor(cmd.height / 3));
  for (let i = 1; i < lineCount; i++) {
    const ly = cmd.y + (cmd.height / lineCount) * i;
    elements.push(
      baseElement("line", `${cmd.id}_tread_${i}`, {
        x: cmd.x,
        y: ly,
        width: cmd.width,
        height: 0,
        points: [[0, 0], [cmd.width, 0]] as any,
        strokeColor: "#7c3aed",
        strokeWidth: 1,
        roughness: 0,
        opacity: 50,
      }),
    );
  }

  // Arrow
  const arrowY = cmd.direction === "up" ? cmd.y + 4 : cmd.y + cmd.height - 4;
  elements.push(
    baseElement("arrow", `${cmd.id}_arrow`, {
      x: cmd.x + cmd.width / 2,
      y: arrowY,
      width: 0,
      height: cmd.direction === "up" ? -cmd.height * 0.6 : cmd.height * 0.6,
      points: [
        [0, 0],
        [0, cmd.direction === "up" ? -cmd.height * 0.6 : cmd.height * 0.6],
      ] as any,
      strokeColor: "#7c3aed",
      strokeWidth: 2,
      roughness: 0,
    } as any),
  );

  return elements;
}

function renderText(cmd: BlueprintCommand & { type: "DRAW_TEXT" }): ExcalidrawAnyElement[] {
  return [
    baseElement("text", cmd.id, {
      x: cmd.x,
      y: cmd.y,
      width: cmd.text.length * cmd.font_size * 0.6,
      height: cmd.font_size * 1.2,
      text: cmd.text,
      fontSize: cmd.font_size,
      fontFamily: 3,
      textAlign: "center",
      verticalAlign: "middle",
      strokeColor: cmd.color || "#1e2530",
      backgroundColor: "transparent",
      roughness: 0,
      originalText: cmd.text,
      autoResize: true,
      lineHeight: 1.25,
    } as any),
  ];
}

function renderDimension(cmd: BlueprintCommand & { type: "DRAW_DIMENSION" }): ExcalidrawAnyElement[] {
  const elements: ExcalidrawAnyElement[] = [];

  // Dimension line
  elements.push(
    baseElement("line", `${cmd.id}_line`, {
      x: cmd.x1,
      y: cmd.y1,
      width: cmd.x2 - cmd.x1,
      height: cmd.y2 - cmd.y1,
      points: [
        [0, 0],
        [cmd.x2 - cmd.x1, cmd.y2 - cmd.y1],
      ] as any,
      strokeColor: "#4f46e5",
      strokeWidth: 1,
      roughness: 0,
      strokeStyle: "dashed",
    }),
  );

  // Dimension label
  const midX = (cmd.x1 + cmd.x2) / 2;
  const midY = (cmd.y1 + cmd.y2) / 2;
  elements.push(
    baseElement("text", `${cmd.id}_label`, {
      x: midX - 20,
      y: midY - 8,
      width: 40,
      height: 16,
      text: cmd.label,
      fontSize: 10,
      fontFamily: 3,
      textAlign: "center",
      verticalAlign: "middle",
      strokeColor: "#4f46e5",
      backgroundColor: "transparent",
      roughness: 0,
      originalText: cmd.label,
      autoResize: true,
      lineHeight: 1.25,
    } as any),
  );

  // End ticks
  const isHorizontal = Math.abs(cmd.y1 - cmd.y2) < 1;
  if (isHorizontal) {
    elements.push(
      baseElement("line", `${cmd.id}_tick1`, {
        x: cmd.x1, y: cmd.y1 - 4, width: 0, height: 8,
        points: [[0, -4], [0, 4]] as any,
        strokeColor: "#4f46e5", strokeWidth: 1, roughness: 0,
      }),
      baseElement("line", `${cmd.id}_tick2`, {
        x: cmd.x2, y: cmd.y2 - 4, width: 0, height: 8,
        points: [[0, -4], [0, 4]] as any,
        strokeColor: "#4f46e5", strokeWidth: 1, roughness: 0,
      }),
    );
  } else {
    elements.push(
      baseElement("line", `${cmd.id}_tick1`, {
        x: cmd.x1 - 4, y: cmd.y1, width: 8, height: 0,
        points: [[-4, 0], [4, 0]] as any,
        strokeColor: "#4f46e5", strokeWidth: 1, roughness: 0,
      }),
      baseElement("line", `${cmd.id}_tick2`, {
        x: cmd.x2 - 4, y: cmd.y2, width: 8, height: 0,
        points: [[-4, 0], [4, 0]] as any,
        strokeColor: "#4f46e5", strokeWidth: 1, roughness: 0,
      }),
    );
  }

  return elements;
}

// ── Main Renderer ───────────────────────────────────────────────────

export function commandsToExcalidrawElements(
  commands: BlueprintCommand[],
): ExcalidrawAnyElement[] {
  const elements: ExcalidrawAnyElement[] = [];

  for (const cmd of commands) {
    switch (cmd.type) {
      case "DRAW_PLOT_BOUNDARY":
        elements.push(...renderPlotBoundary(cmd as any));
        break;
      case "DRAW_ROOM":
        elements.push(...renderRoom(cmd as any));
        break;
      case "DRAW_WALL":
        elements.push(...renderWall(cmd as any));
        break;
      case "DRAW_DOOR":
        elements.push(...renderDoor(cmd as any));
        break;
      case "DRAW_WINDOW":
        elements.push(...renderWindow(cmd as any));
        break;
      case "DRAW_STAIR":
        elements.push(...renderStair(cmd as any));
        break;
      case "DRAW_TEXT":
        elements.push(...renderText(cmd as any));
        break;
      case "DRAW_DIMENSION":
        elements.push(...renderDimension(cmd as any));
        break;
    }
  }

  return elements;
}
