import { VisionAnalysisResult } from "../types";

export class VisionVersionStore {
  private states: VisionAnalysisResult[] = [];
  private currentIndex: number = -1;

  /**
   * Push a new layout version state onto the stack.
   */
  public pushState(state: VisionAnalysisResult): void {
    // Drop any redo states if we are in the middle of undoing and push a new state
    if (this.currentIndex < this.states.length - 1) {
      this.states = this.states.slice(0, this.currentIndex + 1);
    }
    // Deep clone state to avoid mutation reference side-effects
    const cloned = JSON.parse(JSON.stringify(state));
    this.states.push(cloned);
    // Maintain maximum 30 undo steps
    if (this.states.length > 30) {
      this.states.shift();
    }
    this.currentIndex = this.states.length - 1;
  }

  /**
   * Travel back in version history.
   */
  public undo(): VisionAnalysisResult | null {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      return JSON.parse(JSON.stringify(this.states[this.currentIndex]));
    }
    return null;
  }

  /**
   * Travel forward in version history.
   */
  public redo(): VisionAnalysisResult | null {
    if (this.currentIndex < this.states.length - 1) {
      this.currentIndex++;
      return JSON.parse(JSON.stringify(this.states[this.currentIndex]));
    }
    return null;
  }

  /**
   * Return the active state.
   */
  public getCurrentState(): VisionAnalysisResult | null {
    if (this.currentIndex >= 0 && this.currentIndex < this.states.length) {
      return JSON.parse(JSON.stringify(this.states[this.currentIndex]));
    }
    return null;
  }

  /**
   * Check if undo is available.
   */
  public get canUndo(): boolean {
    return this.currentIndex > 0;
  }

  /**
   * Check if redo is available.
   */
  public get canRedo(): boolean {
    return this.currentIndex < this.states.length - 1;
  }

  /**
   * Clear all history stacks.
   */
  public clear(): void {
    this.states = [];
    this.currentIndex = -1;
  }
}
