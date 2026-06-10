import { Blueprint } from "../types/blueprint";
import { TrainingSample } from "./instruction-format";
import { generateMultiplePrompts } from "./prompt-variations";

const STYLE_VARIATIONS: Record<string, string[]> = {
  modern: ["modern", "contemporary", "sleek", "minimalist", "current"],
  traditional: ["traditional", "classic", "conventional", "timeless", "heritage"],
  industrial: ["industrial", "urban", "loft-style", "warehouse", "edgy"],
  minimalist: ["minimalist", "simple", "clean", "stripped-down", "pure"],
  contemporary: ["contemporary", "modern", "current", "present-day", "trendy"],
};

const TYPE_VARIATIONS: Record<string, string[]> = {
  villa: ["villa", "estate", "luxury home", "residence", "mansion"],
  house: ["house", "home", "dwelling", "residence", "property"],
  duplex: ["duplex", "two-unit home", "dual residence", "twin home"],
  apartment: ["apartment", "unit", "flat", "condo", "loft"],
  office: ["office", "workspace", "commercial space", "business center", "corporate hub"],
};

const SIZE_ADJECTIVES = ["spacious", "compact", "open", "cozy", "grand", "elegant", "premium"];

export function augmentSample(
  buildingType: string,
  style: string,
  plotWidth: number,
  plotHeight: number,
  bedrooms: number,
  bathrooms: number,
  blueprint: Blueprint,
): TrainingSample[] {
  const samples: TrainingSample[] = [];
  const seen = new Set<string>();

  const styles = STYLE_VARIATIONS[style] || [style];
  const types = TYPE_VARIATIONS[buildingType] || [buildingType];

  for (const s of styles) {
    for (const t of types) {
      const prompts = generateMultiplePrompts(t, s, plotWidth, plotHeight, bedrooms, bathrooms, 2);
      for (const prompt of prompts) {
        if (!seen.has(prompt)) {
          seen.add(prompt);
          samples.push({
            instruction: prompt,
            input: "",
            output: JSON.stringify(blueprint),
          });
        }
      }
    }
  }

  for (const adj of SIZE_ADJECTIVES) {
    const prompt = `Generate a ${adj} ${style} ${buildingType} floor plan on a ${plotWidth}x${plotHeight} plot with ${bedrooms} bedrooms and ${bathrooms} bathrooms`;
    if (!seen.has(prompt)) {
      seen.add(prompt);
      samples.push({
        instruction: prompt,
        input: "",
        output: JSON.stringify(blueprint),
      });
    }
  }

  return samples;
}

export function augmentBatch(
  buildingType: string,
  style: string,
  plotWidth: number,
  plotHeight: number,
  bedrooms: number,
  bathrooms: number,
  blueprint: Blueprint,
  count: number = 10,
): TrainingSample[] {
  const allSamples = augmentSample(
    buildingType,
    style,
    plotWidth,
    plotHeight,
    bedrooms,
    bathrooms,
    blueprint,
  );

  return allSamples.slice(0, count);
}
