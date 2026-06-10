const TEMPLATES = [
  "Design a {style} {type} on a {w}x{h} plot with {beds} bedrooms and {baths} bathrooms",
  "Create a {style} {type} with {beds} bedrooms and {baths} bathrooms on a {w}x{h} lot",
  "Generate a {style} {type} floor plan with {beds} bedrooms and {baths} bathrooms",
  "Build a {style} {type} on a {w}x{h} plot featuring {beds} bedrooms",
  "I need a {style} {type} design with {beds} bedrooms and {baths} bathrooms",
  "Draft a {style} {type} blueprint for a {w}x{h} plot",
  "Plan a {style} {type} with {beds} bedrooms on a {w}x{h} site",
  "Create floor plans for a {style} {type}, {beds} bed, {baths} bath, {w}x{h} plot",
  "Architect a {style} {type} residence with {beds} bedrooms and {baths} bathrooms",
  "Produce a {style} {type} layout on {w}x{h} land with {beds} bedrooms",
];

const STYLE_SYNONYMS: Record<string, string[]> = {
  modern: ["modern", "contemporary", "sleek", "minimalist"],
  traditional: ["traditional", "classic", "conventional", "timeless"],
  industrial: ["industrial", "urban", "loft-style", "warehouse"],
  minimalist: ["minimalist", "simple", "clean", "stripped-down"],
  contemporary: ["contemporary", "modern", "current", "present-day"],
};

const TYPE_SYNONYMS: Record<string, string[]> = {
  villa: ["villa", "estate", "luxury home", "residence"],
  house: ["house", "home", "dwelling", "residence"],
  duplex: ["duplex", "two-unit home", "dual residence"],
  apartment: ["apartment", "unit", "flat", "condo"],
  office: ["office", "workspace", "commercial space", "business center"],
};

export function generatePrompt(
  buildingType: string,
  style: string,
  plotWidth: number,
  plotHeight: number,
  bedrooms: number,
  bathrooms: number,
): string {
  const template = TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)];

  const styleOptions = STYLE_SYNONYMS[style] || [style];
  const typeOptions = TYPE_SYNONYMS[buildingType] || [buildingType];

  const resolvedStyle = styleOptions[Math.floor(Math.random() * styleOptions.length)];
  const resolvedType = typeOptions[Math.floor(Math.random() * typeOptions.length)];

  return template
    .replace("{style}", resolvedStyle)
    .replace("{type}", resolvedType)
    .replace("{w}", String(plotWidth))
    .replace("{h}", String(plotHeight))
    .replace("{beds}", String(bedrooms))
    .replace("{baths}", String(bathrooms));
}

export function generateMultiplePrompts(
  buildingType: string,
  style: string,
  plotWidth: number,
  plotHeight: number,
  bedrooms: number,
  bathrooms: number,
  count: number = 5,
): string[] {
  const prompts = new Set<string>();

  while (prompts.size < count) {
    prompts.add(
      generatePrompt(buildingType, style, plotWidth, plotHeight, bedrooms, bathrooms)
    );
  }

  return Array.from(prompts);
}
