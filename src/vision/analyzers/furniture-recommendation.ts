import { VisionAnalysisResult, FurnitureRecommendation } from "../types";

export class FurnitureRecommendationEngine {
  /**
   * Evaluate the current room furniture list and suggest missing items.
   */
  public static getRecommendations(layout: VisionAnalysisResult): FurnitureRecommendation[] {
    const recommendations: FurnitureRecommendation[] = [];
    const roomType = (layout.roomType || "living_room").toLowerCase().trim();
    const existingTypes = layout.furniture.map(f => f.type.toLowerCase().trim());

    if (roomType === "bedroom") {
      if (!existingTypes.includes("bed")) {
        recommendations.push({
          id: "rec_bed",
          furnitureType: "bed",
          reason: "Every bedroom requires a bed as the main central focal point.",
          priority: "essential",
          dimensions: { width: 6.0, height: 6.5 },
        });
      }
      if (!existingTypes.includes("wardrobe") && !existingTypes.includes("closet")) {
        recommendations.push({
          id: "rec_wardrobe",
          furnitureType: "wardrobe",
          reason: "Clothes storage (wardrobe or closet) is highly critical for a bedroom.",
          priority: "essential",
          dimensions: { width: 5.0, height: 2.2 },
        });
      }
      const nightstandCount = layout.furniture.filter(f => f.type.includes("nightstand") || f.type.includes("side_table")).length;
      if (nightstandCount < 2) {
        recommendations.push({
          id: "rec_nightstand",
          furnitureType: "nightstand",
          reason: "Adding nightstands next to the bed headboard provides essential bedside storage and symmetry.",
          priority: "recommended",
          dimensions: { width: 1.8, height: 1.8 },
        });
      }
      if (!existingTypes.includes("desk") && !existingTypes.includes("study_table")) {
        recommendations.push({
          id: "rec_desk",
          furnitureType: "desk",
          reason: "Adding a compact work/study desk supports home-office routines.",
          priority: "optional",
          dimensions: { width: 4.0, height: 2.0 },
        });
      }
    } else if (roomType === "living_room") {
      if (!existingTypes.includes("sofa") && !existingTypes.includes("couch")) {
        recommendations.push({
          id: "rec_sofa",
          furnitureType: "sofa",
          reason: "A primary sofa or couch is essential for seating and family gatherings.",
          priority: "essential",
          dimensions: { width: 7.0, height: 3.2 },
        });
      }
      if (!existingTypes.includes("coffee_table") && !existingTypes.includes("table")) {
        recommendations.push({
          id: "rec_coffee_table",
          furnitureType: "coffee_table",
          reason: "A central coffee table anchors the lounge seating group.",
          priority: "recommended",
          dimensions: { width: 4.0, height: 2.5 },
        });
      }
      if (!existingTypes.includes("tv_unit") && !existingTypes.includes("credenza")) {
        recommendations.push({
          id: "rec_tv_unit",
          furnitureType: "tv_unit",
          reason: "A media credenza or TV console completes the focus wall.",
          priority: "recommended",
          dimensions: { width: 6.0, height: 1.8 },
        });
      }
      if (!existingTypes.includes("armchair") && !existingTypes.includes("chair")) {
        recommendations.push({
          id: "rec_armchair",
          furnitureType: "armchair",
          reason: "Accent armchairs add secondary conversational seating.",
          priority: "optional",
          dimensions: { width: 2.8, height: 2.8 },
        });
      }
    } else if (roomType === "bathroom") {
      if (!existingTypes.includes("toilet")) {
        recommendations.push({
          id: "rec_toilet",
          furnitureType: "toilet",
          reason: "A toilet fixture is essential for standard bathroom functionality.",
          priority: "essential",
          dimensions: { width: 1.8, height: 2.4 },
        });
      }
      if (!existingTypes.includes("wash_basin") && !existingTypes.includes("sink")) {
        recommendations.push({
          id: "rec_wash_basin",
          furnitureType: "wash_basin",
          reason: "A sink vanity is required for washing and grooming chores.",
          priority: "essential",
          dimensions: { width: 2.2, height: 1.8 },
        });
      }
      if (!existingTypes.includes("shower") && !existingTypes.includes("bathtub")) {
        recommendations.push({
          id: "rec_shower",
          furnitureType: "shower",
          reason: "A dedicated shower enclosure or bath zone is needed to make the space a full bathroom.",
          priority: "essential",
          dimensions: { width: 3.2, height: 3.2 },
        });
      }
    } else if (roomType === "kitchen") {
      if (!existingTypes.includes("kitchen_counter") && !existingTypes.includes("counter")) {
        recommendations.push({
          id: "rec_counter",
          furnitureType: "kitchen_counter",
          reason: "Countertop area with stove and sink is crucial for meal prep.",
          priority: "essential",
          dimensions: { width: 8.0, height: 2.0 },
        });
      }
      if (!existingTypes.includes("refrigerator") && !existingTypes.includes("fridge")) {
        recommendations.push({
          id: "rec_fridge",
          furnitureType: "refrigerator",
          reason: "Food cold-storage requires a dedicated refrigerator slot.",
          priority: "essential",
          dimensions: { width: 3.0, height: 3.0 },
        });
      }
    }

    return recommendations;
  }
}
