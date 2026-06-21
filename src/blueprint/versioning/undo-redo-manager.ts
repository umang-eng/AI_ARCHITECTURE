export class UndoRedoManager<T> {
  private past: T[] = [];
  private present: T;
  private future: T[] = [];

  constructor(initialState: T) {
    this.present = initialState;
  }

  public pushState(newState: T): void {
    this.past.push(this.present);
    this.present = newState;
    this.future = []; // Clear redo stack on new action
  }

  public undo(): T | null {
    if (this.past.length === 0) return null;
    const previous = this.past.pop()!;
    this.future.push(this.present);
    this.present = previous;
    return this.present;
  }

  public redo(): T | null {
    if (this.future.length === 0) return null;
    const next = this.future.pop()!;
    this.past.push(this.present);
    this.present = next;
    return this.present;
  }

  public canUndo(): boolean {
    return this.past.length > 0;
  }

  public canRedo(): boolean {
    return this.future.length > 0;
  }

  public getCurrentState(): T {
    return this.present;
  }
}
