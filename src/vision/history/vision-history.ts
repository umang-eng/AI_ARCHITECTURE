import { VisionAnalysisResult } from "../types";

export interface VisionRunHistoryEntry {
  id: string;
  timestamp: string;
  fileName: string;
  result: VisionAnalysisResult;
}

export class VisionHistory {
  private static readonly STORAGE_KEY = "blueprint_vision_history";

  /**
   * Save a vision analysis run into the history.
   */
  public static saveRun(fileName: string, result: VisionAnalysisResult): VisionRunHistoryEntry {
    const entry: VisionRunHistoryEntry = {
      id: `vrun_${Date.now()}`,
      timestamp: new Date().toISOString(),
      fileName,
      result,
    };

    try {
      const existing = this.getRuns();
      existing.unshift(entry); // Add to the beginning of the list
      // Limit history to 20 runs
      const limited = existing.slice(0, 20);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(limited));
    } catch (e) {
      console.error("Failed to write vision history to localStorage:", e);
    }

    return entry;
  }

  /**
   * Get all past vision runs.
   */
  public static getRuns(): VisionRunHistoryEntry[] {
    if (typeof window === "undefined") return [];
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Failed to read vision history from localStorage:", e);
      return [];
    }
  }

  /**
   * Delete a single history entry.
   */
  public static deleteRun(id: string): void {
    try {
      const existing = this.getRuns();
      const filtered = existing.filter(r => r.id !== id);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
    } catch (e) {
      console.error("Failed to delete vision history entry:", e);
    }
  }

  /**
   * Clear all history entries.
   */
  public static clearHistory(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (e) {
      console.error("Failed to clear vision history:", e);
    }
  }
}
