import { Blueprint } from "../types/blueprint";
import { checkBoundaries } from "./boundary-validator";
import { checkOverlaps } from "./overlap-validator";
import { checkSizes } from "./size-validator";
import { checkAccessibility } from "./accessibility-validator";
import { checkAdjacencies } from "./adjacency-validator";
import { checkDoors } from "./door-validator";
import { checkWindows } from "./window-validator";
import { checkStairs } from "./stair-validator";
import { scoreLayout } from "../engine/scoring/layout-score";

export interface ValidationReport {
  valid: boolean;
  score: number;
  warnings: string[];
  errors: string[];
}

export function validateBlueprint(blueprint: Blueprint, floors: number = 1): ValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Check Boundaries
  const boundErrors = checkBoundaries(blueprint);
  for (const err of boundErrors) {
    errors.push(`Boundary Error [${err.room}]: ${err.detail}`);
  }

  // 2. Check Overlaps
  const overlapErrors = checkOverlaps(blueprint);
  for (const err of overlapErrors) {
    errors.push(`Overlap Error: Room "${err.roomA}" and Room "${err.roomB}" overlap.`);
  }

  // 3. Check Sizes
  const sizeErrors = checkSizes(blueprint);
  for (const err of sizeErrors) {
    errors.push(`Size Error [${err.room}]: ${err.detail}`);
  }

  // 4. Check Accessibility
  const accessErrors = checkAccessibility(blueprint);
  for (const err of accessErrors) {
    errors.push(`Accessibility Error: ${err.detail}`);
  }

  // 5. Check Adjacencies
  const adjacencyErrors = checkAdjacencies(blueprint);
  for (const err of adjacencyErrors) {
    if (err.code.includes("ADJACENT")) {
      warnings.push(`Adjacency Warning: ${err.detail}`);
    } else {
      warnings.push(`Adjacency Warning: ${err.detail}`);
    }
  }

  // 6. Check Doors
  const doorErrors = checkDoors(blueprint);
  for (const err of doorErrors) {
    errors.push(`Door Error: ${err.detail}`);
  }

  // 7. Check Windows
  const windowErrors = checkWindows(blueprint);
  for (const err of windowErrors) {
    errors.push(`Window Error: ${err.detail}`);
  }

  // 8. Check Stairs
  const stairErrors = checkStairs(blueprint, floors);
  for (const err of stairErrors) {
    errors.push(`Staircase Error: ${err.detail}`);
  }

  // 9. Calculate Scoring
  // Fallback scoring if scoring is evaluated separately, but let's run scoreLayout
  const scoreResult = scoreLayout(blueprint.rooms);
  // Base scoring deduction for each error
  let finalScore = Math.max(0, scoreResult.score);
  finalScore = Math.max(0, finalScore - errors.length * 15 - warnings.length * 5);

  // Normalize final score to a reasonable 0-100 scale
  finalScore = Math.min(100, Math.max(0, finalScore));

  return {
    valid: errors.length === 0,
    score: Math.round(finalScore),
    warnings,
    errors,
  };
}
