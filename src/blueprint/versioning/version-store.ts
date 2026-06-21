import { Blueprint } from "../types/blueprint";
import { BlueprintRecord, BlueprintVersion } from "./version-types";

let blueprintCounter = 0;
let versionCounter = 0;

const blueprints = new Map<string, BlueprintRecord>();
const versions = new Map<string, BlueprintVersion[]>();

// To support undo/redo at the store level
const undoStacks = new Map<string, BlueprintVersion[]>();
const redoStacks = new Map<string, BlueprintVersion[]>();

export function saveBlueprint(
  name: string,
  blueprint: Blueprint,
  seed: number,
  buildingType: string,
  style: string,
  prompt: string = "",
  score: number = 0,
): { record: BlueprintRecord; version: BlueprintVersion } {
  const blueprintId = `bp_${++blueprintCounter}`;
  const versionId = `ver_${++versionCounter}`;

  const record: BlueprintRecord = {
    id: blueprintId,
    name,
    buildingType,
    style,
    plotWidth: blueprint.plot.width,
    plotHeight: blueprint.plot.height,
    currentVersion: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const version: BlueprintVersion = {
    id: versionId,
    blueprintId,
    version: 1,
    seed,
    blueprint,
    score,
    prompt,
    createdAt: new Date().toISOString(),
  };

  blueprints.set(blueprintId, record);
  versions.set(blueprintId, [version]);
  
  // Initialize undo/redo stacks
  undoStacks.set(blueprintId, [version]);
  redoStacks.set(blueprintId, []);

  return { record, version };
}

export function saveVersion(
  blueprintId: string,
  blueprint: Blueprint,
  seed: number,
  prompt: string = "",
  score: number = 0,
): BlueprintVersion | null {
  const existing = versions.get(blueprintId);
  if (!existing) return null;

  const versionNumber = existing.length + 1;
  const versionId = `ver_${++versionCounter}`;

  const version: BlueprintVersion = {
    id: versionId,
    blueprintId,
    version: versionNumber,
    seed,
    blueprint,
    score,
    prompt,
    createdAt: new Date().toISOString(),
  };

  existing.push(version);

  const record = blueprints.get(blueprintId);
  if (record) {
    record.currentVersion = versionNumber;
    record.updatedAt = new Date().toISOString();
  }

  // Update undo/redo stacks
  const undoStack = undoStacks.get(blueprintId) || [];
  undoStack.push(version);
  undoStacks.set(blueprintId, undoStack);
  redoStacks.set(blueprintId, []); // Clear redo stack on new action

  return version;
}

export function undoVersion(blueprintId: string): BlueprintVersion | null {
  const undoStack = undoStacks.get(blueprintId) || [];
  const redoStack = redoStacks.get(blueprintId) || [];

  if (undoStack.length <= 1) return null; // Keep initial state

  const current = undoStack.pop()!;
  redoStack.push(current);
  
  const previous = undoStack[undoStack.length - 1];

  const record = blueprints.get(blueprintId);
  if (record && previous) {
    record.currentVersion = previous.version;
    record.updatedAt = new Date().toISOString();
  }

  undoStacks.set(blueprintId, undoStack);
  redoStacks.set(blueprintId, redoStack);

  return previous;
}

export function redoVersion(blueprintId: string): BlueprintVersion | null {
  const undoStack = undoStacks.get(blueprintId) || [];
  const redoStack = redoStacks.get(blueprintId) || [];

  if (redoStack.length === 0) return null;

  const next = redoStack.pop()!;
  undoStack.push(next);

  const record = blueprints.get(blueprintId);
  if (record) {
    record.currentVersion = next.version;
    record.updatedAt = new Date().toISOString();
  }

  undoStacks.set(blueprintId, undoStack);
  redoStacks.set(blueprintId, redoStack);

  return next;
}

export function getBlueprint(blueprintId: string): BlueprintRecord | null {
  return blueprints.get(blueprintId) || null;
}

export function getVersions(blueprintId: string): BlueprintVersion[] {
  return versions.get(blueprintId) || [];
}

export function getAllBlueprints(): BlueprintRecord[] {
  return Array.from(blueprints.values());
}
