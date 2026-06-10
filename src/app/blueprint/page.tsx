"use client";

import React, { useState, useCallback } from "react";
import { PrimaryButton } from "@/components/ui-custom/Buttons";
import { motion, AnimatePresence } from "framer-motion";
import {
  Ruler, Layers, Bed, Bath, Wand2, Loader2, AlertCircle,
  Sparkles, Download, Code, ChevronDown, ChevronUp,
  Image as ImageIcon, Settings2,
} from "lucide-react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { useBlueprintStore } from "@/store/blueprint-store";
import { runPipeline } from "@/services/blueprint/pipeline";
import { generateCommandsFromBlueprint } from "@/services/blueprint/command-generator";
import { renderCommandsToCanvas } from "@/services/canvas/renderer";
import type { BuildingType, ArchitecturalStyle } from "@/types/blueprint-schema";
import type { BlueprintSchema } from "@/types/blueprint-schema";

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

export default function BlueprintPage() {
  const store = useBlueprintStore();
  const [showVersions, setShowVersions] = useState(false);
  const [showSpecs, setShowSpecs] = useState(true);

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
                      className="h-[34px] px-5 text-xs flex items-center gap-1.5 shrink-0"
                      onClick={handleGenerate}
                      disabled={store.isGenerating}
                    >
                      {store.isGenerating ? (
                        <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Gen...</>
                      ) : (
                        <><Wand2 className="w-3.5 h-3.5" /> Generate</>
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
    </div>
  );
}
