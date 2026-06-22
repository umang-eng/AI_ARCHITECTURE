"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useInteriorStore } from "@/interior/versioning/interior-store";
import { useReconstructionStore } from "@/reconstruction/versioning/reconstruction-store";
import { InteriorPipeline } from "@/interior/engine/interior-pipeline";
import { PageContainer } from "@/components/layout/PageContainer";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { Card } from "@/components/ui-custom/Card";
import { PrimaryButton } from "@/components/ui-custom/Buttons";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sofa,
  Bed,
  UtensilsCrossed,
  Bath,
  Briefcase,
  Wand2,
  Loader2,
  Sparkles,
  Layers,
  CheckCircle,
  Lightbulb,
  Palette,
  Coins,
  Activity,
  Maximize2,
  Volume2,
  Shield,
  FileText,
  Hammer
} from "lucide-react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";

// Load 3D Viewer dynamically to support SSR safely
const ThreeDInteriorViewer = dynamic(
  () => import("@/components/interior/ThreeDInteriorViewer"),
  { ssr: false }
);

const stylesList = [
  { id: "modern", name: "Modern", description: "Super white surfaces & engineered oak planks" },
  { id: "luxury", name: "Luxury", description: "Carrara white marble & champagne gold accents" },
  { id: "minimalist", name: "Minimalist", description: "Uncluttered simplicity & clean muted lines" },
  { id: "scandinavian", name: "Scandinavian", description: "Light, functional & organic warm ash wood" },
  { id: "industrial", name: "Industrial", description: "Exposed brick walls & dark polished metals" },
  { id: "traditional", name: "Traditional", description: "Rich walnut wood & warm antique cream hues" },
  { id: "japanese", name: "Japanese", description: "Shoji-paper panels & straw tatami textures" },
  { id: "contemporary", name: "Contemporary", description: "Ebony maple flooring & vibrant statement tones" }
];

const budgetGrades = [
  { id: "economy", name: "Economy", desc: "Basic laminate & low spec reflections" },
  { id: "standard", name: "Standard", desc: "Ergonomic materials & standard fixtures" },
  { id: "premium", name: "Premium", desc: "Premium select imports & highly polished PBR" }
];

const roomPresets = [
  { id: "bedroom", name: "Bedroom Preset", icon: Bed, w: 14.0, h: 16.0 },
  { id: "living_room", name: "Living Room Preset", icon: Sofa, w: 18.0, h: 20.0 },
  { id: "kitchen", name: "Kitchen Preset", icon: UtensilsCrossed, w: 12.0, h: 15.0 },
  { id: "bathroom", name: "Bathroom Preset", icon: Bath, w: 8.0, h: 10.0 },
  { id: "office", name: "Office Preset", icon: Briefcase, w: 12.0, h: 12.0 }
];

const getSimulatedBudgetDetails = (width: number, height: number, budget: string, materialCount: number, lightCount: number) => {
  const sqFt = width * height;
  let multiplier = 50;
  if (budget === "economy") multiplier = 25;
  if (budget === "premium") multiplier = 120;

  const flooringCost = Math.round(sqFt * multiplier);
  const wallCost = Math.round(sqFt * 2.5 * (multiplier * 0.15));
  const lightingCost = lightCount * (budget === "economy" ? 75 : budget === "premium" ? 450 : 200);
  const totalCost = flooringCost + wallCost + lightingCost;

  return {
    sqFt: Math.round(sqFt),
    flooringCost,
    wallCost,
    lightingCost,
    totalCost
  };
};

export default function InteriorDesignPage() {
  const interiorStore = useInteriorStore();
  const reconStore = useReconstructionStore();

  const [activeTab, setActiveTab] = useState<"presets" | "twin">("presets");
  const [selectedPresetId, setSelectedPresetId] = useState("bedroom");
  
  // Custom room dimension edits
  const [customWidth, setCustomWidth] = useState(14.0);
  const [customHeight, setCustomHeight] = useState(16.0);

  // Sync state with stores
  const activeDesign = interiorStore.activeDesign;
  const isProcessing = interiorStore.isProcessing;
  const error = interiorStore.error;

  // Retrieve current active room configuration (presets or digital twin)
  const getActiveRoomDetails = useCallback(() => {
    if (activeTab === "twin" && reconStore.activeJob) {
      const job = reconStore.activeJob;
      const w = job.dimensions?.width || 14.0;
      const h = job.dimensions?.height || 16.0;
      
      // Simulate/derive furniture list from digital twin
      const twinFurniture = [
        { id: "twin_f_1", type: job.roomType.includes("bed") ? "bed" : "sofa", x: w / 2, y: h / 3, width: 6.0, height: 6.5, rotation: 0 },
        { id: "twin_f_2", type: "wardrobe", x: 2.5, y: (3 * h) / 4, width: 5.0, height: 2.2, rotation: 0 }
      ];

      return {
        roomType: job.roomType,
        width: w,
        height: h,
        furniture: twinFurniture
      };
    }

    // Default room preset
    const preset = roomPresets.find(p => p.id === selectedPresetId) || roomPresets[0];
    const w = customWidth || preset.w;
    const h = customHeight || preset.h;

    // Build default items
    let furnitureList = [
      { id: "f_bed", type: "bed", x: w / 2, y: h / 3, width: 6.0, height: 6.5, rotation: 0 },
      { id: "f_nightstand_l", type: "nightstand", x: Math.max(1.5, w / 2 - 4.5), y: h / 3, width: 1.8, height: 1.8, rotation: 0 },
      { id: "f_nightstand_r", type: "nightstand", x: Math.min(w - 1.5, w / 2 + 4.5), y: h / 3, width: 1.8, height: 1.8, rotation: 0 },
      { id: "f_wardrobe", type: "wardrobe", x: 2.5, y: (3 * h) / 4, width: 5.0, height: 2.2, rotation: 0 }
    ];

    if (preset.id === "living_room") {
      furnitureList = [
        { id: "f_sofa", type: "sofa", x: w / 2, y: h / 2.5, width: 8.0, height: 3.5, rotation: 0 },
        { id: "f_tv_stand", type: "tv_stand", x: w / 2, y: h - 1.5, width: 6.0, height: 1.8, rotation: 0 },
        { id: "f_coffee_table", type: "coffee_table", x: w / 2, y: h / 2.5 + 3.5, width: 4.0, height: 2.5, rotation: 0 },
        { id: "f_armchair", type: "armchair", x: Math.max(2.0, w / 2 - 5.5), y: h / 2.5 + 1.0, width: 2.8, height: 2.8, rotation: 45 }
      ];
    } else if (preset.id === "kitchen") {
      furnitureList = [
        { id: "f_counter_l", type: "counter", x: 3.0, y: h / 2, width: 2.5, height: 8.0, rotation: 0 },
        { id: "f_dining_table", type: "dining_table", x: w - 4.0, y: h / 2, width: 4.5, height: 4.5, rotation: 0 },
        { id: "f_refrigerator", type: "refrigerator", x: 1.5, y: h - 2.0, width: 3.0, height: 3.0, rotation: 0 }
      ];
    } else if (preset.id === "bathroom") {
      furnitureList = [
        { id: "f_bathtub", type: "bathtub", x: w / 2, y: h - 2.0, width: 5.5, height: 2.8, rotation: 0 },
        { id: "f_vanity", type: "vanity", x: 2.0, y: 3.0, width: 3.0, height: 2.0, rotation: 0 },
        { id: "f_toilet", type: "toilet", x: w - 2.0, y: 3.0, width: 2.0, height: 2.5, rotation: 0 }
      ];
    } else if (preset.id === "office") {
      furnitureList = [
        { id: "f_desk", type: "desk", x: w / 2, y: h / 2, width: 5.5, height: 3.0, rotation: 0 },
        { id: "f_chair", type: "chair", x: w / 2, y: h / 2 - 2.0, width: 2.2, height: 2.2, rotation: 0 },
        { id: "f_bookshelf", type: "bookshelf", x: 2.0, y: h - 1.5, width: 4.0, height: 1.8, rotation: 0 }
      ];
    }

    return {
      roomType: preset.id,
      width: w,
      height: h,
      furniture: furnitureList
    };
  }, [activeTab, selectedPresetId, customWidth, customHeight, reconStore.activeJob]);

  // Execute pipeline trigger
  const handleSynthesis = useCallback(async () => {
    interiorStore.setProcessing(true);
    interiorStore.setError(null);

    const roomDetails = getActiveRoomDetails();

    try {
      const result = await InteriorPipeline.generateDesign({
        roomType: roomDetails.roomType,
        width: roomDetails.width,
        height: roomDetails.height,
        furniture: roomDetails.furniture,
        style: interiorStore.selectedStyle,
        budget: interiorStore.selectedBudget
      });
      interiorStore.setActiveDesign(result);
    } catch (err: any) {
      interiorStore.setError(err.message || "Failed to synthesis interior design specifications");
    } finally {
      interiorStore.setProcessing(false);
    }
  }, [getActiveRoomDetails, interiorStore]);

  // Trigger design recalculation on preset/style/budget updates
  useEffect(() => {
    handleSynthesis();
  }, [selectedPresetId, interiorStore.selectedStyle, interiorStore.selectedBudget, activeTab]);

  // Handle Preset Selection Change
  const selectPreset = (id: string) => {
    setSelectedPresetId(id);
    const p = roomPresets.find(pr => pr.id === id);
    if (p) {
      setCustomWidth(p.w);
      setCustomHeight(p.h);
    }
  };

  // Cost analysis details
  const roomDetails = getActiveRoomDetails();
  const materialCount = activeDesign?.materialJson?.length || 0;
  const lightCount = activeDesign?.lightingJson?.length || 0;
  
  const budgetBreakdown = getSimulatedBudgetDetails(
    roomDetails.width,
    roomDetails.height,
    interiorStore.selectedBudget,
    materialCount,
    lightCount
  );

  return (
    <PageContainer>
      <SectionHeader
        title="Interior Designer AI"
        description="Overlay styling templates, PBR material maps, and Kelvin light nodes onto 3D spaces."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Controls (lg:col-span-4) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Space Source Card */}
          <Card className="border border-border/40 shadow-sm p-5 space-y-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-primary" /> Space Selection
            </h3>
            
            <div className="grid grid-cols-2 gap-2 bg-sidebar-background/50 p-1 rounded-xl border border-border/30">
              <button
                onClick={() => setActiveTab("presets")}
                className={cn(
                  "py-2 rounded-lg text-xs font-bold transition-all",
                  activeTab === "presets"
                    ? "bg-white text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Room Presets
              </button>
              <button
                disabled={!reconStore.activeJob}
                onClick={() => setActiveTab("twin")}
                className={cn(
                  "py-2 rounded-lg text-xs font-bold transition-all relative flex items-center justify-center gap-1.5",
                  !reconStore.activeJob && "opacity-40 cursor-not-allowed",
                  activeTab === "twin"
                    ? "bg-white text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span>3D Digital Twin</span>
                {reconStore.activeJob && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping absolute top-1 right-2" />
                )}
              </button>
            </div>

            {activeTab === "presets" ? (
              <div className="space-y-3">
                <div className="grid grid-cols-5 gap-2">
                  {roomPresets.map(preset => {
                    const Icon = preset.icon;
                    const isActive = selectedPresetId === preset.id;
                    return (
                      <button
                        key={preset.id}
                        onClick={() => selectPreset(preset.id)}
                        title={preset.name}
                        className={cn(
                          "p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all",
                          isActive
                            ? "bg-primary/5 text-primary border-primary shadow-sm"
                            : "bg-white text-muted-foreground border-border/40 hover:bg-sidebar-background"
                        )}
                      >
                        <Icon className="w-4 h-4" />
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                  <div className="space-y-1">
                    <label className="font-semibold text-muted-foreground">Width (ft)</label>
                    <input
                      type="number"
                      value={customWidth}
                      min="6"
                      max="30"
                      onChange={(e) => setCustomWidth(Number(e.target.value))}
                      className="w-full bg-sidebar-background border border-border/50 rounded-lg p-2 font-bold focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-muted-foreground">Length (ft)</label>
                    <input
                      type="number"
                      value={customHeight}
                      min="6"
                      max="30"
                      onChange={(e) => setCustomHeight(Number(e.target.value))}
                      className="w-full bg-sidebar-background border border-border/50 rounded-lg p-2 font-bold focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-emerald-700">Digital Twin Active</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-800 px-2 py-0.5 rounded-full font-bold uppercase">Synced</span>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Imported walls, floors, and basic spatial boundaries coordinates from active Gaussian Splatting job.
                </p>
                <div className="text-[10px] text-emerald-600 font-bold">
                  Room: {reconStore.activeJob?.roomType.toUpperCase()} ({reconStore.activeJob?.dimensions?.width}x{reconStore.activeJob?.dimensions?.height} ft)
                </div>
              </div>
            )}
          </Card>

          {/* Style Template Selector Card */}
          <Card className="border border-border/40 shadow-sm p-5 space-y-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Palette className="w-3.5 h-3.5 text-primary" /> Architectural Theme
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[280px] overflow-y-auto pr-1">
              {stylesList.map(style => {
                const isActive = interiorStore.selectedStyle === style.id;
                return (
                  <button
                    key={style.id}
                    onClick={() => interiorStore.setSelectedStyle(style.id)}
                    className={cn(
                      "p-3 rounded-xl border text-left transition-all flex flex-col justify-between h-[76px]",
                      isActive
                        ? "bg-primary/5 text-primary border-primary shadow-sm"
                        : "bg-white text-foreground border-border/40 hover:bg-sidebar-background"
                    )}
                  >
                    <span className="text-xs font-bold capitalize">{style.id}</span>
                    <span className="text-[9px] text-muted-foreground leading-snug line-clamp-2">{style.description}</span>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Budget Selector Card */}
          <Card className="border border-border/40 shadow-sm p-5 space-y-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Coins className="w-3.5 h-3.5 text-primary" /> Budget Tier
            </h3>

            <div className="space-y-2">
              {budgetGrades.map(grade => {
                const isActive = interiorStore.selectedBudget === grade.id;
                return (
                  <button
                    key={grade.id}
                    onClick={() => interiorStore.setSelectedBudget(grade.id)}
                    className={cn(
                      "w-full p-3 rounded-xl border text-left transition-all flex justify-between items-center",
                      isActive
                        ? "bg-primary/5 text-primary border-primary shadow-sm scale-[1.01]"
                        : "bg-white text-foreground border-border/40 hover:bg-sidebar-background"
                    )}
                  >
                    <div>
                      <span className="text-xs font-bold block">{grade.name}</span>
                      <span className="text-[10px] text-muted-foreground">{grade.desc}</span>
                    </div>
                    {isActive && <CheckCircle className="w-4 h-4 text-primary shrink-0" />}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Layer visibility sync */}
          <Card className="border border-border/40 shadow-sm p-5 space-y-3">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-primary" /> Mesh Layer Toggle
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2 p-2 rounded-lg bg-sidebar-background border border-border/20 cursor-pointer">
                <input
                  type="checkbox"
                  checked={reconStore.showWalls}
                  onChange={(e) => reconStore.setLayerToggle("showWalls", e.target.checked)}
                  className="accent-primary"
                />
                <span>Enclosures</span>
              </label>
              <label className="flex items-center gap-2 p-2 rounded-lg bg-sidebar-background border border-border/20 cursor-pointer">
                <input
                  type="checkbox"
                  checked={reconStore.showFurniture}
                  onChange={(e) => reconStore.setLayerToggle("showFurniture", e.target.checked)}
                  className="accent-primary"
                />
                <span>Furniture</span>
              </label>
            </div>
          </Card>

        </div>

        {/* MIDDLE COLUMN: 3D Viewport (lg:col-span-5) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="w-full relative min-h-[550px] aspect-[4/3] rounded-3xl overflow-hidden border border-border/40 shadow-premium bg-stone-950">
            {isProcessing ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-950/80 backdrop-blur-sm z-20">
                <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                <h4 className="text-sm font-bold text-stone-200">Generating Spatial Design...</h4>
                <p className="text-[10px] text-stone-500 font-mono mt-1">Applying style color maps, light temperatures & PBR parameters</p>
              </div>
            ) : null}

            {activeDesign ? (
              <ThreeDInteriorViewer
                design={activeDesign}
                width={roomDetails.width}
                height={roomDetails.height}
                furniture={roomDetails.furniture}
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 text-stone-400">
                <Loader2 className="w-8 h-8 animate-spin mb-2 text-primary" />
                <span className="text-xs font-semibold">Instantiating CAD Viewport...</span>
              </div>
            )}
          </div>

          {/* Quick Stats overview panel */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white border border-border/40 p-4 rounded-2xl shadow-sm text-center">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">Floor Area</span>
              <span className="text-lg font-black text-foreground mt-1 block">{budgetBreakdown.sqFt} <span className="text-xs font-normal">sq ft</span></span>
            </div>
            <div className="bg-white border border-border/40 p-4 rounded-2xl shadow-sm text-center">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">Materials</span>
              <span className="text-lg font-black text-foreground mt-1 block">{materialCount} <span className="text-xs font-normal">specs</span></span>
            </div>
            <div className="bg-white border border-border/40 p-4 rounded-2xl shadow-sm text-center">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">Lighting Fixtures</span>
              <span className="text-lg font-black text-foreground mt-1 block">{lightCount} <span className="text-xs font-normal">nodes</span></span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Diagnostics & Scoring (lg:col-span-3) */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Design Score Gauge Card */}
          <Card className="border border-border/40 shadow-sm p-5 space-y-4 text-center">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center justify-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-primary" /> Design Score
            </h3>

            {activeDesign ? (
              <div className="flex flex-col items-center justify-center py-2">
                <div className="relative w-28 h-28 flex items-center justify-center">
                  {/* Gauge Ring */}
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="56"
                      cy="56"
                      r="46"
                      stroke="#f1f5f9"
                      strokeWidth="8"
                      fill="transparent"
                    />
                    <circle
                      cx="56"
                      cy="56"
                      r="46"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={2 * Math.PI * 46}
                      strokeDashoffset={2 * Math.PI * 46 * (1 - activeDesign.designScore / 100)}
                      className={cn(
                        activeDesign.designScore >= 85
                          ? "text-indigo-600"
                          : activeDesign.designScore >= 70
                          ? "text-amber-500"
                          : "text-rose-500"
                      )}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-black tracking-tight">{activeDesign.designScore}</span>
                    <span className="text-[8px] uppercase font-bold text-muted-foreground tracking-widest">Aesthetic Grade</span>
                  </div>
                </div>

                {/* Subscores Grid */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 w-full mt-4 text-[10px] font-semibold text-muted-foreground text-left">
                  <div className="flex justify-between border-b border-border/20 pb-1">
                    <span>Colors:</span>
                    <span className="font-bold text-foreground">{activeDesign.scoreBreakdown?.colorHarmony || 90}/100</span>
                  </div>
                  <div className="flex justify-between border-b border-border/20 pb-1">
                    <span>Lighting:</span>
                    <span className="font-bold text-foreground">{activeDesign.scoreBreakdown?.lightingAdequacy || 88}/100</span>
                  </div>
                  <div className="flex justify-between border-b border-border/20 pb-1">
                    <span>Clearance:</span>
                    <span className="font-bold text-foreground">{activeDesign.scoreBreakdown?.spaceClearance || 88}/100</span>
                  </div>
                  <div className="flex justify-between border-b border-border/20 pb-1">
                    <span>Materials:</span>
                    <span className="font-bold text-foreground">{activeDesign.scoreBreakdown?.materialBalance || 90}/100</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-28 flex items-center justify-center text-xs text-muted-foreground">Calculating scores...</div>
            )}
          </Card>

          {/* Budget Analysis Card */}
          <Card className="border border-border/40 shadow-sm p-5 space-y-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Coins className="w-3.5 h-3.5 text-primary" /> Budget Appraisal
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Flooring Base:</span>
                <span className="font-bold text-foreground">${budgetBreakdown.flooringCost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Wall Refacing:</span>
                <span className="font-bold text-foreground">${budgetBreakdown.wallCost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Lighting Fixtures:</span>
                <span className="font-bold text-foreground">${budgetBreakdown.lightingCost.toLocaleString()}</span>
              </div>
              <div className="h-px bg-border/40 my-2" />
              <div className="flex justify-between text-sm font-black">
                <span>Estimated Cost:</span>
                <span className="text-primary">${budgetBreakdown.totalCost.toLocaleString()}</span>
              </div>
            </div>
          </Card>

          {/* Critiques Card */}
          <Card className="border border-border/40 shadow-sm p-5 space-y-3">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500 animate-pulse" /> Design Critique
            </h3>
            
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {activeDesign?.critiques && activeDesign.critiques.length > 0 ? (
                activeDesign.critiques.map((crit, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/10 text-[10px] text-amber-800 leading-normal"
                  >
                    {crit}
                  </div>
                ))
              ) : (
                <div className="text-[10px] text-muted-foreground text-center py-4">No critical audits generated. Layout meets full guidelines.</div>
              )}
            </div>
          </Card>

          {/* Active materials list */}
          <Card className="border border-border/40 shadow-sm p-5 space-y-3">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Palette className="w-3.5 h-3.5 text-primary" /> Active Specs
            </h3>

            <div className="space-y-1.5 max-h-[200px] overflow-y-auto text-[10px] pr-1">
              {activeDesign?.materialJson?.map((m, idx) => (
                <div key={idx} className="flex items-center justify-between p-1.5 border-b border-border/10">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-md border border-border/30 shrink-0"
                      style={{ backgroundColor: m.colorHex }}
                    />
                    <span className="font-bold capitalize text-foreground">{m.element}:</span>
                  </div>
                  <span className="text-muted-foreground text-right truncate max-w-[120px]">{m.materialName}</span>
                </div>
              ))}
            </div>
          </Card>

        </div>

      </div>
    </PageContainer>
  );
}
