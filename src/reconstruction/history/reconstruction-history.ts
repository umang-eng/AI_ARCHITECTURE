import { ReconstructionJobStatus } from "../types";

export class ReconstructionHistory {
  private static readonly STORAGE_KEY = "blueprint_reconstruction_history";

  /**
   * Save a completed reconstruction job into local history.
   */
  public static saveJob(job: ReconstructionJobStatus): void {
    if (typeof window === "undefined") return;
    try {
      const existing = this.getJobs();
      // De-duplicate jobs
      const filtered = existing.filter(j => j.jobId !== job.jobId);
      filtered.unshift(job);
      // Limit history items to 15
      const limited = filtered.slice(0, 15);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(limited));
    } catch (e) {
      console.error("Failed to write reconstruction history to localStorage:", e);
    }
  }

  /**
   * Get all past reconstruction jobs.
   */
  public static getJobs(): ReconstructionJobStatus[] {
    if (typeof window === "undefined") return [];
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Failed to read reconstruction history from localStorage:", e);
      return [];
    }
  }

  /**
   * Delete a job run entry.
   */
  public static deleteJob(jobId: string): void {
    try {
      const existing = this.getJobs();
      const filtered = existing.filter(j => j.jobId !== jobId);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
    } catch (e) {
      console.error("Failed to delete reconstruction history entry:", e);
    }
  }

  /**
   * Clear all history entries.
   */
  public static clearHistory(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (e) {
      console.error("Failed to clear reconstruction history:", e);
    }
  }
}
