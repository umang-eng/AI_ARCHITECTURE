import { Blueprint } from "../types/blueprint";

export interface GenerationEntry {
  seed: number;
  buildingType: string;
  style: string;
  blueprint: Blueprint;
  timestamp: string;
}

const history: GenerationEntry[] = [];

export function addGeneration(
  seed: number,
  buildingType: string,
  style: string,
  blueprint: Blueprint,
): void {
  history.push({
    seed,
    buildingType,
    style,
    blueprint,
    timestamp: new Date().toISOString(),
  });
}

export function getHistory(): GenerationEntry[] {
  return [...history];
}

export function clearHistory(): void {
  history.length = 0;
}

export function exportHistory(): string {
  return JSON.stringify(history, null, 2);
}
