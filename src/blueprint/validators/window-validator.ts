import { Blueprint, Window, Room } from "../types/blueprint";

export interface WindowError {
  windowId: string;
  detail: string;
}

export function checkWindows(blueprint: Blueprint): WindowError[] {
  const errors: WindowError[] = [];
  const windows = blueprint.windows;
  const rooms = blueprint.rooms;

  const pw = blueprint.plot.width;
  const ph = blueprint.plot.height;

  for (const win of windows) {
    let touchesExterior = false;
    let touchesRoom = false;

    for (const room of rooms) {
      const left = room.x;
      const right = room.x + room.width;
      const top = room.y;
      const bottom = room.y + room.height;

      // Check if window touches this room's walls
      const onLeft = Math.abs(win.x - left) < 1.0;
      const onRight = Math.abs(win.x - right) < 1.0;
      const onTop = Math.abs(win.y - top) < 1.0;
      const onBottom = Math.abs(win.y - bottom) < 1.0;

      const withinX = win.x >= left - 0.5 && win.x <= right + 0.5;
      const withinY = win.y >= top - 0.5 && win.y <= bottom + 0.5;

      if ((onLeft || onRight) && withinY) {
        touchesRoom = true;
        // Check if this wall segment is on the plot exterior
        if (Math.abs(left - 0) < 1.5 || Math.abs(right - pw) < 1.5 || isWallSegmentExterior(win.x, win.y, rooms, "vertical")) {
          touchesExterior = true;
        }
      }
      if ((onTop || onBottom) && withinX) {
        touchesRoom = true;
        if (Math.abs(top - 0) < 1.5 || Math.abs(bottom - ph) < 1.5 || isWallSegmentExterior(win.x, win.y, rooms, "horizontal")) {
          touchesExterior = true;
        }
      }
    }

    if (!touchesRoom) {
      errors.push({
        windowId: win.id,
        detail: `Window "${win.id}" at (${win.x.toFixed(1)}, ${win.y.toFixed(1)}) is floating and does not touch any room wall.`,
      });
    } else if (!touchesExterior) {
      errors.push({
        windowId: win.id,
        detail: `Window "${win.id}" is placed on an interior partition wall instead of an exterior wall.`,
      });
    }
  }

  // Check window-to-window collision
  for (let i = 0; i < windows.length; i++) {
    for (let j = i + 1; j < windows.length; j++) {
      const w1 = windows[i];
      const w2 = windows[j];
      const dist = Math.sqrt((w1.x - w2.x) ** 2 + (w1.y - w2.y) ** 2);
      if (dist < 2.0) {
        errors.push({
          windowId: w1.id,
          detail: `Window "${w1.id}" overlaps or is too close to Window "${w2.id}" (distance ${dist.toFixed(1)} ft).`,
        });
      }
    }
  }

  return errors;
}

// Simple heuristic: if we shoot a ray or check if other rooms cover this coordinates
function isWallSegmentExterior(x: number, y: number, rooms: Room[], orientation: "horizontal" | "vertical"): boolean {
  // If there is no room sharing this side, it's exterior
  let sharingCount = 0;
  for (const r of rooms) {
    const left = r.x;
    const right = r.x + r.width;
    const top = r.y;
    const bottom = r.y + r.height;

    if (orientation === "vertical") {
      // Check if room overlaps this vertical point
      if (Math.abs(left - x) < 0.5 || Math.abs(right - x) < 0.5) {
        if (y >= top && y <= bottom) {
          sharingCount++;
        }
      }
    } else {
      // Check if room overlaps this horizontal point
      if (Math.abs(top - y) < 0.5 || Math.abs(bottom - y) < 0.5) {
        if (x >= left && x <= right) {
          sharingCount++;
        }
      }
    }
  }
  // If only 1 room touches this wall segment at this position, it is an exterior boundary wall!
  return sharingCount <= 1;
}
