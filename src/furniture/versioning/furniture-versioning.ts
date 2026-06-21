import { FurnitureItem } from "../types";

export interface FurnitureVersionEntry {
  versionId: string;
  blueprintId: string;
  furniture: FurnitureItem[];
  score: number;
  timestamp: string;
}

const furnitureHistory = new Map<string, FurnitureVersionEntry[]>();

export function saveFurnitureVersion(
  blueprintId: string,
  furniture: FurnitureItem[],
  score: number,
): FurnitureVersionEntry {
  const history = furnitureHistory.get(blueprintId) || [];
  const entry: FurnitureVersionEntry = {
    versionId: `fver_${history.length + 1}_${Date.now()}`,
    blueprintId,
    furniture: furniture.map((f) => ({ ...f })),
    score,
    timestamp: new Date().toISOString(),
  };
  history.push(entry);
  furnitureHistory.set(blueprintId, history);
  return entry;
}

export function getFurnitureHistory(blueprintId: string): FurnitureVersionEntry[] {
  return furnitureHistory.get(blueprintId) || [];
}
