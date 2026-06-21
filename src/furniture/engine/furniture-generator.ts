import { FurnitureItem } from "../types";
import { Blueprint, Room } from "../../blueprint/types/blueprint";
import { getLibraryItem } from "../library/furniture-library";
import { checkOverlap } from "../validators/overlap-validator";
import { pointToRectDistance } from "../validators/door-validator";

export function generateRoomFurniture(
  room: Room,
  blueprint: Blueprint,
  rng: () => number,
  sizeMultiplier: number = 1.0,
): FurnitureItem[] {
  const items: FurnitureItem[] = [];
  let idCounter = 1;

  // Determine what furniture models to select based on parent room type
  const roomType = room.type.toLowerCase();
  const typesToPlace: string[] = [];

  if (roomType === "livingroom" || roomType === "living") {
    typesToPlace.push(rng() > 0.5 ? "l_sofa" : "sofa", "tv_unit", "coffee_table", "bookshelf");
  } else if (roomType === "master_bedroom") {
    typesToPlace.push("king_bed", "wardrobe", "study_desk", "side_table", "side_table");
  } else if (roomType === "bedroom") {
    typesToPlace.push("queen_bed", "wardrobe", "study_desk", "side_table");
  } else if (roomType === "kitchen") {
    typesToPlace.push("counter", "refrigerator", "sink", "oven");
  } else if (roomType === "dining") {
    typesToPlace.push("dining_table");
  } else if (roomType === "office" || roomType === "study") {
    typesToPlace.push("office_desk", "office_chair", "office_cabinet");
  } else if (roomType === "bathroom") {
    typesToPlace.push("toilet", "wash_basin", "shower");
  }

  for (const type of typesToPlace) {
    const lib = getLibraryItem(type);
    if (!lib) continue;

    // Apply style size multiplier
    const baseW = lib.width * sizeMultiplier;
    const baseH = lib.height * sizeMultiplier;

    let placed = false;

    // Try up to 30 random placements per item in the room
    for (let attempts = 0; attempts < 30; attempts++) {
      const rot = lib.rotationOptions[Math.floor(rng() * lib.rotationOptions.length)];
      const isRotated = rot === 90 || rot === 270;
      const w = isRotated ? baseH : baseW;
      const h = isRotated ? baseW : baseH;

      // Ensure item fits inside room boundary
      if (w >= room.width || h >= room.height) continue;

      // Select random center coordinate inside the room
      const padding = 0.5; // keep slightly away from corners
      const minX = room.x + w / 2 + padding;
      const maxX = room.x + room.width - w / 2 - padding;
      const minY = room.y + h / 2 + padding;
      const maxY = room.y + room.height - h / 2 - padding;

      if (minX >= maxX || minY >= maxY) continue;

      const px = minX + rng() * (maxX - minX);
      const py = minY + rng() * (maxY - minY);

      const candidate: FurnitureItem = {
        id: `f_${room.id}_${type}_${idCounter++}`,
        type,
        x: px,
        y: py,
        width: baseW,
        height: baseH,
        rotation: rot,
        roomId: room.id,
      };

      // Check collision with existing items in this room
      let collision = false;
      for (const existing of items) {
        if (checkOverlap(candidate, existing)) {
          collision = true;
          break;
        }
      }

      // Check if it blocks a door swing zone
      if (!collision) {
        for (const door of blueprint.doors) {
          const dist = pointToRectDistance(
            door.x,
            door.y,
            candidate.x - w / 2,
            candidate.y - h / 2,
            candidate.x + w / 2,
            candidate.y + h / 2,
          );
          if (dist < 2.5) {
            collision = true;
            break;
          }
        }
      }

      if (!collision) {
        items.push(candidate);
        placed = true;
        break;
      }
    }
  }

  // Draw dining chairs around dining tables if dining table was placed
  const dTable = items.find((f) => f.type === "dining_table");
  if (dTable) {
    const chairLib = getLibraryItem("dining_chair");
    if (chairLib) {
      // Place 4 chairs around the table
      const cw = chairLib.width;
      const ch = chairLib.height;
      const spacing = 1.0;
      
      const chairs = [
        // Left
        { x: dTable.x - dTable.width / 2 - spacing, y: dTable.y, rotation: 90 },
        // Right
        { x: dTable.x + dTable.width / 2 + spacing, y: dTable.y, rotation: 270 },
        // Top
        { x: dTable.x, y: dTable.y - dTable.height / 2 - spacing, rotation: 180 },
        // Bottom
        { x: dTable.x, y: dTable.y + dTable.height / 2 + spacing, rotation: 0 },
      ];

      for (let i = 0; i < chairs.length; i++) {
        items.push({
          id: `f_${room.id}_dining_chair_${idCounter++}`,
          type: "dining_chair",
          x: chairs[i].x,
          y: chairs[i].y,
          width: cw,
          height: ch,
          rotation: chairs[i].rotation,
          roomId: room.id,
        });
      }
    }
  }

  return items;
}
