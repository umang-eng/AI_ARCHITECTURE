export interface BlueprintVersion {
  id: string;
  blueprintId: string;
  version: number;
  seed: number;
  blueprint: any;
  score: number;
  prompt: string;
  createdAt: string;
}

export interface BlueprintRecord {
  id: string;
  name: string;
  buildingType: string;
  style: string;
  plotWidth: number;
  plotHeight: number;
  currentVersion: number;
  createdAt: string;
  updatedAt: string;
}
