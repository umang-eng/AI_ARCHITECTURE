import { Blueprint } from "../types/blueprint";
import { checkOverlaps } from "../validators/overlap-validator";
import { checkBoundaries } from "../validators/boundary-validator";
import { checkSizes } from "../validators/size-validator";

export interface FilterResult {
  valid: boolean;
  errors: string[];
}

export function filterBlueprint(blueprint: Blueprint): FilterResult {
  const errors: string[] = [];

  const overlaps = checkOverlaps(blueprint);
  for (const o of overlaps) {
    errors.push(`Overlap: ${o.roomA} overlaps ${o.roomB}`);
  }

  const boundaries = checkBoundaries(blueprint);
  for (const b of boundaries) {
    errors.push(`Boundary: ${b.room} - ${b.detail}`);
  }

  const sizes = checkSizes(blueprint);
  for (const s of sizes) {
    errors.push(`Size: ${s.room} - ${s.detail}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function filterBatch(blueprints: Blueprint[]): Blueprint[] {
  return blueprints.filter((bp) => {
    const result = filterBlueprint(bp);
    return result.valid;
  });
}
