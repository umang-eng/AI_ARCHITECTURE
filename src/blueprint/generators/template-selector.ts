import { Blueprint } from "../types/blueprint";

export function selectTemplate(templates: Blueprint[]): Blueprint {
  if (!templates || templates.length === 0) {
    throw new Error("No templates available for selection");
  }
  const randomIndex = Math.floor(Math.random() * templates.length);
  return templates[randomIndex];
}
