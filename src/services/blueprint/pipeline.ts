/**
 * Blueprint Pipeline — the complete prompt → AI → JSON → commands → canvas flow.
 *
 * Orchestrates:
 * 1. AI model inference (or procedural fallback)
 * 2. JSON validation
 * 3. Parsing to internal Blueprint type
 * 4. Command generation (with auto doors/windows)
 * 5. Canvas rendering (Excalidraw elements)
 *
 * Supports:
 * - Automatic retry on invalid JSON
 * - JSON repair for malformed output
 * - Procedural fallback when AI model is unavailable
 */

import type { BlueprintAIOutput } from "./schema";
import type { Blueprint } from "@/blueprint/types/blueprint";
import { validateAndClean } from "./validator";
import { parseAIOutputToBlueprint } from "./parser";
import { generateCommandsFromBlueprint } from "./command-generator";
import { renderCommandsToCanvas } from "@/services/canvas/renderer";
import { pipelineLogger } from "./logger";
import { generateProceduralBlueprint } from "@/blueprint/engine/procedural-generator";
import { createBlueprint } from "@/blueprint/factory/blueprint-factory";
import type { PlacedRoom } from "@/blueprint/engine/layout-engine/placement-algorithm";

export interface PipelineInput {
  prompt?: string;
  plotWidth: number;
  plotHeight: number;
  bedrooms: number;
  bathrooms: number;
  floors: number;
  buildingType: string;
  style: string;
  variant?: string;
}

export interface PipelineResult {
  success: boolean;
  blueprint: Blueprint | null;
  wrappedBlueprint: any | null;
  elements: any[];
  source: "ai" | "procedural";
  error?: string;
}

export async function runPipeline(input: PipelineInput): Promise<PipelineResult> {
  const endTimer = pipelineLogger.stageStart("pipeline");

  pipelineLogger.info("pipeline", "Pipeline started", {
    prompt: input.prompt?.slice(0, 100),
    plot: `${input.plotWidth}x${input.plotHeight}`,
    bedrooms: input.bedrooms,
  });

  if (input.prompt && input.prompt.trim().length > 5) {
    try {
      const aiResult = await runAIPipeline(input);
      if (aiResult.success) {
        pipelineLogger.info("pipeline", "AI pipeline succeeded", {
          source: "ai",
          rooms: aiResult.blueprint?.rooms.length,
          duration: endTimer(),
        });
        return aiResult;
      }
      pipelineLogger.warn("pipeline", "AI pipeline failed, falling back to procedural", {
        error: aiResult.error,
      });
    } catch (err: any) {
      pipelineLogger.warn("pipeline", "AI pipeline error, falling back to procedural", {
        error: err?.message,
      });
    }
  }

  const procResult = runProceduralPipeline(input);
  pipelineLogger.info("pipeline", "Procedural pipeline completed", {
    source: "procedural",
    rooms: procResult.blueprint?.rooms.length,
    duration: endTimer(),
  });
  return procResult;
}

async function runAIPipeline(input: PipelineInput): Promise<PipelineResult> {
  const endTimer = pipelineLogger.stageStart("ai");

  let rawOutput: string;
  try {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const response = await fetch(`${API_BASE}/api/v1/blueprint-ai/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: input.prompt,
        max_tokens: 2048,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();
    rawOutput = JSON.stringify(data.blueprint);
    pipelineLogger.info("ai", "Raw AI output received", {
      length: rawOutput.length,
    }, endTimer());
  } catch (err: any) {
    pipelineLogger.error("ai", "AI inference failed", err?.message, endTimer());
    return { success: false, blueprint: null, wrappedBlueprint: null, elements: [], source: "ai", error: err?.message };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawOutput);
  } catch {
    pipelineLogger.warn("ai", "JSON parse failed, attempting repair");
    parsed = attemptJSONRepair(rawOutput);
    if (!parsed) {
      return { success: false, blueprint: null, wrappedBlueprint: null, elements: [], source: "ai", error: "Invalid JSON from model" };
    }
  }

  const { data, result } = validateAndClean(parsed);
  if (!data) {
    pipelineLogger.error("validator", "Validation failed", result.errors);
    return { success: false, blueprint: null, wrappedBlueprint: null, elements: [], source: "ai", error: result.errors.join("; ") };
  }

  pipelineLogger.info("validator", "Validation passed", {
    rooms: data.rooms.length,
    doors: data.doors.length,
    windows: data.windows.length,
  });

  const blueprint = parseAIOutputToBlueprint(data);
  pipelineLogger.info("parser", "Parsed to internal Blueprint", {
    rooms: blueprint.rooms.length,
  });

  const commands = generateCommandsFromBlueprint(blueprint);
  pipelineLogger.info("commands", "Generated commands", {
    count: commands.length,
  });

  const { elements } = renderCommandsToCanvas(commands);
  pipelineLogger.info("renderer", "Rendered to canvas", {
    elements: elements.length,
  });

  const wrappedBlueprint = wrapForStore(blueprint, input.variant || "A");

  return {
    success: true,
    blueprint,
    wrappedBlueprint,
    elements,
    source: "ai",
  };
}

function runProceduralPipeline(input: PipelineInput): PipelineResult {
  const endTimer = pipelineLogger.stageStart("procedural");

  const procedural = generateProceduralBlueprint({
    plotWidth: input.plotWidth,
    plotHeight: input.plotHeight,
    bedrooms: input.bedrooms,
    bathrooms: input.bathrooms,
    floors: input.floors,
    buildingType: input.buildingType,
    style: input.style,
  });

  const blueprint = createBlueprint(
    procedural.plot.width,
    procedural.plot.height,
    procedural.rooms as PlacedRoom[],
  );

  pipelineLogger.info("procedural", "Generated procedural blueprint", {
    rooms: blueprint.rooms.length,
    doors: blueprint.doors.length,
    windows: blueprint.windows.length,
  });

  const commands = generateCommandsFromBlueprint(blueprint);
  pipelineLogger.info("commands", "Generated commands", {
    count: commands.length,
  });

  const { elements } = renderCommandsToCanvas(commands);
  pipelineLogger.info("renderer", "Rendered to canvas", {
    elements: elements.length,
  });

  const wrappedBlueprint = wrapForStore(blueprint, input.variant || "A");

  pipelineLogger.info("procedural", "Pipeline completed", {
    duration: endTimer(),
  });

  return {
    success: true,
    blueprint,
    wrappedBlueprint,
    elements,
    source: "procedural",
  };
}

function wrapForStore(bp: Blueprint, variant: string) {
  return {
    project: {
      name: "My Blueprint",
      description: "",
      building_type: "villa",
      style: "modern",
      date: new Date().toISOString().split("T")[0],
      version: "1.0",
    },
    plot: bp.plot,
    floors: [{ level: 0, name: "Ground Floor", height_ft: 10 }],
    rooms: bp.rooms.map((r) => ({
      id: r.id,
      name: r.name,
      room_type: r.type,
      x: r.x,
      y: r.y,
      width: r.width,
      height: r.height,
      level: 0,
      color_hex: "#FFFFFF",
    })),
    walls: [],
    doors: bp.doors.map((d) => ({
      id: d.id,
      x: d.x,
      y: d.y,
      width: d.width,
      orientation: "horizontal",
      is_main_entrance: false,
    })),
    windows: bp.windows.map((w) => ({
      id: w.id,
      x: w.x,
      y: w.y,
      width: w.width,
      orientation: "horizontal",
    })),
    stairs: [],
    metadata: {
      generated_by: "AI Architect Engine",
      generation_timestamp: new Date().toISOString(),
      engine_version: "3.0",
      variant,
      validation_status: "valid" as const,
      validation_errors: [],
    },
  };
}

function attemptJSONRepair(raw: string): unknown | null {
  let cleaned = raw.trim();

  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim();
  }

  cleaned = cleaned.replace(/,\s*}/g, "}").replace(/,\s*]/g, "]");

  try {
    return JSON.parse(cleaned);
  } catch {
    // Try to extract JSON object
    const objMatch = cleaned.match(/\{[\s\S]*\}/);
    if (objMatch) {
      try {
        return JSON.parse(objMatch[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}
