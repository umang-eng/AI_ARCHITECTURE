import { FurnitureItem } from "../types";
import { Blueprint } from "../../blueprint/types/blueprint";
import { calculateComfortScore } from "./comfort-score";
import { calculateCirculationScore } from "./circulation-score";
import { calculateSpaceUtilizationScore } from "./space-utilization-score";
import { calculateSymmetryScore } from "./symmetry-score";

export interface FurnitureScoreResult {
  score: number;
  reasons: string[];
  breakdown: {
    comfort: number;
    circulation: number;
    utilization: number;
    symmetry: number;
  };
}

export function scoreFurnitureLayout(
  furniture: FurnitureItem[],
  blueprint: Blueprint,
): FurnitureScoreResult {
  const comfort = calculateComfortScore(furniture, blueprint);
  const circulation = calculateCirculationScore(furniture, blueprint);
  const utilization = calculateSpaceUtilizationScore(furniture, blueprint);
  const symmetry = calculateSymmetryScore(furniture);

  // Weights
  const wComfort = 0.30;
  const wCirculation = 0.30;
  const wUtilization = 0.20;
  const wSymmetry = 0.20;

  const score =
    comfort * wComfort +
    circulation * wCirculation +
    utilization * wUtilization +
    symmetry * wSymmetry;

  const reasons: string[] = [];
  if (comfort > 80) reasons.push("Ergonomic clearances and lighting placement");
  if (circulation > 80) reasons.push("Wide, unobstructed walking pathways");
  if (utilization > 80) reasons.push("Balanced furniture-to-space ratios");
  if (symmetry > 80) reasons.push("Symmetrical and visually balanced setup");

  return {
    score: Math.round(score),
    reasons,
    breakdown: {
      comfort,
      circulation,
      utilization,
      symmetry,
    },
  };
}
