import { Blueprint } from "../types/blueprint";

export interface DatasetEntry {
  instruction: string;
  output: Blueprint;
}

export function createEntry(
  buildingType: string,
  style: string,
  plotWidth: number,
  plotHeight: number,
  bedrooms: number,
  bathrooms: number,
  blueprint: Blueprint,
): DatasetEntry {
  const instruction = `${style} ${buildingType} ${plotWidth}x${plotHeight} ${bedrooms} Bedrooms ${bathrooms} Bathrooms`;

  return {
    instruction,
    output: blueprint,
  };
}

export function entriesToJsonl(entries: DatasetEntry[]): string {
  return entries.map((e) => JSON.stringify(e)).join("\n");
}

export function downloadJsonl(entries: DatasetEntry[], filename: string) {
  const jsonl = entriesToJsonl(entries);
  const blob = new Blob([jsonl], { type: "application/jsonl" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
