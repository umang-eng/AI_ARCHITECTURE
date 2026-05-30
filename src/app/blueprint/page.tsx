"use client";

import React, { useState, useCallback } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { Card } from "@/components/ui-custom/Card";
import { PrimaryButton } from "@/components/ui-custom/Buttons";
import { motion, AnimatePresence } from "framer-motion";
import {
  Ruler, Layers, Bed, Bath, Wand2, Loader2, AlertCircle,
  Sparkles, Car, Trees, Type, Image as ImageIcon,
  Download, FileText, Code, ChevronDown,
} from "lucide-react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { useBlueprintStore } from "@/store/blueprint-store";
import { generateLayout } from "@/lib/layout-engine";
import { validateBlueprint } from "@/lib/validation-engine";
import { schemaToCommands } from "@/lib/command-engine";
import { commandsToExcalidrawElements } from "@/lib/excalidraw-renderer";
import type { BuildingType, ArchitecturalStyle } from "@/types/blueprint-schema";

const BlueprintCanvas = dynamic(() => import("@/components/blueprint/BlueprintCanvas"), { ssr: false });

const BUILDING_TYPES: { value: BuildingType; label: string }[] = [
  { value: "villa", label: "Villa" },
  { value: "house", label: "House" },
  { value: "duplex", label: "Duplex" },
  { value: "apartment", label: "Apartment" },
  { value: "office", label: "Office" },
  { value: "commercial", label: "Commercial" },
  { value: "shop", label: "Shop" },
];

const STYLES: { value: ArchitecturalStyle; label: string }[] = [
  { value: "modern", label: "Modern" },
  { value: "minimalist", label: "Minimalist" },
  { value: "industrial", label: "Industrial" },
  { value: "contemporary", label: "Contemporary" },
  { value: "traditional", label: "Traditional" },
  { value: "mediterranean", label: "Mediterranean" },
  { value: "victorian", label: "Victorian" },
];

const VARIANTS = ["A", "B", "C", "D", "E"];

const EXAMPLE_PROMPTS = [
  "A modern villa with 4 bedrooms, pool, and garden on a 60x80 plot",
  "Traditional house with large kitchen and spacious living room",
  "Minimalist office with open workspace and meeting rooms",
];

export default function BlueprintPage() {
  const store = useBlueprintStore();
  const [showVersions, setShowVersions] = useState(false);

  const handleGenerate = useCallback(async () => {
    store.setGenerating(true);
    store.setError(null);

    try {
      // 1. Generate layout
      const blueprint = generateLayout({
        plot_width: store.plotWidth,
        plot_height: store.plotHeight,
        bedrooms: store.bedrooms,
        bathrooms: store.bathrooms,
        floors: store.floors,
        building_type: store.buildingType,
        style: store.style,
        variant: store.variant,
        project_name: store.projectName,
      });

      // 2. Validate
      const validation = validateBlueprint(blueprint);
      blueprint.metadata.validation_status = validation.valid ? "valid" : "invalid";
      blueprint.metadata.validation_errors = [
        ...validation.errors.map(e => e.message),
        ...validation.warnings.map(w => w.message),
      ];

      // 3. Convert to commands
      const commands = schemaToCommands(blueprint);

      // 4. Convert to Excalidraw elements
      const elements = commandsToExcalidrawElements(commands);

      // 5. Store
      store.setBlueprint(blueprint, elements);
      store.addVersion(blueprint, store.variant);
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
      const blueprint = generateLayout({
        plot_width: store.plotWidth,
        plot_height: store.plotHeight,
        bedrooms: store.bedrooms,
        bathrooms: store.bathrooms,
        floors: store.floors,
        building_type: store.buildingType,
        style: store.style,
        variant: v,
        project_name: store.projectName,
      });

      validateBlueprint(blueprint);
      const commands = schemaToCommands(blueprint);
      const elements = commandsToExcalidrawElements(commands);
      store.setBlueprint(blueprint, elements);
      store.addVersion(blueprint, v);
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
    <PageContainer>
      <SectionHeader
        title="AI Blueprint Generator"
        description="Generate professional architectural blueprints with AI. Describe your vision or configure specifications."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Panel: Form */}
        <div className="lg:col-span-4 space-y-4">
          <Card
            title="Specifications"
            description="Configure building requirements and click Generate."
            className="border-none shadow-premium"
          >
            <div className="mt-4 space-y-4">
              {/* Project Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5 text-primary" /> Project Name
                </label>
                <input
                  type="text"
                  value={store.projectName}
                  onChange={(e) => store.setParam("projectName", e.target.value)}
                  className="w-full bg-sidebar-background/50 border border-border/40 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-4 focus:ring-primary/5 font-medium"
                />
              </div>

              {/* Prompt */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" /> Describe Your Vision
                </label>
                <textarea
                  value={store.prompt}
                  onChange={(e) => store.setParam("prompt", e.target.value)}
                  placeholder="E.g., A modern villa with pool..."
                  className="w-full bg-sidebar-background/50 border border-border/40 rounded-xl p-3 text-xs focus:outline-none focus:ring-4 focus:ring-primary/5 resize-none min-h-[60px] font-medium"
                />
                <div className="flex flex-wrap gap-1">
                  {EXAMPLE_PROMPTS.map((ex, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => store.setParam("prompt", ex)}
                      className="px-2 py-1 rounded-lg bg-sidebar-background hover:bg-primary/5 border border-border/30 hover:border-primary/20 text-[10px] font-bold transition-all text-muted-foreground hover:text-primary"
                    >
                      {ex.slice(0, 30)}...
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-px bg-border/40" />

              {/* Building Type + Style */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                    <Layers className="w-3 h-3" /> Type
                  </label>
                  <select
                    value={store.buildingType}
                    onChange={(e) => store.setParam("buildingType", e.target.value as BuildingType)}
                    className="w-full bg-sidebar-background/50 border border-border/40 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                  >
                    {BUILDING_TYPES.map((bt) => (
                      <option key={bt.value} value={bt.value}>{bt.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Style
                  </label>
                  <select
                    value={store.style}
                    onChange={(e) => store.setParam("style", e.target.value as ArchitecturalStyle)}
                    className="w-full bg-sidebar-background/50 border border-border/40 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                  >
                    {STYLES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Plot Dimensions */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                  <Ruler className="w-3.5 h-3.5" /> Plot (ft)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground">W</span>
                    <input
                      type="number"
                      value={store.plotWidth}
                      onChange={(e) => store.setParam("plotWidth", Number(e.target.value) || 60)}
                      className="w-full bg-sidebar-background/50 border border-border/40 rounded-xl pl-7 pr-2 py-2 text-xs font-medium focus:outline-none"
                    />
                  </div>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground">H</span>
                    <input
                      type="number"
                      value={store.plotHeight}
                      onChange={(e) => store.setParam("plotHeight", Number(e.target.value) || 80)}
                      className="w-full bg-sidebar-background/50 border border-border/40 rounded-xl pl-7 pr-2 py-2 text-xs font-medium focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Rooms */}
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1"><Layers className="w-3 h-3" /> Floors</label>
                  <input type="number" value={store.floors} onChange={(e) => store.setParam("floors", Number(e.target.value) || 1)} min="1"
                    className="w-full bg-sidebar-background/50 border border-border/40 rounded-xl px-2 py-2 text-xs font-medium" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1"><Bed className="w-3 h-3" /> Beds</label>
                  <input type="number" value={store.bedrooms} onChange={(e) => store.setParam("bedrooms", Number(e.target.value) || 1)} min="1"
                    className="w-full bg-sidebar-background/50 border border-border/40 rounded-xl px-2 py-2 text-xs font-medium" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1"><Bath className="w-3 h-3" /> Baths</label>
                  <input type="number" value={store.bathrooms} onChange={(e) => store.setParam("bathrooms", Number(e.target.value) || 1)} min="1"
                    className="w-full bg-sidebar-background/50 border border-border/40 rounded-xl px-2 py-2 text-xs font-medium" />
                </div>
              </div>

              {/* Variant Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Layout Variant</label>
                <div className="flex gap-1.5">
                  {VARIANTS.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => store.setParam("variant", v)}
                      className={cn(
                        "flex-1 py-2 rounded-xl text-xs font-bold transition-all border",
                        store.variant === v
                          ? "bg-primary text-white border-primary shadow-sm"
                          : "bg-white border-border/30 text-muted-foreground hover:border-primary/30"
                      )}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Error */}
              {store.error && (
                <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-xl bg-red-500/5 border border-red-500/20">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-red-600 break-words font-mono">{store.error}</p>
                  </div>
                </motion.div>
              )}

              {/* Generate Button */}
              <PrimaryButton
                className="w-full h-12 text-sm flex items-center justify-center gap-2"
                onClick={handleGenerate}
                disabled={store.isGenerating}
              >
                {store.isGenerating ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                ) : (
                  <><Wand2 className="w-4 h-4" /> Generate Blueprint</>
                )}
              </PrimaryButton>

              {/* Version History */}
              {store.versions.length > 0 && (
                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => setShowVersions(!showVersions)}
                    className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest hover:text-foreground transition-colors"
                  >
                    <ChevronDown className={cn("w-3 h-3 transition-transform", showVersions && "rotate-180")} />
                    Version History ({store.versions.length})
                  </button>
                  <AnimatePresence>
                    {showVersions && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden space-y-1"
                      >
                        {store.versions.map((v, i) => (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => {
                              const loaded = store.loadVersion(i);
                              if (loaded) {
                                const cmds = schemaToCommands(v.blueprint);
                                const elems = commandsToExcalidrawElements(cmds);
                                store.setBlueprint(v.blueprint, elems);
                              }
                            }}
                            className={cn(
                              "w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all border",
                              i === store.currentVersionIndex
                                ? "bg-primary/5 border-primary/20 text-primary"
                                : "bg-white border-border/20 text-muted-foreground hover:bg-sidebar-background"
                            )}
                          >
                            <span className="font-bold">V{i + 1}</span> — Variant {v.variant} — {new Date(v.timestamp).toLocaleTimeString()}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Panel: Canvas */}
        <div className="lg:col-span-8">
          <Card noPadding className="min-h-[700px] flex flex-col border-none shadow-premium bg-white">
            {/* Toolbar */}
            <div className="p-3 border-b border-border/40 bg-white/80 backdrop-blur-md flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/5 text-primary">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-tight">
                    {store.blueprint ? "Blueprint Canvas" : "Drafting Canvas"}
                  </h3>
                  <p className="text-[10px] text-muted-foreground">
                    {store.blueprint
                      ? `${store.blueprint.rooms.length} rooms · ${store.blueprint.walls.length} walls · Variant ${store.blueprint.metadata.variant}`
                      : "Configure and generate a blueprint"}
                  </p>
                </div>
              </div>

              {store.blueprint && (
                <div className="flex items-center gap-1.5">
                  {/* Variant Switcher */}
                  <div className="flex bg-sidebar-background border border-border/40 p-0.5 rounded-lg gap-0.5">
                    {VARIANTS.map((v) => (
                      <button key={v} onClick={() => handleVariantChange(v)}
                        className={cn(
                          "px-2 py-1 rounded-md text-[10px] font-bold transition-all",
                          store.variant === v ? "bg-emerald-500 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
                        )}>
                        {v}
                      </button>
                    ))}
                  </div>

                  <div className="h-4 w-px bg-border/40" />

                  {/* Export Buttons */}
                  <button onClick={handleExportSVG}
                    className="flex items-center gap-1 px-2.5 h-7 rounded-lg border border-border/30 bg-white text-[10px] font-bold hover:bg-sidebar-background transition-all">
                    <Download className="w-3 h-3" /> SVG
                  </button>
                  <button onClick={handleExportPNG}
                    className="flex items-center gap-1 px-2.5 h-7 rounded-lg border border-border/30 bg-white text-[10px] font-bold hover:bg-sidebar-background transition-all">
                    <ImageIcon className="w-3 h-3" /> PNG
                  </button>
                  <button onClick={handleExportJSON}
                    className="flex items-center gap-1 px-2.5 h-7 rounded-lg border border-border/30 bg-white text-[10px] font-bold hover:bg-sidebar-background transition-all">
                    <Code className="w-3 h-3" /> JSON
                  </button>
                </div>
              )}
            </div>

            {/* Canvas Area */}
            <div className="flex-1 bg-[#f8f9fa] relative overflow-hidden">
              <AnimatePresence mode="wait">
                {!store.isGenerating && !store.blueprint && !store.error && (
                  <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center space-y-3 max-w-xs">
                      <div className="p-8 rounded-2xl bg-white border border-border/40 mx-auto w-fit shadow-sm">
                        <Wand2 className="w-12 h-12 text-muted-foreground/30" />
                      </div>
                      <p className="text-lg font-bold text-foreground/70">Blueprint Draft Room</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Configure specifications on the left and click "Generate Blueprint" to create a professional floor plan.
                      </p>
                    </div>
                  </motion.div>
                )}

                {store.isGenerating && (
                  <motion.div key="generating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center z-10 bg-white/80 backdrop-blur-sm">
                    <div className="text-center space-y-3">
                      <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin mx-auto" />
                      <p className="text-base font-bold text-foreground/80">Generating blueprint...</p>
                      <p className="text-xs text-muted-foreground">Running layout engine</p>
                    </div>
                  </motion.div>
                )}

                {store.error && !store.isGenerating && (
                  <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center p-6 z-10">
                    <div className="text-center max-w-sm">
                      <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-3">
                        <AlertCircle className="w-7 h-7 text-red-400" />
                      </div>
                      <p className="text-base font-bold mb-2">Generation Failed</p>
                      <p className="text-xs text-red-500 font-mono bg-red-50 border border-red-200 rounded-xl p-3 break-all">
                        {store.error}
                      </p>
                    </div>
                  </motion.div>
                )}

                {store.blueprint && !store.isGenerating && (
                  <motion.div key="canvas" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="w-full h-full">
                    <BlueprintCanvas className="w-full h-full" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Status Bar */}
            {store.blueprint && (
              <div className="px-3 py-1.5 border-t border-border/20 bg-white flex items-center justify-between text-[9px] font-mono text-muted-foreground">
                <span>Variant: {store.blueprint.metadata.variant}</span>
                <span>{store.blueprint.rooms.length} rooms</span>
                <span>{store.blueprint.plot.width}×{store.blueprint.plot.height} ft</span>
                <span>v{store.blueprint.metadata.engine_version}</span>
                <span className={store.blueprint.metadata.validation_status === "valid" ? "text-emerald-600" : "text-amber-600"}>
                  {store.blueprint.metadata.validation_status.toUpperCase()}
                </span>
              </div>
            )}
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
