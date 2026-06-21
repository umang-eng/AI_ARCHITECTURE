import { Blueprint } from "../types/blueprint";
import { calculateNaturalLightScore } from "../engine/scoring/natural-light-score";
import { calculateCirculationScore } from "../engine/scoring/circulation-score";

export interface BlueprintAnalyticsReport {
  averageRoomSize: number;
  plotUtilization: number; // percentage
  unusedArea: number; // sq ft
  roomDistribution: Record<string, number>;
  circulationEfficiency: number; // percentage
  naturalLightCoverage: number; // percentage
}

export function computeBlueprintAnalytics(blueprint: Blueprint): BlueprintAnalyticsReport {
  const rooms = blueprint.rooms;
  const plotWidth = blueprint.plot.width;
  const plotHeight = blueprint.plot.height;
  const plotArea = plotWidth * plotHeight;

  if (rooms.length === 0) {
    return {
      averageRoomSize: 0,
      plotUtilization: 0,
      unusedArea: plotArea,
      roomDistribution: {},
      circulationEfficiency: 0,
      naturalLightCoverage: 0,
    };
  }

  const totalBuiltArea = rooms.reduce((sum, r) => sum + r.width * r.height, 0);
  const averageRoomSize = totalBuiltArea / rooms.length;
  const plotUtilization = (totalBuiltArea / plotArea) * 100;
  const unusedArea = plotArea - totalBuiltArea;

  const roomDistribution: Record<string, number> = {};
  for (const r of rooms) {
    roomDistribution[r.type] = (roomDistribution[r.type] || 0) + 1;
  }

  // Reuse validation/scoring functions for consistency
  const circulationEfficiency = calculateCirculationScore(rooms as any);
  const naturalLightCoverage = calculateNaturalLightScore(rooms as any, plotWidth, plotHeight);

  return {
    averageRoomSize: Math.round(averageRoomSize),
    plotUtilization: Math.round(plotUtilization),
    unusedArea: Math.round(unusedArea),
    roomDistribution,
    circulationEfficiency,
    naturalLightCoverage,
  };
}
