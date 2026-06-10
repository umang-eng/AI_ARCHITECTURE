import { Blueprint } from "../types/blueprint";

export interface DatasetSample {
  instruction: string;
  blueprint: Blueprint;
}

export function createSample(
  buildingType: string,
  plotWidth: number,
  plotHeight: number,
  bedrooms: number,
  bathrooms: number,
  style: string,
  blueprint: Blueprint,
): DatasetSample {
  const instruction = `${style} ${buildingType} ${plotWidth}x${plotHeight} ${bedrooms} Bedrooms ${bathrooms} Bathrooms`;

  return {
    instruction,
    blueprint,
  };
}

export function exportSamples(samples: DatasetSample[]): string {
  return JSON.stringify(samples, null, 2);
}

export function downloadSamples(samples: DatasetSample[], filename: string) {
  const json = exportSamples(samples);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
