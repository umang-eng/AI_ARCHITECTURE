import { VisionAnalysisResult, VisionDimension } from "../types";

export class DimensionEstimator {
  // Reference sizes in feet
  private static readonly STANDARD_ANCHORS: Record<string, number> = {
    door: 3.0,
    window: 4.0,
    bed: 6.0,
    sofa: 6.0,
    toilet: 1.8,
    wash_basin: 2.0,
    shower: 3.0,
    armchair: 2.8,
  };

  /**
   * Calibrate a list of elements based on a detected anchor.
   * If the detected anchor is a door and its width is parsed as something non-standard,
   * we can calculate a correction scale factor and apply it.
   */
  public static calibrateScale(
    result: VisionAnalysisResult,
    anchorType: string = "door",
    targetPhysicalSize?: number
  ): VisionAnalysisResult {
    const standardSize = targetPhysicalSize ?? this.STANDARD_ANCHORS[anchorType.toLowerCase()] ?? 3.0;
    
    // Find a matching item in furniture, doors or windows to calculate scaling
    let detectedSize: number | null = null;

    if (anchorType.toLowerCase() === "door" && result.doors.length > 0) {
      detectedSize = result.doors[0].width;
    } else if (anchorType.toLowerCase() === "window" && result.windows.length > 0) {
      detectedSize = result.windows[0].width;
    } else {
      const match = result.furniture.find(f => f.type.toLowerCase() === anchorType.toLowerCase());
      if (match) {
        // Use max of width/height depending on layout
        detectedSize = Math.max(match.width, match.height);
      }
    }

    if (!detectedSize || detectedSize <= 0) {
      // No calibration anchor found, return original result
      return result;
    }

    const scale = standardSize / detectedSize;
    if (Math.abs(scale - 1.0) < 0.05) {
      // Scale is close enough to 1.0, bypass scaling to prevent small precision errors
      return result;
    }

    return this.applyScale(result, scale);
  }

  /**
   * Apply a linear scaling factor to all coordinates and dimensions in the layout result.
   */
  public static applyScale(result: VisionAnalysisResult, scale: number): VisionAnalysisResult {
    return {
      ...result,
      dimensions: {
        width: Number((result.dimensions.width * scale).toFixed(2)),
        height: Number((result.dimensions.height * scale).toFixed(2)),
      },
      furniture: result.furniture.map(f => ({
        ...f,
        x: Number((f.x * scale).toFixed(2)),
        y: Number((f.y * scale).toFixed(2)),
        width: Number((f.width * scale).toFixed(2)),
        height: Number((f.height * scale).toFixed(2)),
      })),
      doors: result.doors.map(d => ({
        ...d,
        x: Number((d.x * scale).toFixed(2)),
        y: Number((d.y * scale).toFixed(2)),
        width: Number((d.width * scale).toFixed(2)),
      })),
      windows: result.windows.map(w => ({
        ...w,
        x: Number((w.x * scale).toFixed(2)),
        y: Number((w.y * scale).toFixed(2)),
        width: Number((w.width * scale).toFixed(2)),
      })),
      rooms: result.rooms?.map(r => ({
        ...r,
        x: Number((r.x * scale).toFixed(2)),
        y: Number((r.y * scale).toFixed(2)),
        dimensions: {
          width: Number((r.dimensions.width * scale).toFixed(2)),
          height: Number((r.dimensions.height * scale).toFixed(2)),
        },
        furniture: r.furniture.map(f => ({
          ...f,
          x: Number((f.x * scale).toFixed(2)),
          y: Number((f.y * scale).toFixed(2)),
          width: Number((f.width * scale).toFixed(2)),
          height: Number((f.height * scale).toFixed(2)),
        })),
        doors: r.doors.map(d => ({
          ...d,
          x: Number((d.x * scale).toFixed(2)),
          y: Number((d.y * scale).toFixed(2)),
          width: Number((d.width * scale).toFixed(2)),
        })),
        windows: r.windows.map(w => ({
          ...w,
          x: Number((w.x * scale).toFixed(2)),
          y: Number((w.y * scale).toFixed(2)),
          width: Number((w.width * scale).toFixed(2)),
        })),
      })),
    };
  }

  /**
   * Estimate the floor area in square feet.
   */
  public static estimateArea(dimensions: VisionDimension): number {
    return Number((dimensions.width * dimensions.height).toFixed(2));
  }
}
