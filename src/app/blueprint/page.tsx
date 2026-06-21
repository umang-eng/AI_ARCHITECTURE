"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import { PrimaryButton } from "@/components/ui-custom/Buttons";
import { motion, AnimatePresence } from "framer-motion";
import {
  Ruler, Layers, Bed, Bath, Wand2, Loader2, AlertCircle,
  Sparkles, Download, Code, ChevronDown, ChevronUp,
  Image as ImageIcon, Settings2, Undo, Redo, RotateCcw, Trash2
} from "lucide-react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { useBlueprintStore } from "@/store/blueprint-store";
import { runPipeline } from "@/services/blueprint/pipeline";
import { generateCommandsFromBlueprint } from "@/services/blueprint/command-generator";
import { renderCommandsToCanvas } from "@/services/canvas/renderer";
import type { BuildingType, ArchitecturalStyle } from "@/types/blueprint-schema";
import type { BlueprintSchema } from "@/types/blueprint-schema";

// Vision Intelligence Imports
import { VisionPipeline } from "@/vision/engine/vision-pipeline";
import { LayoutAnalyzer } from "@/vision/analyzers/layout-analyzer";
import { FurnitureRecommendationEngine } from "@/vision/analyzers/furniture-recommendation";
import { RenovationAnalyzer } from "@/vision/analyzers/renovation-analyzer";
import { VisionHistory, VisionRunHistoryEntry } from "@/vision/history/vision-history";
import { VisionVersionStore } from "@/vision/versioning/vision-version-store";
import type { VisionAnalysisResult } from "@/vision/types";

const BlueprintCanvas = dynamic(() => import("@/components/blueprint/BlueprintCanvas"), { ssr: false });

const BUILDING_TYPES: { value: BuildingType; label: string }[] = [
  { value: "villa", label: "Villa" },
  { value: "house", label: "House" },
  { value: "duplex", label: "Duplex" },
  { value: "apartment", label: "Apt" },
  { value: "office", label: "Office" },
  { value: "commercial", label: "Commercial" },
  { value: "shop", label: "Shop" },
];

const STYLES: { value: ArchitecturalStyle; label: string }[] = [
  { value: "modern", label: "Modern" },
  { value: "minimalist", label: "Minimal" },
  { value: "industrial", label: "Industrial" },
  { value: "contemporary", label: "Contemp" },
  { value: "traditional", label: "Traditional" },
  { value: "mediterranean", label: "Mediterr" },
  { value: "victorian", label: "Victorian" },
];

const VARIANTS = ["A", "B", "C", "D", "E"];

const EXAMPLE_PROMPTS = [
  "Modern villa with 4 bedrooms, pool, garden",
  "Traditional house, large kitchen",
  "Minimalist office with meeting rooms",
];

// Import renderer
import { VisionCanvasRenderer } from "@/vision/renderers/vision-canvas-renderer";

export default function BlueprintPage() {
  const store = useBlueprintStore();
  const [showVersions, setShowVersions] = useState(false);
  const [showSpecs, setShowSpecs] = useState(true);

  // Vision states
  const [isAnalyzingVision, setIsAnalyzingVision] = useState(false);
  const [visionResult, setVisionResult] = useState<VisionAnalysisResult | null>(null);
  const [visionHistory, setVisionHistory] = useState<VisionRunHistoryEntry[]>([]);
  const [activeTab, setActiveTab] = useState<"metrics" | "upgrades" | "furniture">("metrics");

  const versionStore = useMemo(() => new VisionVersionStore(), []);

  useEffect(() => {
    setVisionHistory(VisionHistory.getRuns());
  }, []);

  const applyVisionState = useCallback((result: VisionAnalysisResult) => {
    // Generate commands and render to canvas elements
    const commands = VisionCanvasRenderer.convertToCommands(result);
    const { elements } = renderCommandsToCanvas(commands);

    // Build BlueprintSchema matching frontend representation
    const bp: BlueprintSchema = {
      project: {
        name: `Vision Plan: ${result.roomType}`,
        description: `Visual extraction from media`,
        building_type: store.buildingType || "house",
        style: store.style || "modern",
        date: new Date().toISOString().split("T")[0],
        version: "1.0",
      },
      plot: {
        width: result.dimensions.width,
        height: result.dimensions.height,
        unit: "ft",
      },
      floors: [{ level: 0, name: "Ground Floor", height_ft: 10 }],
      rooms: (result.rooms || [
        {
          id: "room_main",
          roomType: result.roomType,
          x: 0,
          y: 0,
          dimensions: result.dimensions,
          furniture: [],
          doors: [],
          windows: [],
        },
      ]).map((r: any, idx: number) => ({
        id: r.id || `room_${idx + 1}`,
        name: r.roomType || result.roomType,
        room_type: r.roomType || result.roomType,
        x: r.x || 0,
        y: r.y || 0,
        width: r.dimensions?.width || r.width || result.dimensions.width,
        height: r.dimensions?.height || r.height || result.dimensions.height,
        level: 0,
        color_hex: "#FFFFFF",
      })),
      walls: [],
      doors: result.doors.map((d: any) => ({
        id: d.id,
        x: d.x,
        y: d.y,
        width: d.width || 3.0,
        orientation: d.orientation || "horizontal",
        is_main_entrance: false,
      })),
      windows: result.windows.map((w: any) => ({
        id: w.id,
        x: w.x,
        y: w.y,
        width: w.width || 4.0,
        orientation: w.orientation || "horizontal",
      })),
      stairs: [],
      furniture: result.furniture.map((f: any) => ({
        id: f.id,
        name: f.id,
        type: f.type,
        x: f.x,
        y: f.y,
        width: f.width,
        height: f.height,
        rotation: f.rotation,
        room_id: "room_main",
      })),
      metadata: {
        generated_by: "Vision Intelligence Engine",
        generation_timestamp: new Date().toISOString(),
        engine_version: "4.0",
        variant: "A",
        validation_status: "valid",
        validation_errors: [],
        validation_score: result.layoutScore,
      },
    };

    store.setBlueprint(bp, elements);
    store.addVersion(bp, "A");
  }, [store]);

  const handleMediaChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzingVision(true);
    store.setError(null);
    try {
      const response = await VisionPipeline.analyzeMedia(file, store.style);
      if (response.success && response.result) {
        setVisionResult(response.result);
        versionStore.clear();
        versionStore.pushState(response.result);
        applyVisionState(response.result);

        // Save to history
        const saved = VisionHistory.saveRun(file.name, response.result);
        setVisionHistory(prev => [saved, ...prev.slice(0, 19)]);
      } else {
        store.setError(response.error || "Vision analysis failed.");
      }
    } catch (err: any) {
      store.setError(err?.message || "Vision analysis failed.");
    } finally {
      setIsAnalyzingVision(false);
      // Reset input element
      e.target.value = "";
    }
  }, [store, versionStore, applyVisionState]);

  const handleUndo = useCallback(() => {
    const prev = versionStore.undo();
    if (prev) {
      setVisionResult(prev);
      applyVisionState(prev);
    }
  }, [versionStore, applyVisionState]);

  const handleRedo = useCallback(() => {
    const next = versionStore.redo();
    if (next) {
      setVisionResult(next);
      applyVisionState(next);
    }
  }, [versionStore, applyVisionState]);

  const handleLoadHistory = useCallback((entry: VisionRunHistoryEntry) => {
    setVisionResult(entry.result);
    versionStore.clear();
    versionStore.pushState(entry.result);
    applyVisionState(entry.result);
  }, [versionStore, applyVisionState]);

  const handleGenerate = useCallback(async () => {
    store.setGenerating(true);
    store.setError(null);
    try {
      const result = await runPipeline({
        prompt: store.prompt,
        plotWidth: store.plotWidth,
        plotHeight: store.plotHeight,
        bedrooms: store.bedrooms,
        bathrooms: store.bathrooms,
        floors: store.floors,
        buildingType: store.buildingType,
        style: store.style,
        variant: store.variant,
      });
      if (result.success && result.wrappedBlueprint) {
        store.setBlueprint(result.wrappedBlueprint, result.elements);
        store.addVersion(result.wrappedBlueprint, store.variant);
      } else {
        store.setError(result.error || "Generation failed");
      }
    } catch (err: any) {
      store.setError(err?.message || "Generation failed");
    } finally {
      store.setGenerating(false);
    }
  }, [store]);

  const handleVariantChange = useCallback(async (v: string) => {
    store.setParam("variant", v);
    store.setGenerating(true);
    store.setError(null);
    try {
      const result = await runPipeline({
        prompt: store.prompt,
        plotWidth: store.plotWidth,
        plotHeight: store.plotHeight,
        bedrooms: store.bedrooms,
        bathrooms: store.bathrooms,
        floors: store.floors,
        buildingType: store.buildingType,
        style: store.style,
        variant: v,
      });
      if (result.success && result.wrappedBlueprint) {
        store.setBlueprint(result.wrappedBlueprint, result.elements);
        store.addVersion(result.wrappedBlueprint, v);
      } else {
        store.setError(result.error || "Variant generation failed");
      }
    } catch (err: any) {
      store.setError(err?.message || "Variant generation failed");
    } finally {
      store.setGenerating(false);
    }
  }, [store]);

  const handleExportSVG = useCallback(async () => {
    const exp = (window as any).__blueprintExport;
    if (!exp) return;
    const svg = await exp.exportSVG();
    if (!svg) return;
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${store.blueprint?.project?.name || "blueprint"}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }, [store.blueprint]);

  const handleExportPNG = useCallback(async () => {
    const exp = (window as any).__blueprintExport;
    if (!exp) return;
    const blob = await exp.exportPNG();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${store.blueprint?.project?.name || "blueprint"}.png`;
    a.click();
    URL.revokeObjectURL(url);
  }, [store.blueprint]);

  const handleExportJSON = useCallback(() => {
    if (!store.blueprint) return;
    const json = JSON.stringify(store.blueprint, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${store.blueprint.project.name || "blueprint"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [store.blueprint]);

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-visible bg-[#f8f9fa]">
      {/* ═══ FULL-SCREEN CANVAS ═══ */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence mode="wait">
          {!store.isGenerating && !store.blueprint && !store.error && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center">
              <div className="text-center space-y-4 max-w-md">
                <div className="p-10 rounded-3xl bg-white/80 backdrop-blur border border-border/40 mx-auto w-fit shadow-lg">
                  <Wand2 className="w-16 h-16 text-muted-foreground/20" />
                </div>
                <p className="text-2xl font-bold text-foreground/60">Blueprint Draft Room</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Configure specifications below and click Generate to create a floor plan.
                </p>
              </div>
            </motion.div>
          )}

          {store.isGenerating && (
            <motion.div key="generating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center z-10 bg-white/60 backdrop-blur-sm">
              <div className="text-center space-y-4">
                <div className="w-20 h-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin mx-auto" />
                <p className="text-xl font-bold text-foreground/80">Generating blueprint...</p>
                <p className="text-sm text-muted-foreground">Running layout engine</p>
              </div>
            </motion.div>
          )}

          {store.error && !store.isGenerating && (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center p-6 z-10">
              <div className="text-center max-w-sm">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-red-400" />
                </div>
                <p className="text-lg font-bold mb-2">Generation Failed</p>
                <p className="text-sm text-red-500 font-mono bg-red-50 border border-red-200 rounded-xl p-3 break-all">
                  {store.error}
                </p>
              </div>
            </motion.div>
          )}

          {store.blueprint && !store.isGenerating && (
            <motion.div key="canvas" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0">
              <BlueprintCanvas className="w-full h-full" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 w-[calc(100vw-100px)] max-w-[1100px]">
        <motion.div
          layout
          className="bg-white/90 backdrop-blur-xl rounded-[28px] shadow-[0_22px_50px_rgba(15,23,42,0.06)] border border-slate-200/60 overflow-hidden"
        >
          {/* Specs Header - always visible */}
          <button
            onClick={() => setShowSpecs(!showSpecs)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold text-foreground">Specifications</span>
              {store.blueprint && (
                <span className="text-[10px] text-muted-foreground">
                  — Variant {store.blueprint.metadata.variant}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {store.error && (
                <span className="text-[10px] text-red-500 font-medium">Error</span>
              )}
              {showSpecs ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />}
            </div>
          </button>

          {/* Specs Content - collapsible */}
          <AnimatePresence>
            {showSpecs && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: "auto" }}
                exit={{ height: 0 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 pt-1 border-t border-border/20">
                  {/* Row 1: Type, Style, Plot, Rooms, Generate */}
                  <div className="flex items-end gap-3 flex-wrap">
                    {/* Building Type */}
                    <div className="space-y-1 min-w-[90px]">
                      <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Type</label>
                      <select value={store.buildingType} onChange={(e) => store.setParam("buildingType", e.target.value as BuildingType)}
                        className="w-full bg-sidebar-background/50 border border-border/40 rounded-lg px-2 py-1.5 text-[11px] font-semibold focus:outline-none">
                        {BUILDING_TYPES.map((bt) => (
                          <option key={bt.value} value={bt.value}>{bt.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Style */}
                    <div className="space-y-1 min-w-[90px]">
                      <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Style</label>
                      <select value={store.style} onChange={(e) => store.setParam("style", e.target.value as ArchitecturalStyle)}
                        className="w-full bg-sidebar-background/50 border border-border/40 rounded-lg px-2 py-1.5 text-[11px] font-semibold focus:outline-none">
                        {STYLES.map((s) => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Plot W */}
                    <div className="space-y-1 min-w-[60px]">
                      <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-0.5">
                        <Ruler className="w-2.5 h-2.5" /> W (ft)
                      </label>
                      <input type="number" value={store.plotWidth} onChange={(e) => store.setParam("plotWidth", Number(e.target.value) || 60)}
                        className="w-full bg-sidebar-background/50 border border-border/40 rounded-lg px-2 py-1.5 text-[11px] font-medium focus:outline-none" />
                    </div>

                    {/* Plot H */}
                    <div className="space-y-1 min-w-[60px]">
                      <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">H (ft)</label>
                      <input type="number" value={store.plotHeight} onChange={(e) => store.setParam("plotHeight", Number(e.target.value) || 80)}
                        className="w-full bg-sidebar-background/50 border border-border/40 rounded-lg px-2 py-1.5 text-[11px] font-medium focus:outline-none" />
                    </div>

                    {/* Floors */}
                    <div className="space-y-1 min-w-[50px]">
                      <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-0.5">
                        <Layers className="w-2.5 h-2.5" /> Fl
                      </label>
                      <input type="number" value={store.floors} onChange={(e) => store.setParam("floors", Number(e.target.value) || 1)} min="1"
                        className="w-full bg-sidebar-background/50 border border-border/40 rounded-lg px-2 py-1.5 text-[11px] font-medium" />
                    </div>

                    {/* Beds */}
                    <div className="space-y-1 min-w-[50px]">
                      <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-0.5">
                        <Bed className="w-2.5 h-2.5" /> Beds
                      </label>
                      <input type="number" value={store.bedrooms} onChange={(e) => store.setParam("bedrooms", Number(e.target.value) || 1)} min="1"
                        className="w-full bg-sidebar-background/50 border border-border/40 rounded-lg px-2 py-1.5 text-[11px] font-medium" />
                    </div>

                    {/* Baths */}
                    <div className="space-y-1 min-w-[50px]">
                      <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-0.5">
                        <Bath className="w-2.5 h-2.5" /> Ba
                      </label>
                      <input type="number" value={store.bathrooms} onChange={(e) => store.setParam("bathrooms", Number(e.target.value) || 1)} min="1"
                        className="w-full bg-sidebar-background/50 border border-border/40 rounded-lg px-2 py-1.5 text-[11px] font-medium" />
                    </div>

                    {/* Variant */}
                    <div className="space-y-1 min-w-[100px]">
                      <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Variant</label>
                      <div className="flex gap-0.5">
                        {VARIANTS.map((v) => (
                          <button key={v} type="button" onClick={() => store.setParam("variant", v)}
                            className={cn(
                              "flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all border",
                              store.variant === v
                                ? "bg-primary text-white border-primary shadow-sm"
                                : "bg-white border-border/30 text-muted-foreground hover:border-primary/30"
                            )}>
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Generate */}
                    <PrimaryButton
                      className="h-[40px] px-7 text-[11px] font-bold uppercase tracking-wider flex items-center gap-2 shrink-0 !bg-gradient-to-r !from-indigo-600 !to-violet-600 !text-white rounded-xl shadow-[0_4px_14px_rgba(99,102,241,0.35)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.5)] border-none transition-all duration-300 transform hover:-translate-y-0.5"
                      onClick={handleGenerate}
                      disabled={store.isGenerating}
                    >
                      {store.isGenerating ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-3.5 h-3.5 text-white animate-pulse" />
                          <span>Generate</span>
                        </>
                      )}
                    </PrimaryButton>
                  </div>

                  {/* Row 2: Prompt + Examples */}
                  <div className="mt-2.5 flex items-start gap-3">
                    <div className="flex-1 space-y-1">
                      <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5 text-primary" /> Vision
                      </label>
                      <input
                        type="text"
                        value={store.prompt}
                        onChange={(e) => store.setParam("prompt", e.target.value)}
                        placeholder="Describe your blueprint vision..."
                        className="w-full bg-sidebar-background/50 border border-border/40 rounded-lg px-3 py-1.5 text-[11px] focus:outline-none focus:ring-2 focus:ring-primary/10 font-medium"
                      />
                    </div>
                    <div className="flex gap-1 pt-4 shrink-0">
                      {EXAMPLE_PROMPTS.map((ex, i) => (
                        <button key={i} type="button" onClick={() => store.setParam("prompt", ex)}
                          className="px-2 py-1 rounded-lg bg-sidebar-background/60 hover:bg-primary/5 border border-border/20 hover:border-primary/20 text-[9px] font-bold transition-all text-muted-foreground hover:text-primary whitespace-nowrap">
                          {ex.slice(0, 25)}...
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    <button onClick={handleExportSVG}
                      className="inline-flex w-full justify-center items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-semibold text-slate-700 hover:border-slate-300 hover:bg-white transition-all">
                      <Download className="w-3 h-3" /> Export SVG
                    </button>
                    <button onClick={handleExportPNG}
                      className="inline-flex w-full justify-center items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-semibold text-slate-700 hover:border-slate-300 hover:bg-white transition-all">
                      <ImageIcon className="w-3 h-3" /> Export PNG
                    </button>
                    <button onClick={handleExportJSON}
                      className="inline-flex w-full justify-center items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-semibold text-slate-700 hover:border-slate-300 hover:bg-white transition-all">
                      <Code className="w-3 h-3" /> Export JSON
                    </button>
                  </div>

                  {/* Vision Pipeline Media Upload Row */}
                  <div className="mt-3 border-t border-slate-100 pt-3 flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-[200px]">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        <ImageIcon className="w-3 h-3 text-emerald-500" /> Vision Intelligence Pipeline
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Upload room photos or walkthrough videos to automatically extract layouts & furniture.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <input
                        type="file"
                        id="vision-file-upload"
                        accept="image/*,video/*"
                        onChange={handleMediaChange}
                        className="hidden"
                      />
                      <PrimaryButton
                        onClick={() => document.getElementById("vision-file-upload")?.click()}
                        disabled={isAnalyzingVision || store.isGenerating}
                        className="h-[36px] px-5 text-[11px] font-bold uppercase tracking-wider flex items-center gap-2 !bg-gradient-to-r !from-emerald-600 !to-teal-600 !text-white rounded-xl shadow-[0_4px_12px_rgba(16,185,129,0.2)] hover:shadow-[0_6px_16px_rgba(16,185,129,0.35)] border-none"
                      >
                        {isAnalyzingVision ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                            <span>Analyzing Media...</span>
                          </>
                        ) : (
                          <>
                            <Wand2 className="w-3 h-3 text-white animate-pulse" />
                            <span>Upload Photo/Video</span>
                          </>
                        )}
                      </PrimaryButton>
                    </div>
                  </div>

                  {/* Error */}
                  {store.error && (
                    <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                      className="mt-2 p-2 rounded-lg bg-red-500/5 border border-red-500/20">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-red-600 break-words font-mono">{store.error}</p>
                      </div>
                    </motion.div>
                  )}

                  {/* Version History */}
                  {store.versions.length > 0 && (
                    <div className="mt-2">
                      <button type="button" onClick={() => setShowVersions(!showVersions)}
                        className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground uppercase tracking-widest hover:text-foreground transition-colors">
                        {showVersions ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
                        Versions ({store.versions.length})
                      </button>
                      <AnimatePresence>
                        {showVersions && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden mt-1 flex gap-1 flex-wrap">
                            {store.versions.map((v, i) => (
                              <button key={v.id} type="button"
                                onClick={() => {
                                  const loaded = store.loadVersion(i);
                                  if (loaded) {
                                    const bp = v.blueprint;
                                    const cmds = generateCommandsFromBlueprint({
                                      plot: bp.plot,
                                      rooms: bp.rooms.map((r: any) => ({ id: r.id, name: r.name, type: r.room_type || "generic", x: r.x, y: r.y, width: r.width, height: r.height })),
                                      doors: bp.doors.map((d: any) => ({ id: d.id, x: d.x, y: d.y, width: d.width })),
                                      windows: bp.windows.map((w: any) => ({ id: w.id, x: w.x, y: w.y, width: w.width })),
                                    });
                                    const { elements } = renderCommandsToCanvas(cmds);
                                    store.setBlueprint(v.blueprint, elements);
                                  }
                                }}
                                className={cn(
                                  "px-2 py-1 rounded-lg text-[9px] font-bold transition-all border",
                                  i === store.currentVersionIndex
                                    ? "bg-primary/10 border-primary/20 text-primary"
                                    : "bg-white border-border/20 text-muted-foreground hover:bg-sidebar-background"
                                  )}>
                                  V{i + 1} {v.variant}
                                </button>
                              ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* ═══ RIGHT-HAND VISION ANALYSIS PANEL ═══ */}
      <AnimatePresence>
        {visionResult && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="fixed top-4 right-4 z-30 w-[350px] max-h-[calc(100vh-100px)] overflow-y-auto bg-white/95 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-5 shadow-[0_20px_40px_rgba(15,23,42,0.08)] flex flex-col gap-4 font-sans text-slate-800"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Vision Diagnostics</span>
                <h3 className="text-sm font-extrabold text-slate-900">
                  {visionResult.roomType === "multi_room"
                    ? "Multi-Room Floor Plan"
                    : `${visionResult.roomType.replace("_", " ").toUpperCase()}`}
                </h3>
              </div>
              <button
                onClick={() => setVisionResult(null)}
                className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500"
              >
                ×
              </button>
            </div>

            {/* Area & Score Summary */}
            <div className="bg-slate-50/80 rounded-2xl p-3 border border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase">Estimated Size</span>
                <p className="text-xs font-bold text-slate-700">
                  {visionResult.dimensions.width}' x {visionResult.dimensions.height}'
                  <span className="text-[10px] font-medium text-slate-500">
                    {" "}({Math.round(visionResult.dimensions.width * visionResult.dimensions.height)} sq ft)
                  </span>
                </p>
              </div>

              <div className="text-right">
                <span className="text-[9px] font-bold text-slate-400 uppercase">Layout Quality</span>
                <p className="text-sm font-extrabold text-emerald-600">
                  {visionResult.layoutScore}/100
                </p>
              </div>
            </div>

            {/* Undo/Redo & History Quick Actions */}
            <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-2">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleUndo}
                  disabled={!versionStore.canUndo}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-50 disabled:hover:bg-transparent"
                >
                  <Undo className="w-3.5 h-3.5" /> Undo
                </button>
                <button
                  onClick={handleRedo}
                  disabled={!versionStore.canRedo}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-50 disabled:hover:bg-transparent"
                >
                  <Redo className="w-3.5 h-3.5" /> Redo
                </button>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">History State</span>
            </div>

            {/* Diagnostics Tabs */}
            <div className="flex border-b border-slate-100 pb-1">
              {(["metrics", "upgrades", "furniture"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "flex-1 pb-1.5 text-[10px] font-bold uppercase tracking-wider border-b-2 text-center transition-all",
                    activeTab === tab
                      ? "border-emerald-600 text-emerald-600"
                      : "border-transparent text-slate-400 hover:text-slate-600"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto max-h-[300px] text-xs space-y-3 pr-1">
              {activeTab === "metrics" && (
                <div className="space-y-3">
                  {/* Subscores */}
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block font-semibold uppercase">Circulation</span>
                      <span className="text-slate-700 font-bold text-xs">{LayoutAnalyzer.analyze(visionResult).subScores.circulation}%</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block font-semibold uppercase">Daylight</span>
                      <span className="text-slate-700 font-bold text-xs">{LayoutAnalyzer.analyze(visionResult).subScores.daylight}%</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block font-semibold uppercase">Utilization</span>
                      <span className="text-slate-700 font-bold text-xs">{LayoutAnalyzer.analyze(visionResult).subScores.spaceUtilization}%</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block font-semibold uppercase">Proportions</span>
                      <span className="text-slate-700 font-bold text-xs">{LayoutAnalyzer.analyze(visionResult).subScores.aspectRatio}%</span>
                    </div>
                  </div>

                  {/* Critiques */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Layout Critiques</span>
                    {LayoutAnalyzer.analyze(visionResult).critiques.map((c, i) => (
                      <div key={i} className="flex gap-1.5 items-start bg-amber-500/5 border border-amber-500/10 p-2.5 rounded-xl">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <span className="text-slate-600 text-[11px] leading-relaxed">{c}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "upgrades" && (
                <div className="space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Renovation Suggestions</span>
                  {RenovationAnalyzer.generateSuggestions(visionResult, store.style).map((s) => (
                    <div key={s.id} className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-200 text-slate-600">{s.category}</span>
                        <span className="text-[9px] font-bold text-emerald-600">{s.costEstimate}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed font-medium">{s.description}</p>
                      <div className="text-[9px] font-semibold text-slate-400">Impact: <span className="text-slate-600">{s.impact}</span></div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "furniture" && (
                <div className="space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Missing Recommendations</span>
                  {FurnitureRecommendationEngine.getRecommendations(visionResult).length === 0 ? (
                    <p className="text-[10px] text-slate-400 font-medium">All essential furniture elements are present!</p>
                  ) : (
                    FurnitureRecommendationEngine.getRecommendations(visionResult).map((rec) => (
                      <div key={rec.id} className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-700 capitalize">{rec.furnitureType.replace("_", " ")}</span>
                          <span className={cn(
                            "text-[8px] font-bold uppercase px-1.5 py-0.5 rounded",
                            rec.priority === "essential"
                              ? "bg-red-500/10 text-red-600"
                              : rec.priority === "recommended"
                                ? "bg-amber-500/10 text-amber-600"
                                : "bg-slate-200 text-slate-600"
                          )}>
                            {rec.priority}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-relaxed">{rec.reason}</p>
                        <p className="text-[9px] text-slate-400">Sizing template: {rec.dimensions.width}' x {rec.dimensions.height}'</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Vision Runs History */}
            {visionHistory.length > 0 && (
              <div className="border-t border-slate-100 pt-3">
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5 mb-2">
                  <RotateCcw className="w-3 h-3" /> Recent Vision Runs ({visionHistory.length})
                </span>
                <div className="space-y-1 max-h-[80px] overflow-y-auto">
                  {visionHistory.map(entry => (
                    <button
                      key={entry.id}
                      onClick={() => handleLoadHistory(entry)}
                      className="w-full text-left p-1.5 rounded-lg text-[10px] hover:bg-slate-50 border border-transparent hover:border-slate-100 flex justify-between items-center"
                    >
                      <span className="font-medium text-slate-600 truncate max-w-[200px]">{entry.fileName}</span>
                      <span className="text-slate-400 text-[8px]">{new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
