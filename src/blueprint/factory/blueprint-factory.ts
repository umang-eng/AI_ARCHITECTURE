import { Blueprint, Door, Window } from "../types/blueprint";
import { PlacedRoom } from "../engine/layout-engine/placement-algorithm";

export function createBlueprint(
  plotWidth: number,
  plotHeight: number,
  rooms: PlacedRoom[],
): Blueprint {
  const doors = generateDoors(rooms);
  const windows = generateWindows(rooms, plotWidth, plotHeight);

  return {
    plot: { width: plotWidth, height: plotHeight },
    rooms: rooms.map((r) => ({
      id: r.id,
      name: r.name,
      type: r.type,
      x: r.x,
      y: r.y,
      width: r.width,
      height: r.height,
    })),
    doors,
    windows,
  };
}

function generateDoors(rooms: PlacedRoom[]): Door[] {
  const doors: Door[] = [];
  let id = 1;

  for (const room of rooms) {
    if (room.type === "garden" || room.type === "hallway") continue;

    const doorX = room.x + room.width / 2;
    const doorY = room.y + room.height;

    doors.push({
      id: `d${id++}`,
      x: doorX,
      y: doorY,
      width: 3,
    });

    if (room.type === "bedroom" || room.type === "kitchen") {
      const sideDoorX = room.x + room.width;
      const sideDoorY = room.y + room.height / 2;
      doors.push({
        id: `d${id++}`,
        x: sideDoorX,
        y: sideDoorY,
        width: 3,
      });
    }
  }

  return doors;
}

function generateWindows(
  rooms: PlacedRoom[],
  plotWidth: number,
  plotHeight: number,
): Window[] {
  const windows: Window[] = [];
  let id = 1;

  for (const room of rooms) {
    if (room.type === "hallway" || room.type === "staircase") continue;

    // Top edge
    if (room.y <= 0 && room.width >= 6) {
      windows.push({
        id: `w${id++}`,
        x: room.x + room.width / 2,
        y: room.y,
        width: Math.min(5, room.width * 0.4),
      });
    }

    // Bottom edge
    if (room.y + room.height >= plotHeight - 1 && room.width >= 6) {
      windows.push({
        id: `w${id++}`,
        x: room.x + room.width / 2,
        y: room.y + room.height,
        width: Math.min(5, room.width * 0.4),
      });
    }

    // Left edge
    if (room.x <= 0 && room.height >= 6) {
      windows.push({
        id: `w${id++}`,
        x: room.x,
        y: room.y + room.height / 2,
        width: Math.min(5, room.height * 0.4),
      });
    }

    // Right edge
    if (room.x + room.width >= plotWidth - 1 && room.height >= 6) {
      windows.push({
        id: `w${id++}`,
        x: room.x + room.width,
        y: room.y + room.height / 2,
        width: Math.min(5, room.height * 0.4),
      });
    }
  }

  return windows;
}
