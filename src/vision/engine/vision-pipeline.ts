import { VisionAnalysisResult } from "../types";
import { VisionValidator } from "../validators/vision-validator";
import { DimensionEstimator } from "../estimators/dimension-estimator";
import { VisionCanvasRenderer } from "../renderers/vision-canvas-renderer";
import { BlueprintCommand } from "../../blueprint/commands/command";

export interface VisionPipelineResult {
  success: boolean;
  result: VisionAnalysisResult | null;
  commands: BlueprintCommand[];
  error?: string;
}

export class VisionPipeline {
  /**
   * Orchestrate the process: Upload -> Validate -> Calibrate -> Generate Commands.
   */
  public static async analyzeMedia(
    file: File,
    roomTypeHint?: string
  ): Promise<VisionPipelineResult> {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      
      const formData = new FormData();
      formData.append("file", file);
      if (roomTypeHint) {
        formData.append("roomTypeHint", roomTypeHint);
      }

      console.log(`[VisionPipeline] Uploading ${file.name} to ${apiBase}/api/v1/vision/analyze`);
      
      const response = await fetch(`${apiBase}/api/v1/vision/analyze`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`API analysis failed with status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || "Analysis failed on server side.");
      }

      // 1. Validate response format
      const { isValid, errors } = VisionValidator.validate(data);
      if (!isValid) {
        console.warn("[VisionPipeline] Validation warning(s):", errors);
        // Continue but log warnings
      }

      // 2. Calibrate scale relative to doors/beds
      let calibratedResult: VisionAnalysisResult = {
        roomType: data.roomType,
        dimensions: data.dimensions,
        furniture: data.furniture || [],
        doors: data.doors || [],
        windows: data.windows || [],
        layoutScore: data.layoutScore || 80,
        rooms: data.rooms,
      };

      // Perform auto calibration if a door is present
      if (calibratedResult.doors.length > 0) {
        calibratedResult = DimensionEstimator.calibrateScale(calibratedResult, "door", 3.0);
      } else if (calibratedResult.furniture.some(f => f.type.toLowerCase() === "bed")) {
        calibratedResult = DimensionEstimator.calibrateScale(calibratedResult, "bed", 6.0);
      }

      // 3. Generate standard canvas commands
      const commands = VisionCanvasRenderer.convertToCommands(calibratedResult);

      return {
        success: true,
        result: calibratedResult,
        commands,
      };

    } catch (e: any) {
      console.error("[VisionPipeline] Pipeline error:", e);
      return {
        success: false,
        result: null,
        commands: [],
        error: e.message || "Unknown vision pipeline error",
      };
    }
  }
}
