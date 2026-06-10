import { Blueprint } from "../types/blueprint";
import { checkOverlaps } from "../validators/overlap-validator";
import { checkBoundaries } from "../validators/boundary-validator";
import { checkSizes } from "../validators/size-validator";

export interface MetricsResult {
  structuralAccuracy: number;
  geometryAccuracy: number;
  diversity: number;
  validity: number;
  overall: number;
  details: string[];
}

export function evaluateBlueprint(
  blueprint: Blueprint,
  expectedBedrooms: number,
  expectedBathrooms: number,
): MetricsResult {
  const details: string[] = [];
  let structuralScore = 0;
  let geometryScore = 0;
  let validityScore = 0;

  // Structural Accuracy
  const bedroomCount = blueprint.rooms.filter((r) =>
    r.name.toLowerCase().includes("bedroom")
  ).length;
  const bathroomCount = blueprint.rooms.filter((r) =>
    r.name.toLowerCase().includes("bathroom")
  ).length;
  const hasLivingRoom = blueprint.rooms.some((r) =>
    r.name.toLowerCase().includes("living")
  );
  const hasKitchen = blueprint.rooms.some((r) =>
    r.name.toLowerCase().includes("kitchen")
  );

  if (bedroomCount === expectedBedrooms) {
    structuralScore += 25;
    details.push(`Bedrooms: ${bedroomCount}/${expectedBedrooms} OK`);
  } else {
    details.push(`Bedrooms: ${bedroomCount}/${expectedBedrooms} MISMATCH`);
  }

  if (bathroomCount === expectedBathrooms) {
    structuralScore += 25;
    details.push(`Bathrooms: ${bathroomCount}/${expectedBathrooms} OK`);
  } else {
    details.push(`Bathrooms: ${bathroomCount}/${expectedBathrooms} MISMATCH`);
  }

  if (hasLivingRoom) {
    structuralScore += 25;
    details.push("Living room: present");
  } else {
    details.push("Living room: missing");
  }

  if (hasKitchen) {
    structuralScore += 25;
    details.push("Kitchen: present");
  } else {
    details.push("Kitchen: missing");
  }

  // Geometry Accuracy
  const boundaryErrors = checkBoundaries(blueprint);
  if (boundaryErrors.length === 0) {
    geometryScore = 100;
    details.push("All rooms inside plot");
  } else {
    geometryScore = Math.max(0, 100 - boundaryErrors.length * 20);
    details.push(`${boundaryErrors.length} rooms outside plot`);
  }

  // Validity
  const overlapErrors = checkOverlaps(blueprint);
  const sizeErrors = checkSizes(blueprint);
  const totalErrors = overlapErrors.length + sizeErrors.length;

  if (totalErrors === 0) {
    validityScore = 100;
    details.push("No overlaps or size violations");
  } else {
    validityScore = Math.max(0, 100 - totalErrors * 15);
    details.push(`${overlapErrors.length} overlaps, ${sizeErrors.length} size issues`);
  }

  // Diversity (placeholder - computed across batch)
  const diversityScore = 80;

  const overall = Math.round(
    (structuralScore + geometryScore + validityScore + diversityScore) / 4
  );

  return {
    structuralAccuracy: structuralScore,
    geometryAccuracy: geometryScore,
    diversity: diversityScore,
    validity: validityScore,
    overall,
    details,
  };
}

export function evaluateBatch(
  blueprints: Blueprint[],
  expectedBedrooms: number,
  expectedBathrooms: number,
): {
  averageScores: MetricsResult;
  passRate: number;
  totalSamples: number;
} {
  const results = blueprints.map((bp) =>
    evaluateBlueprint(bp, expectedBedrooms, expectedBathrooms)
  );

  const avgStructural = results.reduce((s, r) => s + r.structuralAccuracy, 0) / results.length;
  const avgGeometry = results.reduce((s, r) => s + r.geometryAccuracy, 0) / results.length;
  const avgValidity = results.reduce((s, r) => s + r.validity, 0) / results.length;
  const avgDiversity = results.reduce((s, r) => s + r.diversity, 0) / results.length;
  const avgOverall = results.reduce((s, r) => s + r.overall, 0) / results.length;

  const passed = results.filter((r) => r.overall >= 70).length;

  return {
    averageScores: {
      structuralAccuracy: Math.round(avgStructural),
      geometryAccuracy: Math.round(avgGeometry),
      diversity: Math.round(avgDiversity),
      validity: Math.round(avgValidity),
      overall: Math.round(avgOverall),
      details: [],
    },
    passRate: Math.round((passed / results.length) * 100),
    totalSamples: results.length,
  };
}
