/**
 * Blueprint Pipeline — the complete prompt → AI → JSON → commands → canvas flow.
 */

import type { Blueprint } from "@/blueprint/types/blueprint";
import { validateAndClean } from "./validator";
import { parseAIOutputToBlueprint } from "./parser";
import { generateCommandsFromBlueprint } from "./command-generator";
import { renderCommandsToCanvas } from "@/services/canvas/renderer";
import { pipelineLogger } from "./logger";
import { generateProceduralBlueprint } from "@/blueprint/engine/procedural-generator";
import { createBlueprint } from "@/blueprint/factory/blueprint-factory";
import { validateBlueprint, ValidationReport } from "@/blueprint/validators/blueprint-validator";
import { autoRepairLayout } from "@/blueprint/repair/auto-repair-engine";
import { addHistoryEntry } from "@/blueprint/history/generation-history";
import { computeBlueprintAnalytics } from "@/blueprint/analytics/blueprint-analytics";
import type { PlacedRoom } from "@/blueprint/engine/layout-engine/placement-algorithm";
import { generateProceduralFurniture } from "@/furniture/engine/procedural-furniture";

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
  commands: any[];
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
        plot_width: input.plotWidth,
        plot_height: input.plotHeight,
        bedrooms: input.bedrooms,
        bathrooms: input.bathrooms,
        floors: input.floors,
        building_type: input.buildingType,
        style: input.style,
        variant: input.variant || "A",
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
    return { success: false, blueprint: null, wrappedBlueprint: null, commands: [], source: "ai", error: err?.message };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawOutput);
  } catch {
    pipelineLogger.warn("ai", "JSON parse failed, attempting repair");
    parsed = attemptJSONRepair(rawOutput);
    if (!parsed) {
      return { success: false, blueprint: null, wrappedBlueprint: null, commands: [], source: "ai", error: "Invalid JSON from model" };
    }
  }

  const { data, result } = validateAndClean(parsed);
  if (!data) {
    pipelineLogger.error("validator", "Validation failed", result.errors);
    return { success: false, blueprint: null, wrappedBlueprint: null, commands: [], source: "ai", error: result.errors.join("; ") };
  }

  const blueprint = parseAIOutputToBlueprint(data);

  // 1. Validate & Auto-Repair the AI-generated layout
  let report = validateBlueprint(blueprint, input.floors);
  if (!report.valid) {
    pipelineLogger.warn("pipeline", "AI blueprint failed constraints. Running Auto-Repair...", report.errors);
    const repairedRooms = autoRepairLayout(blueprint.rooms as any, blueprint.plot.width, blueprint.plot.height);
    const repairedBlueprint = createBlueprint(blueprint.plot.width, blueprint.plot.height, repairedRooms as any);
    
    // Re-verify repaired blueprint
    report = validateBlueprint(repairedBlueprint, input.floors);
    
    // Apply repaired coordinates
    blueprint.rooms = repairedBlueprint.rooms;
    blueprint.doors = repairedBlueprint.doors;
    blueprint.windows = repairedBlueprint.windows;
  }

  // 1.8. Generate Furniture
  const furniture = generateProceduralFurniture(blueprint, input.style);
  blueprint.furniture = furniture;

  // 2. Compute analytics
  const analytics = computeBlueprintAnalytics(blueprint);

  // 3. Save to History for RL training
  addHistoryEntry({
    prompt: input.prompt || "",
    blueprint,
    score: report.score,
    style: input.style,
    buildingType: input.buildingType,
    metadata: {
      plotWidth: input.plotWidth,
      plotHeight: input.plotHeight,
      bedrooms: input.bedrooms,
      bathrooms: input.bathrooms,
      floors: input.floors,
      algorithm: "ai",
      scoreBreakdown: analytics,
    },
  });

  const commands = generateCommandsFromBlueprint(blueprint);
  const { commands: renderedCommands } = renderCommandsToCanvas(commands);
  const wrappedBlueprint = wrapForStore(blueprint, input.variant || "A", report);

  return {
    success: true,
    blueprint,
    wrappedBlueprint,
    commands: renderedCommands,
    source: "ai",
  };
}

function runProceduralPipeline(input: PipelineInput): PipelineResult {
  const endTimer = pipelineLogger.stageStart("procedural");

  // 1. Multi-Layout Candidate Generation & Evaluation (Module 5)
  const procedural = generateProceduralBlueprint({
    plotWidth: input.plotWidth,
    plotHeight: input.plotHeight,
    bedrooms: input.bedrooms,
    bathrooms: input.bathrooms,
    floors: input.floors,
    buildingType: input.buildingType,
    style: input.style,
    prompt: input.prompt,
  });

  const blueprint = createBlueprint(
    procedural.plot.width,
    procedural.plot.height,
    procedural.rooms as PlacedRoom[],
  );

  // 2. Validate final best layout
  const report = validateBlueprint(blueprint, input.floors);
  
  // 2.5. Generate Furniture
  const furniture = generateProceduralFurniture(blueprint, input.style);
  blueprint.furniture = furniture;

  // 3. Compute analytics
  const analytics = computeBlueprintAnalytics(blueprint);

  // 4. Save to History
  addHistoryEntry({
    prompt: input.prompt || "Procedural Generation",
    blueprint,
    score: report.score,
    style: input.style,
    buildingType: input.buildingType,
    metadata: {
      plotWidth: input.plotWidth,
      plotHeight: input.plotHeight,
      bedrooms: input.bedrooms,
      bathrooms: input.bathrooms,
      floors: input.floors,
      algorithm: "procedural",
      scoreBreakdown: analytics,
    },
  });

  const commands = generateCommandsFromBlueprint(blueprint);
  const { commands: renderedCommands } = renderCommandsToCanvas(commands);
  const wrappedBlueprint = wrapForStore(blueprint, input.variant || "A", report);

  return {
    success: true,
    blueprint,
    wrappedBlueprint,
    commands: renderedCommands,
    source: "procedural",
  };
}

function wrapForStore(bp: Blueprint, variant: string, report: ValidationReport) {
  // Map staircase rooms to stairs list in Schema
  const stairs = bp.rooms
    .filter((r) => r.type === "staircase")
    .map((s) => ({
      id: s.id,
      x: s.x,
      y: s.y,
      width: s.width,
      height: s.height,
      direction: "up" as const,
    }));

  return {
    project: {
      name: "My Blueprint",
      description: "",
      building_type: "villa",
      style: "modern",
      date: new Date().toISOString().split("T")[0],
      version: "1.0",
    },
    plot: {
      width: bp.plot.width,
      height: bp.plot.height,
      unit: "ft" as const,
    },
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
      orientation: "horizontal" as const,
      is_main_entrance: false,
    })),
    windows: bp.windows.map((w) => ({
      id: w.id,
      x: w.x,
      y: w.y,
      width: w.width,
      orientation: "horizontal" as const,
    })),
    stairs,
    furniture: bp.furniture ? bp.furniture.map((f) => ({
      id: f.id,
      name: f.name || f.type.toUpperCase(),
      type: f.type,
      x: f.x,
      y: f.y,
      width: f.width,
      height: f.height,
      rotation: f.rotation,
      color_hex: f.color_hex,
      room_id: f.roomId
    })) : [],
    metadata: {
      generated_by: "AI Architect Engine V2",
      generation_timestamp: new Date().toISOString(),
      engine_version: "2.0",
      variant,
      validation_status: report.valid ? ("valid" as const) : ("invalid" as const),
      validation_errors: report.errors,
      validation_score: report.score,
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
