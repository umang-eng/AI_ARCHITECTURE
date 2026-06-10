import { Rectangle } from "./rectangle";

export function centerDistance(a: Rectangle, b: Rectangle): number {
  const ax = a.x + a.width / 2;
  const ay = a.y + a.height / 2;
  const bx = b.x + b.width / 2;
  const by = b.y + b.height / 2;
  return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2);
}

export function edgeDistance(a: Rectangle, b: Rectangle): number {
  const dx = Math.max(0, Math.max(b.x - (a.x + a.width), a.x - (b.x + b.width)));
  const dy = Math.max(0, Math.max(b.y - (a.y + a.height), a.y - (b.y + b.height)));
  return Math.sqrt(dx * dx + dy * dy);
}

export function areAdjacent(a: Rectangle, b: Rectangle, tolerance: number = 1): boolean {
  const touchesX =
    Math.abs(a.x + a.width - b.x) < tolerance ||
    Math.abs(b.x + b.width - a.x) < tolerance;
  const overlapsY = a.y < b.y + b.height && a.y + a.height > b.y;

  const touchesY =
    Math.abs(a.y + a.height - b.y) < tolerance ||
    Math.abs(b.y + b.height - a.y) < tolerance;
  const overlapsX = a.x < b.x + b.width && a.x + a.width > b.x;

  return (touchesX && overlapsY) || (touchesY && overlapsX);
}
