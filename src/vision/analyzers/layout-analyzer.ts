import { VisionAnalysisResult, VisionFurniture } from "../types";

export interface LayoutAnalysisReport {
  score: number;
  subScores: {
    circulation: number;
    daylight: number;
    spaceUtilization: number;
    aspectRatio: number;
  };
  critiques: string[];
  recommendations: string[];
}

export class LayoutAnalyzer {
  /**
   * Analyze a vision layout result and generate a comprehensive architectural report.
   */
  public static analyze(layout: VisionAnalysisResult): LayoutAnalysisReport {
    const critiques: string[] = [];
    const recommendations: string[] = [];

    // 1. Space Utilization Score
    const roomArea = layout.dimensions.width * layout.dimensions.height;
    let furnitureArea = 0;
    layout.furniture.forEach(f => {
      furnitureArea += f.width * f.height;
    });

    const utilizationRatio = roomArea > 0 ? furnitureArea / roomArea : 0;
    let spaceUtilizationScore = 100;

    if (utilizationRatio < 0.15) {
      spaceUtilizationScore = Math.max(40, 100 - (0.15 - utilizationRatio) * 400);
      critiques.push("The room feels sparse and under-utilized. Add more storage or functional zoning.");
      recommendations.push("Introduce supplementary furniture (e.g. side tables, storage benches) to balance the spatial scale.");
    } else if (utilizationRatio > 0.45) {
      spaceUtilizationScore = Math.max(30, 100 - (utilizationRatio - 0.45) * 300);
      critiques.push("High density. The room is overcrowded, which might restrict physical movement.");
      recommendations.push("Consider removing bulkier pieces or opting for multi-functional wall-mounted layouts.");
    } else {
      critiques.push("Excellent space utilization. The ratio of furniture to free space is optimal.");
    }

    // 2. Aspect Ratio / Room Shape Score
    let aspectRatioScore = 100;
    if (layout.dimensions.height > 0) {
      const ratio = layout.dimensions.width / layout.dimensions.height;
      const invRatio = 1.0 / ratio;
      const dev = Math.max(ratio, invRatio); // deviation from square
      
      if (dev > 2.0) {
        aspectRatioScore = Math.max(40, 100 - (dev - 2.0) * 40);
        critiques.push("Extremely narrow or long layout. This shape poses zoning and flow challenges.");
        recommendations.push("Divide the elongated space into distinct functional sub-zones (e.g. reading corner + bed zone).");
      }
    }

    // 3. Daylight Alignment (Windows) Score
    let daylightScore = 100;
    if (layout.windows.length > 0) {
      // Check if any major furniture (like wardrobe, cabinet, tv_unit) overlaps window lines
      layout.windows.forEach(w => {
        layout.furniture.forEach(f => {
          // If furniture is too close to the window (within 1.5 ft)
          const dist = Math.hypot(f.x + f.width/2 - w.x, f.y + f.height/2 - w.y);
          if (dist < 2.0 && ["wardrobe", "cabinet", "bookcase"].includes(f.type.toLowerCase())) {
            daylightScore = Math.max(50, daylightScore - 20);
            critiques.push(`High furniture (${f.type}) blocks natural light near the window.`);
            recommendations.push(`Relocate the tall ${f.type} away from window opening lines to maximize natural daylighting.`);
          }
        });
      });
      
      // Bed to window check: bed headboards should ideally not block windows directly
      const bed = layout.furniture.find(f => f.type.toLowerCase() === "bed");
      if (bed) {
        const bedNearWindow = layout.windows.some(w => {
          const dist = Math.hypot(bed.x + bed.width/2 - w.x, bed.y + bed.height/2 - w.y);
          return dist < 3.0;
        });
        if (bedNearWindow) {
          critiques.push("The bed is placed very close to or blocking the window.");
          recommendations.push("Standard bedroom zoning recommends placing the bed against a solid wall perpendicular or opposite to the window.");
        }
      }
    } else {
      daylightScore = 60;
      critiques.push("No windows detected. The space lacks natural daylight and ventilation.");
      recommendations.push("Ensure forced ventilation is configured, and use mirrors/light color schemes to mimic brightness.");
    }

    // 4. Circulation / Door Obstruction Score
    let circulationScore = 100;
    if (layout.doors.length > 0) {
      layout.doors.forEach(d => {
        // Ensure clearance in front of doors (e.g. 3 ft radius must be clear of furniture)
        layout.furniture.forEach(f => {
          // Door center coordinate
          const dx = d.x;
          const dy = d.y;
          // Calculate distance between door center and furniture center
          const dist = Math.hypot(f.x + f.width/2 - dx, f.y + f.height/2 - dy);
          
          if (dist < 3.5) {
            circulationScore = Math.max(40, circulationScore - 25);
            critiques.push(`Furniture (${f.type}) is placed in the door circulation swing path.`);
            recommendations.push(`Move the ${f.type} away from the entrance door area to maintain clear, unimpeded entry paths.`);
          }
        });
      });
    }

    // Calculate final layout score
    const score = Math.round(
      circulationScore * 0.35 +
      daylightScore * 0.25 +
      spaceUtilizationScore * 0.25 +
      aspectRatioScore * 0.15
    );

    return {
      score,
      subScores: {
        circulation: Math.round(circulationScore),
        daylight: Math.round(daylightScore),
        spaceUtilization: Math.round(spaceUtilizationScore),
        aspectRatio: Math.round(aspectRatioScore),
      },
      critiques,
      recommendations: Array.from(new Set(recommendations)), // de-duplicate
    };
  }
}
