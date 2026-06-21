import { Blueprint, Door } from "../types/blueprint";
import { doesDoorConnectToRoom } from "./accessibility-validator";

export interface DoorError {
  doorId: string;
  detail: string;
}

export function checkDoors(blueprint: Blueprint): DoorError[] {
  const errors: DoorError[] = [];
  const doors = blueprint.doors;
  const windows = blueprint.windows;
  const rooms = blueprint.rooms;

  // 1. Check if doors touch any room
  for (const door of doors) {
    let touchesRoom = false;
    for (const room of rooms) {
      if (doesDoorConnectToRoom(door, room, 1.5)) {
        touchesRoom = true;
        break;
      }
    }
    if (!touchesRoom) {
      errors.push({
        doorId: door.id,
        detail: `Door "${door.id}" at (${door.x.toFixed(1)}, ${door.y.toFixed(1)}) does not sit on any room wall.`,
      });
    }
  }

  // 2. Check door-to-door collision
  for (let i = 0; i < doors.length; i++) {
    for (let j = i + 1; j < doors.length; j++) {
      const d1 = doors[i];
      const d2 = doors[j];
      const dist = Math.sqrt((d1.x - d2.x) ** 2 + (d1.y - d2.y) ** 2);
      if (dist < 2.0) {
        errors.push({
          doorId: d1.id,
          detail: `Door "${d1.id}" overlaps or is too close to Door "${d2.id}" (distance ${dist.toFixed(1)} ft).`,
        });
      }
    }
  }

  // 3. Check door-to-window collision
  for (const door of doors) {
    for (const win of windows) {
      const dist = Math.sqrt((door.x - win.x) ** 2 + (door.y - win.y) ** 2);
      if (dist < 3.0) {
        errors.push({
          doorId: door.id,
          detail: `Door "${door.id}" is too close to Window "${win.id}" (distance ${dist.toFixed(1)} ft).`,
        });
      }
    }
  }

  return errors;
}
