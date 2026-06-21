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

      case CommandType.DRAW_FURNITURE: {
        const p = cmd.payload;
        const angle = (p.rotation * Math.PI) / 180;
        const groupIds = [p.id];

        const pushSub = (
          type: string,
          relX: number,
          relY: number,
          w: number,
          h: number,
          extra: any = {},
        ) => {
          const cos = Math.cos(angle);
          const sin = Math.sin(angle);
          const rx = p.x + relX * cos - relY * sin;
          const ry = p.y + relX * sin + relY * cos;

          elements.push({
            id: `${type}_sub_${nextSeed()}`,
            type,
            x: rx - w / 2,
            y: ry - h / 2,
            width: w,
            height: h,
            angle,
            roughness: 0,
            isDeleted: false,
            updated: Date.now(),
            seed: nextSeed(),
            version: 1,
            versionNonce: nextSeed(),
            groupIds,
            frameId: null,
            roundness: null,
            boundElements: null,
            link: null,
            locked: false,
            ...extra,
          });
        };

        const pushSubLine = (
          x1: number,
          y1: number,
          x2: number,
          y2: number,
          extra: any = {},
        ) => {
          const cos = Math.cos(angle);
          const sin = Math.sin(angle);
          const rx1 = p.x + x1 * cos - y1 * sin;
          const ry1 = p.y + x1 * sin + y1 * cos;
          const rx2 = p.x + x2 * cos - y2 * sin;
          const ry2 = p.y + x2 * sin + y2 * cos;

          elements.push({
            id: `line_sub_${nextSeed()}`,
            type: "line",
            x: rx1,
            y: ry1,
            width: Math.abs(rx2 - rx1),
            height: Math.abs(ry2 - ry1),
            points: [[0, 0], [rx2 - rx1, ry2 - ry1]],
            angle: 0, // line points are already rotated
            roughness: 0,
            isDeleted: false,
            updated: Date.now(),
            seed: nextSeed(),
            version: 1,
            versionNonce: nextSeed(),
            groupIds,
            frameId: null,
            roundness: null,
            boundElements: null,
            link: null,
            locked: false,
            ...extra,
          });
        };

        // 1. Draw solid footprint rectangle
        pushSub("rectangle", 0, 0, p.width, p.height, {
          strokeColor: "#475569",
          backgroundColor: p.color,
          fillStyle: "solid",
          strokeWidth: 1.5,
          opacity: 45,
          roundness: { type: 3 },
        });

        // 2. Add high-fidelity furniture icons
        const type = p.type.toLowerCase();

        if (type.includes("bed")) {
          // Pillows at the top
          const pillowW = p.width * 0.35;
          const pillowH = p.height * 0.15;
          const pillowY = -p.height / 2 + pillowH / 2 + 0.4;
          
          if (type.includes("single")) {
            pushSub("rectangle", 0, pillowY, pillowW, pillowH, {
              strokeColor: "#64748b",
              backgroundColor: "#ffffff",
              fillStyle: "solid",
              roundness: { type: 3 },
            });
          } else {
            pushSub("rectangle", -p.width * 0.22, pillowY, pillowW, pillowH, {
              strokeColor: "#64748b",
              backgroundColor: "#ffffff",
              fillStyle: "solid",
              roundness: { type: 3 },
            });
            pushSub("rectangle", p.width * 0.22, pillowY, pillowW, pillowH, {
              strokeColor: "#64748b",
              backgroundColor: "#ffffff",
              fillStyle: "solid",
              roundness: { type: 3 },
            });
          }
          // Blanket line
          pushSubLine(-p.width / 2, p.height * 0.1, p.width / 2, p.height * 0.1, {
            strokeColor: "#64748b",
            strokeWidth: 1,
          });
        } 
        
        else if (type.includes("sofa")) {
          const isL = type.includes("l_sofa");
          // Armrests
          const armW = 0.5;
          pushSub("rectangle", -p.width / 2 + armW / 2, 0, armW, p.height, {
            strokeColor: "#475569",
            backgroundColor: "#ffffff",
            fillStyle: "solid",
          });
          pushSub("rectangle", p.width / 2 - armW / 2, 0, armW, p.height, {
            strokeColor: "#475569",
            backgroundColor: "#ffffff",
            fillStyle: "solid",
          });
          
          if (isL) {
            pushSub("rectangle", 0, p.height / 2 - armW / 2, p.width, armW, {
              strokeColor: "#475569",
              backgroundColor: "#ffffff",
              fillStyle: "solid",
            });
          } else {
            // Seat division lines
            pushSubLine(-p.width / 2 + armW, -p.height / 2 + 0.8, p.width / 2 - armW, -p.height / 2 + 0.8, {
              strokeColor: "#475569",
            });
            pushSubLine(0, -p.height / 2 + 0.8, 0, p.height / 2, {
              strokeColor: "#475569",
            });
          }
        } 
        
        else if (type.includes("tv_unit")) {
          // Inner TV screen line
          pushSubLine(-p.width * 0.35, 0, p.width * 0.35, 0, {
            strokeColor: "#0f172a",
            strokeWidth: 2,
          });
        } 
        
        else if (type.includes("dining_table")) {
          // Draw place setting circles on the table
          const settingR = 0.6;
          pushSub("ellipse", -p.width * 0.25, 0, settingR, settingR, {
            strokeColor: "#64748b",
            backgroundColor: "#ffffff",
            fillStyle: "solid",
          });
          pushSub("ellipse", p.width * 0.25, 0, settingR, settingR, {
            strokeColor: "#64748b",
            backgroundColor: "#ffffff",
            fillStyle: "solid",
          });
        } 
        
        else if (type === "toilet") {
          // Tank at top
          pushSub("rectangle", 0, -p.height / 2 + 0.4, p.width * 0.9, 0.7, {
            strokeColor: "#475569",
            backgroundColor: "#ffffff",
            fillStyle: "solid",
          });
          // Bowl at center/bottom
          pushSub("ellipse", 0, 0.3, p.width * 0.8, p.height * 0.6, {
            strokeColor: "#475569",
            backgroundColor: "#ffffff",
            fillStyle: "solid",
          });
        } 
        
        else if (type === "shower") {
          // Diagonal corner-to-corner glass lines
          pushSubLine(-p.width / 2, -p.height / 2, p.width / 2, p.height / 2, {
            strokeColor: "#38bdf8",
          });
        } 
        
        else if (type === "wash_basin") {
          // Outer bowl
          pushSub("ellipse", 0, 0, p.width * 0.8, p.height * 0.8, {
            strokeColor: "#475569",
            backgroundColor: "#ffffff",
            fillStyle: "solid",
          });
          // Drain circle
          pushSub("ellipse", 0, -0.2, 0.2, 0.2, {
            strokeColor: "#64748b",
            backgroundColor: "#64748b",
            fillStyle: "solid",
          });
        }

        // 3. Draw short text label (abbreviated e.g. "TV", "BED", "SOFA")
        const label = getFurnitureLabel(p.type);
        const fontSize = 9;
        const charW = fontSize * 0.65;
        const textW = label.length * charW;
        const textH = fontSize * 1.25;

        // Centered label, slightly offset if needed
        pushSub("text", 0, 0, textW, textH, {
          text: label,
          fontSize,
          fontFamily: 1,
          textAlign: "center",
          verticalAlign: "middle",
          strokeColor: "#0f172a",
          originalText: label,
          lineHeight: 1.25,
        });

        break;
      }
    }
  }

  return elements;
}

function getFurnitureLabel(type: string): string {
  const map: Record<string, string> = {
    sofa: "SOFA",
    l_sofa: "SOFA",
    tv_unit: "TV UNIT",
    coffee_table: "TABLE",
    side_table: "TABLE",
    bookshelf: "BOOKS",
    single_bed: "BED",
    queen_bed: "BED",
    king_bed: "BED",
    wardrobe: "WARDROBE",
    study_desk: "DESK",
    dressing_table: "DRESSER",
    counter: "COUNTER",
    refrigerator: "FRIDGE",
    oven: "OVEN",
    sink: "SINK",
    dining_table: "DINING",
    dining_chair: "CHAIR",
    office_desk: "DESK",
    office_chair: "CHAIR",
    office_cabinet: "CABINET",
    wash_basin: "BASIN",
    shower: "SHOWER",
    toilet: "TOILET",
  };
  return map[type] || type.toUpperCase();
}
