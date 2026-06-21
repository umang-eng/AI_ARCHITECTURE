import { VisionAnalysisResult, RenovationSuggestion } from "../types";

export class RenovationAnalyzer {
  /**
   * Generate highly relevant, curated renovation proposals based on layout and desired architectural style.
   */
  public static generateSuggestions(
    layout: VisionAnalysisResult,
    styleTheme: string = "modern"
  ): RenovationSuggestion[] {
    const suggestions: RenovationSuggestion[] = [];
    const rtype = (layout.roomType || "living_room").toLowerCase().trim();
    const style = styleTheme.toLowerCase().trim();

    // 1. Color Scheme Renovations
    if (style === "minimalist") {
      suggestions.push({
        id: "color_min",
        category: "color",
        description: "Apply a monochromatic palette of warm off-whites (e.g. Alabaster) and soft charcoal accent trim.",
        impact: "high",
        costEstimate: "$300 - $600",
      });
    } else if (style === "industrial") {
      suggestions.push({
        id: "color_ind",
        category: "color",
        description: "Introduce a feature wall with concrete wash paint or exposed-brick textured wallpaper.",
        impact: "high",
        costEstimate: "$500 - $900",
      });
    } else if (style === "luxury" || style === "traditional") {
      suggestions.push({
        id: "color_lux",
        category: "color",
        description: "Incorporate deep jewel tones (like emerald or navy) on the accent wall behind the focal furniture.",
        impact: "medium",
        costEstimate: "$400 - $700",
      });
    } else {
      // Default Modern
      suggestions.push({
        id: "color_mod",
        category: "color",
        description: "Utilize a cool gray base with matte black fixtures and warm wood accents to tie the space together.",
        impact: "medium",
        costEstimate: "$350 - $650",
      });
    }

    // 2. Lighting Renovations
    if (rtype === "bedroom") {
      suggestions.push({
        id: "light_bed",
        category: "lighting",
        description: "Swap standard overhead fixture for dimmable recessed downlights and dual bedside pendant lights.",
        impact: "high",
        costEstimate: "$600 - $1,200",
      });
    } else if (rtype === "living_room") {
      suggestions.push({
        id: "light_living",
        category: "lighting",
        description: "Install cove LED strip lighting along the ceiling border and add a warm 3000K arc floor lamp.",
        impact: "high",
        costEstimate: "$800 - $1,500",
      });
    } else {
      suggestions.push({
        id: "light_gen",
        category: "lighting",
        description: "Incorporate task lighting (e.g. under-cabinet LEDs for kitchen or illuminated mirror for bathroom).",
        impact: "medium",
        costEstimate: "$200 - $500",
      });
    }

    // 3. Furniture Relocation Suggestions
    // Check if bed is not centered, suggest centering it
    if (rtype === "bedroom") {
      const bed = layout.furniture.find(f => f.type === "bed");
      if (bed) {
        const leftClearance = bed.x;
        const rightClearance = layout.dimensions.width - (bed.x + bed.width);
        if (Math.abs(leftClearance - rightClearance) > 2.0) {
          suggestions.push({
            id: "reloc_bed",
            category: "furniture",
            description: "Shift the bed to center it along the wall, providing balanced walkway clearance on both sides.",
            impact: "medium",
            costEstimate: "Free (Self-Relocation)",
          });
        }
      }
    }

    // Check if sofa is pushed flush against walls in a large living room, suggest floating it
    if (rtype === "living_room" && layout.dimensions.width > 15.0) {
      const sofa = layout.furniture.find(f => f.type === "sofa");
      if (sofa && (sofa.x < 1.0 || sofa.y < 1.0)) {
        suggestions.push({
          id: "reloc_sofa",
          category: "furniture",
          description: "Float the primary sofa 2-3 feet away from the wall to create a cozy, conversational core seating zone.",
          impact: "medium",
          costEstimate: "Free (Self-Relocation)",
        });
      }
    }

    // 4. Structural Upgrades
    if (layout.windows.length > 0) {
      suggestions.push({
        id: "struct_window",
        category: "structural",
        description: "Extend window openings or upgrade to double-glazed floor-to-ceiling sliding glass panes to boost natural ventilation.",
        impact: "high",
        costEstimate: "$2,000 - $4,500",
      });
    }

    return suggestions;
  }
}
