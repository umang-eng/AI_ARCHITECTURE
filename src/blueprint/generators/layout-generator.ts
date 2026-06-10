import { Blueprint } from "../types/blueprint";
import { BuildingRequirements } from "../schema/building-schema";
import {
  villaTemplates,
  houseTemplates,
  duplexTemplates,
  officeTemplates,
  apartmentTemplates,
  allTemplates,
} from "../templates/template-registry";
import { selectTemplate } from "./template-selector";

export function generateLayout(requirements: BuildingRequirements): Blueprint {
  const templates = getTemplatesForBuildingType(requirements.buildingType);
  const template = selectTemplate(templates);
  return template;
}

function getTemplatesForBuildingType(buildingType: string): Blueprint[] {
  switch (buildingType.toLowerCase()) {
    case "villa":
      return villaTemplates;
    case "house":
      return houseTemplates;
    case "duplex":
      return duplexTemplates;
    case "office":
      return officeTemplates;
    case "apartment":
      return apartmentTemplates;
    case "commercial":
    case "shop":
      return [...officeTemplates, ...apartmentTemplates];
    default:
      return allTemplates;
  }
}
