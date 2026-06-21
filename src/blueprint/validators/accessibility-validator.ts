import { Blueprint, Room, Door } from "../types/blueprint";
import { areAdjacent } from "../engine/geometry/distance";

export interface AccessibilityError {
  room: string;
  detail: string;
}

// Helper to check if a door connects to a room
export function doesDoorConnectToRoom(door: Door, room: Room, tolerance: number = 1.0): boolean {
  const left = room.x;
  const right = room.x + room.width;
  const top = room.y;
  const bottom = room.y + room.height;

  // Door is on vertical wall (left or right)
  const onLeftWall = Math.abs(door.x - left) < tolerance;
  const onRightWall = Math.abs(door.x - right) < tolerance;
  const withinY = door.y >= top - tolerance && door.y <= bottom + tolerance;

  if ((onLeftWall || onRightWall) && withinY) return true;

  // Door is on horizontal wall (top or bottom)
  const onTopWall = Math.abs(door.y - top) < tolerance;
  const onBottomWall = Math.abs(door.y - bottom) < tolerance;
  const withinX = door.x >= left - tolerance && door.x <= right + tolerance;

  if ((onTopWall || onBottomWall) && withinX) return true;

  return false;
}

export function checkAccessibility(blueprint: Blueprint): AccessibilityError[] {
  const errors: AccessibilityError[] = [];
  const rooms = blueprint.rooms;
  const doors = blueprint.doors;

  if (rooms.length === 0) return [];

  // Build adjacency list
  const adjList = new Map<string, string[]>();
  for (const r of rooms) {
    adjList.set(r.id, []);
  }

  const hasDoors = doors && doors.length > 0;

  if (hasDoors) {
    // Check door-based connectivity
    for (const door of doors) {
      const connected: string[] = [];
      for (const room of rooms) {
        if (doesDoorConnectToRoom(door, room)) {
          connected.push(room.id);
        }
      }
      if (connected.length >= 2) {
        const [r1, r2] = connected;
        adjList.get(r1)?.push(r2);
        adjList.get(r2)?.push(r1);
      }
    }
  } else {
    // Check geometric adjacency-based connectivity (before doors are generated)
    for (let i = 0; i < rooms.length; i++) {
      for (let j = i + 1; j < rooms.length; j++) {
        const r1 = rooms[i];
        const r2 = rooms[j];
        if (areAdjacent(r1, r2, 1.2)) {
          adjList.get(r1.id)?.push(r2.id);
          adjList.get(r2.id)?.push(r1.id);
        }
      }
    }
  }

  // Find start room (prefer livingRoom or hallway, or just the first room)
  const startRoom = rooms.find((r) => r.type === "livingRoom" || r.type === "living" || r.type === "hallway") || rooms[0];

  // BFS
  const visited = new Set<string>();
  const queue: string[] = [startRoom.id];
  visited.add(startRoom.id);

  while (queue.length > 0) {
    const curr = queue.shift()!;
    const neighbors = adjList.get(curr) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }

  // Find unvisited rooms
  for (const room of rooms) {
    if (room.type === "garden" || room.type === "pool" || room.type === "terrace" || room.type === "balcony") {
      continue;
    }
    if (!visited.has(room.id)) {
      errors.push({
        room: room.name,
        detail: `Room "${room.name}" is isolated and unreachable. Ensure it touches a hallway or other room.`,
      });
    }
  }

  return errors;
}
