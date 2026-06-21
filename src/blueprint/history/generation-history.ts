import { Blueprint } from "../types/blueprint";

export interface GenerationHistoryEntry {
  id: string;
  prompt: string;
  blueprint: Blueprint;
  score: number;
  style: string;
  buildingType: string;
  timestamp: string;
  metadata: {
    plotWidth: number;
    plotHeight: number;
    bedrooms: number;
    bathrooms: number;
    floors: number;
    algorithm: "procedural" | "ai";
    scoreBreakdown: any;
  };
}

const generationHistory: GenerationHistoryEntry[] = [];

export function addHistoryEntry(entry: Omit<GenerationHistoryEntry, "id" | "timestamp">): GenerationHistoryEntry {
  const newEntry: GenerationHistoryEntry = {
    ...entry,
    id: `hist_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
  };
  generationHistory.push(newEntry);
  
  // Also persist to localStorage for future dataset export if in browser
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("blueprint_generation_history");
      const list = stored ? JSON.parse(stored) : [];
      list.push(newEntry);
      localStorage.setItem("blueprint_generation_history", JSON.stringify(list));
    } catch {
      // ignore storage errors
    }
  }

  return newEntry;
}

export function getHistoryEntries(): GenerationHistoryEntry[] {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("blueprint_generation_history");
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback to memory
    }
  }
  return [...generationHistory];
}

export function clearHistoryEntries(): void {
  generationHistory.length = 0;
  if (typeof window !== "undefined") {
    localStorage.removeItem("blueprint_generation_history");
  }
}
