import { Blueprint } from "../types/blueprint";
import { BlueprintRecord, BlueprintVersion } from "./version-types";

let blueprintCounter = 0;
let versionCounter = 0;

const blueprints = new Map<string, BlueprintRecord>();
const versions = new Map<string, BlueprintVersion[]>();

export function saveBlueprint(
  name: string,
  blueprint: Blueprint,
  seed: number,
  buildingType: string,
  style: string,
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
    createdAt: new Date().toISOString(),
  };

  blueprints.set(blueprintId, record);
  versions.set(blueprintId, [version]);

  return { record, version };
}

export function saveVersion(
  blueprintId: string,
  blueprint: Blueprint,
  seed: number,
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
    createdAt: new Date().toISOString(),
  };

  existing.push(version);

  const record = blueprints.get(blueprintId);
  if (record) {
    record.currentVersion = versionNumber;
    record.updatedAt = new Date().toISOString();
  }

  return version;
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
