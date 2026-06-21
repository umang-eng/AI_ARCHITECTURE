import { Blueprint } from "../types/blueprint";
import { validateAdjacencyRules } from "../engine/constraint-engine/adjacency-rules";

export interface AdjacencyError {
  room: string;
  detail: string;
  code: string;
}

export function checkAdjacencies(blueprint: Blueprint): AdjacencyError[] {
  const violations = validateAdjacencyRules(blueprint);
  return violations.map((v) => ({
    room: v.targetId || "Global",
    detail: v.message,
    code: v.code,
  }));
}
