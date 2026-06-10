import { Rectangle, intersect } from "./rectangle";

export interface Room {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export function isOverlapping(roomA: Room, roomB: Room): boolean {
  const overlapsX = roomA.x < roomB.x + roomB.width && roomA.x + roomA.width > roomB.x;
  const overlapsY = roomA.y < roomB.y + roomB.height && roomA.y + roomA.height > roomB.y;
  return overlapsX && overlapsY;
}

export function hasCollision(a: Rectangle, b: Rectangle): boolean {
  return intersect(a, b);
}

export function findCollisions(
  rooms: Rectangle[],
): [number, number][] {
  const collisions: [number, number][] = [];

  for (let i = 0; i < rooms.length; i++) {
    for (let j = i + 1; j < rooms.length; j++) {
      if (intersect(rooms[i], rooms[j])) {
        collisions.push([i, j]);
      }
    }
  }

  return collisions;
}
