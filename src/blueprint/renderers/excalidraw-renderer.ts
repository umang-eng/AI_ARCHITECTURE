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
          backgroundColor: "#f8fafc", // sleek cool grey/white
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
          strokeColor: "#334155", // slate border
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
        const fontSize = p.size || 16;
        const charWidth = fontSize * 0.6;
        const textLines = p.text.split("\n");
        const maxLineLength = Math.max(...textLines.map((l: string) => l.length));
        const textW = maxLineLength * charWidth;
        const textH = textLines.length * fontSize * 1.25;

        elements.push({
          id: `text_${p.id}_${nextSeed()}`,
          type: "text",
          x: p.x - textW / 2,
          y: p.y - textH / 2,
          width: textW,
          height: textH,
          text: p.text,
          fontSize,
          fontFamily: 1,
          textAlign: p.align || "center",
          verticalAlign: "middle",
          strokeColor: p.color || "#0f172a",
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
          backgroundColor: "#38bdf8",
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
        // Line element
        elements.push({
          id: `dim_line_${p.id}`,
          type: "line",
          x: p.x1,
          y: p.y1,
          width: Math.abs(p.x2 - p.x1),
          height: Math.abs(p.y2 - p.y1),
          points: [[0, 0], [p.x2 - p.x1, p.y2 - p.y1]],
          strokeColor: "#6366f1", // indigo dimension
          backgroundColor: "transparent",
          fillStyle: "solid",
          strokeWidth: 1,
          strokeStyle: "dashed",
          roughness: 0,
          opacity: 80,
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

        // Label element if specified
        if (p.label) {
          const midX = (p.x1 + p.x2) / 2;
          const midY = (p.y1 + p.y2) / 2 - 1.2;
          const fontSize = 11;
          const charWidth = fontSize * 0.6;
          const textW = p.label.length * charWidth;
          const textH = fontSize * 1.25;

          elements.push({
            id: `dim_label_${p.id}`,
            type: "text",
            x: midX - textW / 2,
            y: midY - textH / 2,
            width: textW,
            height: textH,
            text: p.label,
            fontSize,
            fontFamily: 1,
            textAlign: "center",
            verticalAlign: "middle",
            strokeColor: "#4338ca",
            backgroundColor: "#ffffff",
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
            originalText: p.label,
            autoResize: true,
            lineHeight: 1.25,
          });
        }
        break;
      }

      case CommandType.DRAW_STAIRCASE: {
        const p = cmd.payload;
        // Staircase Outer Box
        elements.push({
          id: `stairs_box_${p.id}`,
          type: "rectangle",
          x: p.x,
          y: p.y,
          width: p.width,
          height: p.height,
          strokeColor: "#475569", // slate-600
          backgroundColor: "#f1f5f9", // slate-100
          fillStyle: "solid",
          strokeWidth: 2,
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

        // Stair steps (parallel lines inside the box)
        const isHorizontal = p.width >= p.height;
        const stepCount = 6;
        if (isHorizontal) {
          const stepSize = p.width / stepCount;
          for (let i = 1; i < stepCount; i++) {
            const sx = p.x + i * stepSize;
            elements.push({
              id: `stairs_step_${p.id}_${i}`,
              type: "line",
              x: sx,
              y: p.y,
              width: 0,
              height: p.height,
              points: [[0, 0], [0, p.height]],
              strokeColor: "#64748b",
              strokeWidth: 1,
              roughness: 0,
              seed: nextSeed(),
              version: 1,
              versionNonce: nextSeed(),
              isDeleted: false,
              updated: Date.now(),
            });
          }
        } else {
          const stepSize = p.height / stepCount;
          for (let i = 1; i < stepCount; i++) {
            const sy = p.y + i * stepSize;
            elements.push({
              id: `stairs_step_${p.id}_${i}`,
              type: "line",
              x: p.x,
              y: sy,
              width: p.width,
              height: 0,
              points: [[0, 0], [p.width, 0]],
              strokeColor: "#64748b",
              strokeWidth: 1,
              roughness: 0,
              seed: nextSeed(),
              version: 1,
              versionNonce: nextSeed(),
              isDeleted: false,
              updated: Date.now(),
            });
          }
        }

        // Draw "STAIRS" label centered
        const fontSize = 12;
        const textW = 5 * (fontSize * 0.6);
        const textH = fontSize * 1.25;
        elements.push({
          id: `stairs_label_${p.id}`,
          type: "text",
          x: p.x + p.width / 2 - textW / 2,
          y: p.y + p.height / 2 - textH / 2,
          width: textW,
          height: textH,
          text: "STAIRS",
          fontSize,
          fontFamily: 1,
          textAlign: "center",
          verticalAlign: "middle",
          strokeColor: "#475569",
          backgroundColor: "transparent",
          seed: nextSeed(),
          version: 1,
          versionNonce: nextSeed(),
          isDeleted: false,
          updated: Date.now(),
        });
        break;
      }

      case CommandType.DRAW_NORTH_ARROW: {
        const p = cmd.payload;
        // North Compass Circle
        elements.push({
          id: "compass_circle",
          type: "ellipse",
          x: p.x - p.size / 2,
          y: p.y - p.size / 2,
          width: p.size,
          height: p.size,
          strokeColor: "#334155",
          strokeWidth: 1.5,
          fillStyle: "transparent",
          roughness: 0,
          seed: nextSeed(),
          version: 1,
          versionNonce: nextSeed(),
          isDeleted: false,
          updated: Date.now(),
        });

        // Arrow pointing up
        elements.push({
          id: "compass_arrow",
          type: "arrow",
          x: p.x,
          y: p.y + p.size / 2 - 0.5,
          width: 0,
          height: p.size - 1,
          points: [[0, 0], [0, -(p.size - 1)]],
          strokeColor: "#e11d48", // red pointer
          strokeWidth: 1.5,
          roughness: 0,
          seed: nextSeed(),
          version: 1,
          versionNonce: nextSeed(),
          isDeleted: false,
          updated: Date.now(),
        });

        // Compass 'N' Text
        const fontSize = 11;
        const textW = fontSize * 0.6;
        const textH = fontSize * 1.25;
        elements.push({
          id: "compass_text",
          type: "text",
          x: p.x - textW / 2,
          y: p.y - p.size / 2 - textH - 0.5,
          width: textW,
          height: textH,
          text: "N",
          fontSize,
          fontFamily: 1,
          strokeColor: "#334155",
          seed: nextSeed(),
          version: 1,
          versionNonce: nextSeed(),
          isDeleted: false,
          updated: Date.now(),
        });
        break;
      }

      case CommandType.DRAW_SCALE_INDICATOR: {
        const p = cmd.payload;
        // Horizontal line
        elements.push({
          id: "scale_line",
          type: "line",
          x: p.x,
          y: p.y,
          width: p.length,
          height: 0,
          points: [[0, 0], [p.length, 0]],
          strokeColor: "#334155",
          strokeWidth: 1.5,
          roughness: 0,
          seed: nextSeed(),
          version: 1,
          versionNonce: nextSeed(),
          isDeleted: false,
          updated: Date.now(),
        });

        // Left tick mark
        elements.push({
          id: "scale_left_tick",
          type: "line",
          x: p.x,
          y: p.y - 0.6,
          width: 0,
          height: 1.2,
          points: [[0, 0], [0, 1.2]],
          strokeColor: "#334155",
          strokeWidth: 1.5,
          roughness: 0,
          seed: nextSeed(),
          version: 1,
          versionNonce: nextSeed(),
          isDeleted: false,
          updated: Date.now(),
        });

        // Right tick mark
        elements.push({
          id: "scale_right_tick",
          type: "line",
          x: p.x + p.length,
          y: p.y - 0.6,
          width: 0,
          height: 1.2,
          points: [[0, 0], [0, 1.2]],
          strokeColor: "#334155",
          strokeWidth: 1.5,
          roughness: 0,
          seed: nextSeed(),
          version: 1,
          versionNonce: nextSeed(),
          isDeleted: false,
          updated: Date.now(),
        });

        // Scale label "10 ft" or "10'"
        const label = `${p.length}'`;
        const fontSize = 10;
        const textW = label.length * (fontSize * 0.6);
        const textH = fontSize * 1.25;
        elements.push({
          id: "scale_text",
          type: "text",
          x: p.x + p.length / 2 - textW / 2,
          y: p.y - textH - 0.4,
          width: textW,
          height: textH,
          text: label,
          fontSize,
          fontFamily: 1,
          strokeColor: "#334155",
          seed: nextSeed(),
          version: 1,
          versionNonce: nextSeed(),
          isDeleted: false,
          updated: Date.now(),
        });
        break;
      }

      case CommandType.DRAW_AREA_SUMMARY: {
        const p = cmd.payload;
        // Background card
        elements.push({
          id: "summary_card",
          type: "rectangle",
          x: p.x,
          y: p.y,
          width: p.width,
          height: p.height,
          strokeColor: "#4f46e5", // Indigo border
          backgroundColor: "#ffffff",
          fillStyle: "solid",
          strokeWidth: 1.5,
          roughness: 0,
          opacity: 95,
          angle: 0,
          roundness: { type: 3 },
          seed: nextSeed(),
          version: 1,
          versionNonce: nextSeed(),
          isDeleted: false,
          updated: Date.now(),
        });

        // Multiline summary text
        const text = `AREA SUMMARY\nPlot Area: ${p.plotArea} sq ft\nBuilt Area: ${p.builtArea} sq ft\nEfficiency: ${p.utilization}%`;
        const fontSize = 10;
        const charWidth = fontSize * 0.55;
        const textLines = text.split("\n");
        const maxLen = Math.max(...textLines.map((l) => l.length));
        const textW = maxLen * charWidth;
        const textH = textLines.length * fontSize * 1.3;

        elements.push({
          id: "summary_card_text",
          type: "text",
          x: p.x + p.width / 2 - textW / 2,
          y: p.y + p.height / 2 - textH / 2,
          width: textW,
          height: textH,
          text: text,
          fontSize,
          fontFamily: 1,
          textAlign: "left",
          verticalAlign: "middle",
          strokeColor: "#1e1b4b", // deep blue
          seed: nextSeed(),
          version: 1,
          versionNonce: nextSeed(),
          isDeleted: false,
          updated: Date.now(),
          originalText: text,
          lineHeight: 1.3,
        });
        break;
      }
    }
  }

  return elements;
}
