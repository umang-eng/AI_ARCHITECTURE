import { PlacedRoom } from "../layout-engine/placement-algorithm";
import { calculateSpaceUtilization } from "./space-utilization";
import { calculateCirculationScore } from "./circulation-score";
import { calculateAdjacencyScore } from "./adjacency-score";
import { calculateNaturalLightScore } from "./natural-light-score";
import { calculatePrivacyScore } from "./privacy-score";
import { calculateExpandabilityScore } from "./expandability-score";

export interface ScoreResult {
  score: number;
  reasons: string[];
  breakdown: {
    utilization: number;
    circulation: number;
    adjacency: number;
    daylight: number;
    privacy: number;
    expandability: number;
  };
}

export function scoreLayout(
  rooms: PlacedRoom[],
  plotWidth: number = 60,
  plotHeight: number = 80,
): ScoreResult {
  const utilization = calculateSpaceUtilization(rooms, plotWidth, plotHeight);
  const circulation = calculateCirculationScore(rooms);
  const adjacency = calculateAdjacencyScore(rooms);
  const daylight = calculateNaturalLightScore(rooms, plotWidth, plotHeight);
  const privacy = calculatePrivacyScore(rooms);
  const expandability = calculateExpandabilityScore(rooms, plotWidth, plotHeight);

  // Weights
  const wUtilization = 0.20;
  const wCirculation = 0.20;
  const wAdjacency = 0.25;
  const wDaylight = 0.15;
  const wPrivacy = 0.10;
  const wExpandability = 0.10;

  const score =
    utilization * wUtilization +
    circulation * wCirculation +
    adjacency * wAdjacency +
    daylight * wDaylight +
    privacy * wPrivacy +
    expandability * wExpandability;

  const reasons: string[] = [];
  if (utilization > 80) reasons.push("Excellent space utilization");
  else if (utilization < 50) reasons.push("Poor layout/space density");

  if (circulation > 85) reasons.push("Highly walkable corridor circulation");
  if (adjacency > 80) reasons.push("Optimal room adjacencies");
  if (daylight > 80) reasons.push("Abundant natural light exposure");
  if (privacy > 85) reasons.push("Excellent public/private zoning separation");

  return {
    score: Math.round(score),
    reasons,
    breakdown: {
      utilization: Math.round(utilization),
      circulation: Math.round(circulation),
      adjacency: Math.round(adjacency),
      daylight: Math.round(daylight),
      privacy: Math.round(privacy),
      expandability: Math.round(expandability),
    },
  };
}

export function rankLayouts(
  layouts: PlacedRoom[][],
  plotWidth: number = 60,
  plotHeight: number = 80,
): {
  rooms: PlacedRoom[];
  score: number;
  reasons: string[];
  breakdown: any;
}[] {
  return layouts
    .map((rooms) => ({
      rooms,
      ...scoreLayout(rooms, plotWidth, plotHeight),
    }))
    .sort((a, b) => b.score - a.score);
}
