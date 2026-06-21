import { FurnitureItem } from "../types";

export function getFurnitureBounds(item: FurnitureItem) {
  const isRotated = item.rotation === 90 || item.rotation === 270;
  const w = isRotated ? item.height : item.width;
  const h = isRotated ? item.width : item.height;
  return {
    x1: item.x - w / 2,
    y1: item.y - h / 2,
    x2: item.x + w / 2,
    y2: item.y + h / 2,
    width: w,
    height: h,
  };
}

export function checkOverlap(a: FurnitureItem, b: FurnitureItem): boolean {
  const boxA = getFurnitureBounds(a);
  const boxB = getFurnitureBounds(b);

  return (
    boxA.x1 < boxB.x2 &&
    boxA.x2 > boxB.x1 &&
    boxA.y1 < boxB.y2 &&
    boxA.y2 > boxB.y1
  );
}

export function validateOverlaps(furniture: FurnitureItem[]): string[] {
  const errors: string[] = [];
  for (let i = 0; i < furniture.length; i++) {
    for (let j = i + 1; j < furniture.length; j++) {
      if (checkOverlap(furniture[i], furniture[j])) {
        errors.push(
          `Overlap: "${furniture[i].type}" (ID: ${furniture[i].id}) overlaps with "${furniture[j].type}" (ID: ${furniture[j].id}).`
        );
      }
    }
  }
  return errors;
}
