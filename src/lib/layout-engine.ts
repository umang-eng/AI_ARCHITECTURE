/**
 * Layout Engine — procedural blueprint generation with variation support.
 *
 * Input: Plot dimensions, room counts, building type, style, variant
 * Output: BlueprintSchema with room coordinates, walls, doors, windows
 *
 * Each variant produces a different but valid layout.
 */

import type {
  BlueprintSchema,
  RoomData,
  WallData,
  DoorData,
  WindowData,
  StairData,
  BuildingType,
  ArchitecturalStyle,
} from "@/types/blueprint-schema";

let idCounter = 0;
function uid(prefix: string): string {
  return `${prefix}${++idCounter}`;
}

function resetIds(): void {
  idCounter = 0;
}

// ── Room Defaults ───────────────────────────────────────────────────

const ROOM_COLORS: Record<string, string> = {
  bedroom: "#E8F4F8",
  bathroom: "#F0F8E8",
  kitchen: "#FFF8E1",
  living: "#FFF3E0",
  dining: "#FCE4EC",
  hallway: "#F5F5F5",
  garage: "#EEEEEE",
  garden: "#E8F5E9",
  staircase: "#F3E5F5",
  office: "#E3F2FD",
  pool: "#E0F7FA",
  storage: "#FAFAFA",
  cloakroom: "#F3E5F5",
  pantry: "#FFF8E1",
  laundry: "#E0F7FA",
  generic: "#FFFFFF",
};

const MIN_ROOM_SIZES: Record<string, { w: number; h: number }> = {
  bedroom: { w: 10, h: 10 },
  bathroom: { w: 5, h: 5 },
  kitchen: { w: 8, h: 8 },
  living: { w: 12, h: 10 },
  dining: { w: 8, h: 8 },
  hallway: { w: 3, h: 3 },
  garage: { w: 10, h: 18 },
  office: { w: 8, h: 8 },
  staircase: { w: 4, h: 6 },
};

// ── Variation Templates ─────────────────────────────────────────────

type LayoutTemplate = (
  plotW: number,
  plotH: number,
  bedrooms: number,
  bathrooms: number,
  seed: number,
) => RoomData[];

function templateModernVilla(
  plotW: number,
  plotH: number,
  bedrooms: number,
  bathrooms: number,
  seed: number,
): RoomData[] {
  const rng = seededRandom(seed);
  const rooms: RoomData[] = [];

  // Building occupies ~65% of plot, centered
  const bW = round(plotW * 0.65);
  const bH = round(plotH * 0.65);
  const bX = round((plotW - bW) / 2);
  const bY = round((plotH - bH) / 2);

  // Top zone: Living + Kitchen + Dining (open plan)
  const topH = round(bH * 0.4);
  const livingW = round(bW * 0.5);
  const kitchenW = bW - livingW;

  rooms.push(makeRoom("Living Room", "living", bX, bY, livingW, topH));
  rooms.push(makeRoom("Kitchen", "kitchen", bX + livingW, bY, kitchenW, topH * 0.55));
  rooms.push(makeRoom("Dining", "dining", bX + livingW, bY + topH * 0.55, kitchenW, topH * 0.45));

  // Hallway strip
  const hallH = 5;
  rooms.push(makeRoom("Hallway", "hallway", bX, bY + topH, bW, hallH));

  // Bottom zone: bedrooms + bathrooms
  const botY = bY + topH + hallH;
  const botH = bH - topH - hallH;

  const roomCount = bedrooms + bathrooms;
  const colCount = Math.min(3, roomCount);
  const colW = Math.floor(bW / colCount);

  let cx = bX;
  let cy = botY;
  let colIdx = 0;

  // Bedrooms
  for (let i = 0; i < bedrooms; i++) {
    const rW = colW - 1;
    const rH = Math.floor(botH / Math.ceil(roomCount / colCount)) - 1;
    const name = i === 0 ? "Master Bedroom" : `Bedroom ${i + 1}`;
    rooms.push(makeRoom(name, "bedroom", cx, cy, rW, rH));
    cy += rH + 1;
    if (cy >= botY + botH || (cy >= botY + botH / 2 && colIdx < colCount - 1)) {
      colIdx++;
      cx += colW;
      cy = botY;
    }
  }

  // Bathrooms
  for (let i = 0; i < bathrooms; i++) {
    const rW = colW - 1;
    const rH = 6;
    const name = i === 0 ? "Bathroom" : `Bathroom ${i + 1}`;
    rooms.push(makeRoom(name, "bathroom", cx, cy, rW, rH));
    cy += rH + 1;
    if (cy >= botY + botH) {
      colIdx++;
      cx += colW;
      cy = botY;
    }
  }

  // Fill remaining space with hallway/storage
  if (cx < bX + bW && cy < botY + botH) {
    rooms.push(makeRoom("Storage", "storage", cx, cy, bX + bW - cx, botY + botH - cy));
  }

  return rooms;
}

function templateCorridor(
  plotW: number,
  plotH: number,
  bedrooms: number,
  bathrooms: number,
  seed: number,
): RoomData[] {
  const rooms: RoomData[] = [];
  const bW = round(plotW * 0.65);
  const bH = round(plotH * 0.65);
  const bX = round((plotW - bW) / 2);
  const bY = round((plotH - bH) / 2);

  const corridorW = 5;
  const corridorX = bX + Math.floor(bW * 0.45);
  const leftW = corridorX - bX;
  const rightX = corridorX + corridorW;
  const rightW = bX + bW - rightX;

  // Central corridor
  rooms.push(makeRoom("Corridor", "hallway", corridorX, bY, corridorW, bH));

  // Left side: Living + Kitchen
  const topH = Math.floor(bH * 0.45);
  rooms.push(makeRoom("Living Room", "living", bX, bY, leftW, topH));
  rooms.push(makeRoom("Kitchen", "kitchen", bX, bY + topH, leftW, bH - topH));

  // Right side: bedrooms + bathrooms stacked
  const rightRooms = bedrooms + bathrooms;
  const roomH = Math.floor(bH / rightRooms);
  let ry = bY;

  for (let i = 0; i < bedrooms; i++) {
    const name = i === 0 ? "Master Bedroom" : `Bedroom ${i + 1}`;
    rooms.push(makeRoom(name, "bedroom", rightX, ry, rightW, roomH));
    ry += roomH;
  }
  for (let i = 0; i < bathrooms; i++) {
    const name = i === 0 ? "Bathroom" : `Bathroom ${i + 1}`;
    rooms.push(makeRoom(name, "bathroom", rightX, ry, rightW, roomH));
    ry += roomH;
  }

  return rooms;
}

function templateOpenPlan(
  plotW: number,
  plotH: number,
  bedrooms: number,
  bathrooms: number,
  seed: number,
): RoomData[] {
  const rooms: RoomData[] = [];
  const bW = round(plotW * 0.7);
  const bH = round(plotH * 0.65);
  const bX = round((plotW - bW) / 2);
  const bY = round((plotH - bH) / 2);

  // Top: open living/kitchen/dining (full width)
  const topH = round(bH * 0.35);
  const thirdW = Math.floor(bW / 3);

  rooms.push(makeRoom("Living Room", "living", bX, bY, thirdW, topH));
  rooms.push(makeRoom("Kitchen", "kitchen", bX + thirdW, bY, thirdW, topH));
  rooms.push(makeRoom("Dining", "dining", bX + thirdW * 2, bY, bW - thirdW * 2, topH));

  // Middle: hallway
  const hallH = 4;
  rooms.push(makeRoom("Hallway", "hallway", bX, bY + topH, bW, hallH));

  // Bottom: bedrooms in grid
  const botY = bY + topH + hallH;
  const botH = bH - topH - hallH;
  const allRooms = bedrooms + bathrooms;
  const cols = Math.ceil(Math.sqrt(allRooms));
  const rows = Math.ceil(allRooms / cols);
  const cellW = Math.floor(bW / cols);
  const cellH = Math.floor(botH / rows);

  let idx = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (idx >= allRooms) break;
      const isBedroom = idx < bedrooms;
      const name = isBedroom
        ? idx === 0 ? "Master Bedroom" : `Bedroom ${idx + 1}`
        : `Bathroom ${idx - bedrooms + 1}`;
      const type = isBedroom ? "bedroom" : "bathroom";
      rooms.push(makeRoom(name, type, bX + c * cellW, botY + r * cellH, cellW - 1, cellH - 1));
      idx++;
    }
  }

  return rooms;
}

function templateHLayout(
  plotW: number,
  plotH: number,
  bedrooms: number,
  bathrooms: number,
  seed: number,
): RoomData[] {
  const rooms: RoomData[] = [];
  const bW = round(plotW * 0.75);
  const bH = round(plotH * 0.6);
  const bX = round((plotW - bW) / 2);
  const bY = round((plotH - bH) / 2);

  const wingW = Math.floor(bW * 0.35);
  const bridgeW = bW - wingW * 2;
  const bridgeX = bX + wingW;
  const bridgeH = round(bH * 0.3);
  const bridgeY = bY + Math.floor((bH - bridgeH) / 2);

  // Bridge: Living Room
  rooms.push(makeRoom("Living Room", "living", bridgeX, bridgeY, bridgeW, bridgeH));

  // Above bridge: Kitchen
  if (bridgeY > bY + 4) {
    rooms.push(makeRoom("Kitchen", "kitchen", bridgeX, bY, bridgeW, bridgeY - bY));
  }

  // Below bridge: Dining
  if (bridgeY + bridgeH < bY + bH - 4) {
    rooms.push(makeRoom("Dining", "dining", bridgeX, bridgeY + bridgeH, bridgeW, bY + bH - bridgeY - bridgeH));
  }

  // Left wing: bedrooms
  const leftCount = Math.ceil(bedrooms / 2);
  const leftH = Math.floor(bH / leftCount);
  for (let i = 0; i < leftCount; i++) {
    const name = i === 0 ? "Master Bedroom" : `Bedroom ${i + 1}`;
    rooms.push(makeRoom(name, "bedroom", bX, bY + i * leftH, wingW, leftH - 1));
  }

  // Right wing: remaining bedrooms + bathrooms
  const rightNames: string[] = [];
  for (let i = leftCount; i < bedrooms; i++) rightNames.push(`Bedroom ${i + 1}`);
  for (let i = 0; i < bathrooms; i++) rightNames.push(i === 0 ? "Bathroom" : `Bathroom ${i + 1}`);
  if (rightNames.length === 0) rightNames.push("Office");

  const rightH = Math.floor(bH / rightNames.length);
  rightNames.forEach((name, i) => {
    const type = name.toLowerCase().includes("bath") ? "bathroom" : name.toLowerCase().includes("office") ? "office" : "bedroom";
    rooms.push(makeRoom(name, type, bX + wingW + bridgeW, bY + i * rightH, wingW, rightH - 1));
  });

  return rooms;
}

function templateCourtyard(
  plotW: number,
  plotH: number,
  bedrooms: number,
  bathrooms: number,
  seed: number,
): RoomData[] {
  const rooms: RoomData[] = [];
  const bW = round(plotW * 0.8);
  const bH = round(plotH * 0.8);
  const bX = round((plotW - bW) / 2);
  const bY = round((plotH - bH) / 2);

  const borderW = Math.floor(bW * 0.25);
  const borderH = Math.floor(bH * 0.25);

  // Top strip
  const topRooms = ["Living Room", "Kitchen", "Dining"];
  const topRW = Math.floor(bW / topRooms.length);
  topRooms.forEach((name, i) => {
    const type = name.toLowerCase().includes("living") ? "living" : name.toLowerCase().includes("kitchen") ? "kitchen" : "dining";
    rooms.push(makeRoom(name, type, bX + i * topRW, bY, topRW, borderH));
  });

  // Bottom strip: bedrooms
  const botRooms = [];
  for (let i = 0; i < bedrooms; i++) botRooms.push(i === 0 ? "Master Bedroom" : `Bedroom ${i + 1}`);
  const botRW = Math.floor(bW / Math.max(1, botRooms.length));
  botRooms.forEach((name, i) => {
    rooms.push(makeRoom(name, "bedroom", bX + i * botRW, bY + bH - borderH, botRW, borderH));
  });

  // Left strip: bathrooms
  const innerH = bH - borderH * 2;
  const bathPerSide = Math.ceil(bathrooms / 2);
  const leftH = Math.floor(innerH / bathPerSide);
  for (let i = 0; i < bathPerSide; i++) {
    const name = i === 0 ? "Bathroom" : `Bathroom ${i + 1}`;
    rooms.push(makeRoom(name, "bathroom", bX, bY + borderH + i * leftH, borderW, leftH));
  }

  // Right strip: remaining bathrooms + storage
  const rightBaths = bathrooms - bathPerSide;
  for (let i = 0; i < rightBaths; i++) {
    const name = `Bathroom ${bathPerSide + i + 1}`;
    rooms.push(makeRoom(name, "bathroom", bX + bW - borderW, bY + borderH + i * leftH, borderW, leftH));
  }

  // Courtyard center (decorative garden)
  rooms.push(makeRoom("Courtyard", "garden", bX + borderW, bY + borderH, bW - borderW * 2, innerH));

  return rooms;
}

function templateSplitLevel(
  plotW: number,
  plotH: number,
  bedrooms: number,
  bathrooms: number,
  seed: number,
): RoomData[] {
  const rooms: RoomData[] = [];
  const bW = round(plotW * 0.65);
  const bH = round(plotH * 0.65);
  const bX = round((plotW - bW) / 2);
  const bY = round((plotH - bH) / 2);

  const splitY = round(bH * 0.5);
  const splitW = round(bW * 0.5);

  // Top-left: Living, Top-right: Kitchen
  rooms.push(makeRoom("Living Room", "living", bX, bY, splitW, splitY));
  rooms.push(makeRoom("Kitchen", "kitchen", bX + splitW, bY, bW - splitW, splitY));

  // Bottom-left: Dining, Bottom-right: Staircase + bedrooms
  rooms.push(makeRoom("Dining", "dining", bX, bY + splitY, splitW, bH - splitY));

  const stairW = 6;
  rooms.push(makeRoom("Staircase", "staircase", bX + bW - stairW, bY + splitY, stairW, bH - splitY));

  // Remaining bottom-right: bedrooms
  const remainW = bW - splitW - stairW;
  const remainH = bH - splitY;
  const bedCount = Math.min(bedrooms, 2);
  const bedH = Math.floor(remainH / (bedCount + bathrooms));
  let ry = bY + splitY;

  for (let i = 0; i < bedCount; i++) {
    const name = i === 0 ? "Master Bedroom" : `Bedroom ${i + 1}`;
    rooms.push(makeRoom(name, "bedroom", bX + splitW, ry, remainW, bedH));
    ry += bedH;
  }
  for (let i = 0; i < bathrooms; i++) {
    const name = i === 0 ? "Bathroom" : `Bathroom ${i + 1}`;
    rooms.push(makeRoom(name, "bathroom", bX + splitW, ry, remainW, bedH));
    ry += bedH;
  }

  return rooms;
}

// ── Variant Map ─────────────────────────────────────────────────────

const VARIANT_MAP: Record<string, LayoutTemplate[]> = {
  A: [templateModernVilla, templateHLayout],
  B: [templateCorridor, templateCourtyard],
  C: [templateOpenPlan, templateHLayout],
  D: [templateSplitLevel, templateModernVilla],
  E: [templateCourtyard, templateOpenPlan],
};

const ALL_TEMPLATES: LayoutTemplate[] = [
  templateModernVilla,
  templateCorridor,
  templateOpenPlan,
  templateHLayout,
  templateCourtyard,
  templateSplitLevel,
];

// ── Helpers ─────────────────────────────────────────────────────────

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function round(n: number): number {
  return Math.round(n);
}

function makeRoom(
  name: string,
  roomType: string,
  x: number,
  y: number,
  width: number,
  height: number,
  level: number = 0,
): RoomData {
  return {
    id: uid("r"),
    name,
    room_type: roomType,
    x: Math.max(0, round(x)),
    y: Math.max(0, round(y)),
    width: Math.max(1, round(width)),
    height: Math.max(1, round(height)),
    level,
    color_hex: ROOM_COLORS[roomType] || ROOM_COLORS.generic,
  };
}

// ── Wall Builder ────────────────────────────────────────────────────

function buildWalls(rooms: RoomData[], plotW: number, plotH: number): WallData[] {
  const wallMap = new Map<string, WallData>();

  function addWall(x1: number, y1: number, x2: number, y2: number, type: "exterior" | "interior") {
    x1 = round(x1); y1 = round(y1); x2 = round(x2); y2 = round(y2);
    const key = x1 === x2
      ? `v${x1},${Math.min(y1, y2)}-${Math.max(y1, y2)}`
      : `h${y1},${Math.min(x1, x2)}-${Math.max(x1, x2)}`;
    if (!wallMap.has(key)) {
      wallMap.set(key, {
        id: uid("w"),
        x1, y1, x2, y2,
        thickness: type === "exterior" ? 0.75 : 0.5,
        wall_type: type,
      });
    }
  }

  // Plot boundary (exterior)
  addWall(0, 0, plotW, 0, "exterior");
  addWall(plotW, 0, plotW, plotH, "exterior");
  addWall(plotW, plotH, 0, plotH, "exterior");
  addWall(0, plotH, 0, 0, "exterior");

  // Room edges (interior)
  for (const room of rooms) {
    addWall(room.x, room.y, room.x + room.width, room.y, "interior");
    addWall(room.x + room.width, room.y, room.x + room.width, room.y + room.height, "interior");
    addWall(room.x + room.width, room.y + room.height, room.x, room.y + room.height, "interior");
    addWall(room.x, room.y + room.height, room.x, room.y, "interior");
  }

  return Array.from(wallMap.values());
}

// ── Door Placer ─────────────────────────────────────────────────────

function placeDoors(rooms: RoomData[]): DoorData[] {
  const doors: DoorData[] = [];
  const placed = new Set<string>();

  for (let i = 0; i < rooms.length; i++) {
    for (let j = i + 1; j < rooms.length; j++) {
      const a = rooms[i];
      const b = rooms[j];
      const pair = `${a.id}-${b.id}`;
      if (placed.has(pair)) continue;

      // Check shared horizontal wall
      if (Math.abs(a.y + a.height - b.y) < 1 || Math.abs(b.y + b.height - a.y) < 1) {
        const overlapStart = Math.max(a.x, b.x);
        const overlapEnd = Math.min(a.x + a.width, b.x + b.width);
        if (overlapEnd - overlapStart >= 4) {
          const doorX = round(overlapStart + (overlapEnd - overlapStart) / 2);
          const doorY = Math.abs(a.y + a.height - b.y) < 1 ? a.y + a.height : b.y + b.height;
          doors.push({
            id: uid("d"),
            x: doorX,
            y: doorY,
            width: 3,
            orientation: "horizontal",
            is_main_entrance: false,
          });
          placed.add(pair);
          continue;
        }
      }

      // Check shared vertical wall
      if (Math.abs(a.x + a.width - b.x) < 1 || Math.abs(b.x + b.width - a.x) < 1) {
        const overlapStart = Math.max(a.y, b.y);
        const overlapEnd = Math.min(a.y + a.height, b.y + b.height);
        if (overlapEnd - overlapStart >= 4) {
          const doorX = Math.abs(a.x + a.width - b.x) < 1 ? a.x + a.width : b.x + b.width;
          const doorY = round(overlapStart + (overlapEnd - overlapStart) / 2);
          doors.push({
            id: uid("d"),
            x: doorX,
            y: doorY,
            width: 3,
            orientation: "vertical",
            is_main_entrance: false,
          });
          placed.add(pair);
        }
      }
    }
  }

  return doors;
}

// ── Window Placer ───────────────────────────────────────────────────

function placeWindows(rooms: RoomData[], plotW: number, plotH: number): WindowData[] {
  const windows: WindowData[] = [];

  for (const room of rooms) {
    if (["hallway", "staircase", "storage", "garden"].includes(room.room_type)) continue;

    // Top edge (y = 0)
    if (room.y === 0 && room.width >= 6) {
      windows.push({
        id: uid("win"),
        x: round(room.x + room.width / 2),
        y: 0,
        width: Math.min(4, room.width * 0.4),
        orientation: "horizontal",
      });
    }
    // Bottom edge
    if (Math.abs(room.y + room.height - plotH) < 1 && room.width >= 6) {
      windows.push({
        id: uid("win"),
        x: round(room.x + room.width / 2),
        y: plotH,
        width: Math.min(4, room.width * 0.4),
        orientation: "horizontal",
      });
    }
    // Left edge
    if (room.x === 0 && room.height >= 6) {
      windows.push({
        id: uid("win"),
        x: 0,
        y: round(room.y + room.height / 2),
        width: Math.min(4, room.height * 0.4),
        orientation: "vertical",
      });
    }
    // Right edge
    if (Math.abs(room.x + room.width - plotW) < 1 && room.height >= 6) {
      windows.push({
        id: uid("win"),
        x: plotW,
        y: round(room.y + room.height / 2),
        width: Math.min(4, room.height * 0.4),
        orientation: "vertical",
      });
    }
  }

  return windows;
}

// ── Main Generator ──────────────────────────────────────────────────

export interface GenerateLayoutInput {
  plot_width: number;
  plot_height: number;
  bedrooms: number;
  bathrooms: number;
  floors: number;
  building_type: BuildingType;
  style: ArchitecturalStyle;
  variant?: string;
  seed?: number;
  project_name?: string;
}

export function generateLayout(input: GenerateLayoutInput): BlueprintSchema {
  resetIds();

  const {
    plot_width,
    plot_height,
    bedrooms,
    bathrooms,
    floors,
    building_type,
    style,
    variant = "A",
    seed,
    project_name = "AI Generated Blueprint",
  } = input;

  const actualSeed = seed ?? Math.floor(Math.random() * 2147483647);

  // Select template based on variant
  const templates = VARIANT_MAP[variant] || ALL_TEMPLATES;
  const rng = seededRandom(actualSeed);
  const template = templates[Math.floor(rng() * templates.length)];

  // Generate rooms
  let rooms = template(plot_width, plot_height, Math.max(1, bedrooms), Math.max(1, bathrooms), actualSeed);

  // Ensure minimum sizes
  rooms = rooms.map((room) => {
    const min = MIN_ROOM_SIZES[room.room_type];
    if (min) {
      return {
        ...room,
        width: Math.max(min.w, room.width),
        height: Math.max(min.h, room.height),
      };
    }
    return room;
  });

  // Clamp to plot bounds
  rooms = rooms.map((room) => ({
    ...room,
    x: Math.max(0, Math.min(plot_width - room.width, room.x)),
    y: Math.max(0, Math.min(plot_height - room.height, room.y)),
    width: Math.min(room.width, plot_width - room.x),
    height: Math.min(room.height, plot_height - room.y),
  }));

  const walls = buildWalls(rooms, plot_width, plot_height);
  const doors = placeDoors(rooms);
  const windows = placeWindows(rooms, plot_width, plot_height);

  const stairs: StairData[] = [];
  if (floors > 1) {
    const hall = rooms.find(r => r.room_type === "hallway" || r.room_type === "staircase");
    if (hall) {
      stairs.push({
        id: uid("s"),
        x: hall.x + Math.floor(hall.width * 0.2),
        y: hall.y + Math.floor(hall.height * 0.2),
        width: Math.min(6, hall.width * 0.6),
        height: Math.min(10, hall.height * 0.6),
        direction: "up",
      });
    }
  }

  return {
    project: {
      name: project_name,
      description: "",
      building_type,
      style,
      date: new Date().toISOString().split("T")[0],
      version: "1.0",
    },
    plot: { width: plot_width, height: plot_height, unit: "ft" },
    floors: Array.from({ length: floors }, (_, i) => ({
      level: i,
      name: `Floor ${i + 1}`,
      height_ft: 10,
    })),
    rooms,
    walls,
    doors,
    windows,
    stairs,
    metadata: {
      generated_by: "AI Architect Layout Engine",
      generation_timestamp: new Date().toISOString(),
      engine_version: "3.0",
      variant,
      validation_status: "pending",
      validation_errors: [],
    },
  };
}
