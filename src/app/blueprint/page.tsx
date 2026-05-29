"use client";

import React, { useState, useEffect } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { Card } from "@/components/ui-custom/Card";
import { PrimaryButton, SecondaryButton } from "@/components/ui-custom/Buttons";
import { motion, AnimatePresence } from "framer-motion";
import {
  Ruler,
  Layers,
  Bed,
  Bath,
  Wand2,
  Loader2,
  FileText,
  Image as ImageIcon,
  FileCode,
  Download,
  Share2,
  Maximize2,
  Sparkles,
  DollarSign,
  Car,
  Trees,
  Waves as PoolIcon,
  Briefcase,
  Type,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { extractRequirements, getHealth } from "@/lib/api";

const EXAMPLE_PROMPTS = [
  {
    label: "Modern Pool Villa",
    text: "Create a modern 2-floor residential villa on a 60x90 ft plot with 4 bedrooms, 3 bathrooms, an open kitchen, a private swimming pool, and a lush garden."
  },
  {
    label: "Industrial Office Hub",
    text: "Design a 3-floor industrial-style commercial building on a 120x150 m plot with 8 parking spaces, a high-tech conference room, and a rooftop garden."
  },
  {
    label: "Minimalist Cozy Cottage",
    text: "A minimalist 1-story cottage on a 40x60 ft plot with 2 bedrooms, 1 bathroom, and a dedicated home office."
  }
];

const LOADING_STEPS = [
  "Awakening Neural Architect...",
  "Parsing project geometry and dimensions...",
  "Applying zoning and floor plan layouts...",
  "Compiling Pydantic model validation...",
  "Finalizing design envelopes..."
];

export default function BlueprintGenerator() {
  // Spec states
  const [buildingType, setBuildingType] = useState("residential");
  const [style, setStyle] = useState("Modern");
  const [width, setWidth] = useState<number>(60);
  const [length, setLength] = useState<number>(80);
  const [unit, setUnit] = useState("ft");
  const [floors, setFloors] = useState<number>(2);
  const [bedrooms, setBedrooms] = useState<number>(3);
  const [bathrooms, setBathrooms] = useState<number>(2);
  const [budget, setBudget] = useState<string>("");
  const [parkingSpaces, setParkingSpaces] = useState<string>("");
  const [garden, setGarden] = useState<boolean>(true);
  const [swimmingPool, setSwimmingPool] = useState<boolean>(false);
  const [officeRoom, setOfficeRoom] = useState<boolean>(false);
  const [features, setFeatures] = useState<string[]>(["balcony", "open kitchen"]);

  // UI interaction states
  const [prompt, setPrompt] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionStep, setExtractionStep] = useState(0);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasPreview, setHasPreview] = useState(false);
  const [highlightPulse, setHighlightPulse] = useState(false);

  // Cycle loading steps
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isExtracting) {
      interval = setInterval(() => {
        setExtractionStep((prev) => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev));
      }, 900);
    } else {
      setExtractionStep(0);
    }
    return () => clearInterval(interval);
  }, [isExtracting]);

  const handleExtractRequirements = async () => {
    if (!prompt.trim()) return;

    setIsExtracting(true);
    setExtractionError(null);
    setExtractionStep(0);

    try {
      const response = await extractRequirements(prompt);
      if (response.success) {
        const req = response.data;
        
        // Populate states
        setBuildingType(req.building_type || "residential");
        setStyle(req.style || "Modern");
        if (req.plot) {
          setWidth(req.plot.width || 60);
          setLength(req.plot.length || 80);
          setUnit(req.plot.unit || "ft");
        }
        setFloors(req.floors || 1);
        setBedrooms(req.bedrooms || 0);
        setBathrooms(req.bathrooms || 0);
        setBudget(req.budget ? req.budget.toString() : "");
        setParkingSpaces(req.parking_spaces ? req.parking_spaces.toString() : "");
        setGarden(!!req.garden);
        setSwimmingPool(!!req.swimming_pool);
        setOfficeRoom(!!req.office_room);
        setFeatures(req.features || []);

        // Trigger gorgeous pulse animation to show fields populated
        setHighlightPulse(true);
        setTimeout(() => setHighlightPulse(false), 2000);
      } else {
        setExtractionError(response.error || "Failed to extract requirements");
      }
    } catch (err) {
      setExtractionError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    const result = await getHealth();
    setTimeout(() => {
      setIsGenerating(false);
      if (result.success) {
        setHasPreview(true);
      }
    }, 2500);
  };

  return (
    <PageContainer>
      <SectionHeader
        title="Blueprint Generator"
        description="Design your dream property using advanced AI. Describe your idea in natural language, or adjust specifications manually below."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: AI Wizard + Specifications Form */}
        <div className="lg:col-span-5 space-y-6">
          {/* AI Wizard Card */}
          <Card 
            title="AI Architect Wizard" 
            description="Extract specs directly from natural language"
            className="border-none shadow-premium bg-gradient-to-tr from-white to-primary/[0.01]"
          >
            <div className="mt-4 space-y-4">
              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe your building design project in detail..."
                  className="w-full bg-sidebar-background/50 border border-border/40 rounded-2xl p-4 pr-10 text-sm focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all resize-none min-h-[120px] font-medium"
                />
                <button 
                  onClick={() => setPrompt("")}
                  className={cn(
                    "absolute right-3 top-3 text-xs text-muted-foreground/60 hover:text-foreground font-semibold px-2 py-1 rounded bg-white border border-border/20 shadow-sm transition-all",
                    !prompt && "opacity-0 pointer-events-none"
                  )}
                >
                  Clear
                </button>
              </div>

              {/* Example Prompts */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" /> Need inspiration? Try these:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {EXAMPLE_PROMPTS.map((ex, i) => (
                    <button
                      key={i}
                      onClick={() => setPrompt(ex.text)}
                      className="px-2.5 py-1.5 rounded-xl bg-sidebar-background hover:bg-primary/5 border border-border/30 hover:border-primary/20 text-[11px] font-bold transition-all text-muted-foreground hover:text-primary active:scale-95"
                    >
                      {ex.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Extraction Button / Loading */}
              <AnimatePresence mode="wait">
                {isExtracting ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="p-4 rounded-2xl bg-primary/[0.03] border border-primary/10 space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      <p className="text-xs font-bold text-primary tracking-tight">AI Agent Working...</p>
                    </div>
                    <div className="space-y-1.5">
                      <div className="h-1.5 w-full bg-sidebar-background rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-primary rounded-full"
                          initial={{ width: "10%" }}
                          animate={{ width: `${(extractionStep + 1) * 20}%` }}
                          transition={{ duration: 0.8 }}
                        />
                      </div>
                      <p className="text-[10px] font-semibold text-muted-foreground italic transition-all duration-300">
                        {LOADING_STEPS[extractionStep]}
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-2"
                  >
                    <PrimaryButton
                      className="w-full h-12 text-sm flex items-center justify-center gap-2 shadow-sm relative overflow-hidden group"
                      onClick={handleExtractRequirements}
                      disabled={!prompt.trim()}
                    >
                      <Wand2 className="w-4 h-4" />
                      Analyze & Extract Specifications
                    </PrimaryButton>

                    {extractionError && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/20 text-rose-600 text-xs flex items-center gap-2 font-medium"
                      >
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{extractionError}</span>
                      </motion.div>
                    )}

                    {highlightPulse && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-emerald-600 text-xs flex items-center gap-2 font-medium"
                      >
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>Specifications parsed and configured successfully!</span>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Card>

          {/* Specifications Input Panel */}
          <Card 
            title="Project Specifications" 
            description="Define property requirements and constraints"
            className={cn(
              "border-none shadow-premium transition-all duration-700",
              highlightPulse && "ring-2 ring-emerald-500 bg-emerald-500/[0.01]"
            )}
          >
            <div className="mt-6 space-y-6">
              {/* Style & Building Type */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <Type className="w-3.5 h-3.5" /> Building Type
                  </label>
                  <select
                    value={buildingType}
                    onChange={(e) => setBuildingType(e.target.value)}
                    className="w-full bg-sidebar-background/50 border border-border/40 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all font-semibold"
                  >
                    <option value="residential">Residential</option>
                    <option value="commercial">Commercial</option>
                    <option value="mixed-use">Mixed-Use</option>
                    <option value="industrial">Industrial</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5" /> Style
                  </label>
                  <input
                    type="text"
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                    placeholder="Modern"
                    className="w-full bg-sidebar-background/50 border border-border/40 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all font-medium"
                  />
                </div>
              </div>

              {/* Plot Dimensions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <Ruler className="w-3.5 h-3.5" /> Plot dimensions ({unit})
                  </label>
                  <div className="flex gap-1 bg-sidebar-background rounded-lg p-0.5 border border-border/30">
                    {["ft", "m"].map((u) => (
                      <button
                        key={u}
                        onClick={() => setUnit(u)}
                        className={cn(
                          "px-2 py-0.5 text-[9px] font-bold uppercase rounded-md transition-all",
                          unit === u ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-[10px] font-bold text-muted-foreground">W</span>
                    <input
                      type="number"
                      value={width || ""}
                      onChange={(e) => setWidth(Number(e.target.value))}
                      placeholder="60"
                      className="w-full bg-sidebar-background/50 border border-border/40 rounded-xl pl-8 pr-3 py-2.5 text-xs focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all font-medium"
                    />
                  </div>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-[10px] font-bold text-muted-foreground">L</span>
                    <input
                      type="number"
                      value={length || ""}
                      onChange={(e) => setLength(Number(e.target.value))}
                      placeholder="80"
                      className="w-full bg-sidebar-background/50 border border-border/40 rounded-xl pl-8 pr-3 py-2.5 text-xs focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Floors, Bedrooms, Bathrooms */}
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                    <Layers className="w-3 h-3" /> Floors
                  </label>
                  <input
                    type="number"
                    value={floors || ""}
                    onChange={(e) => setFloors(Number(e.target.value))}
                    placeholder="2"
                    min="1"
                    className="w-full bg-sidebar-background/50 border border-border/40 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                    <Bed className="w-3 h-3" /> Beds
                  </label>
                  <input
                    type="number"
                    value={bedrooms || ""}
                    onChange={(e) => setBedrooms(Number(e.target.value))}
                    placeholder="3"
                    min="0"
                    className="w-full bg-sidebar-background/50 border border-border/40 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                    <Bath className="w-3 h-3" /> Baths
                  </label>
                  <input
                    type="number"
                    value={bathrooms || ""}
                    onChange={(e) => setBathrooms(Number(e.target.value))}
                    placeholder="2"
                    min="0"
                    className="w-full bg-sidebar-background/50 border border-border/40 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all font-medium"
                  />
                </div>
              </div>

              {/* Extra specifications (Budget, Parking) */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5" /> Budget (USD)
                  </label>
                  <input
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="500000"
                    className="w-full bg-sidebar-background/50 border border-border/40 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                    <Car className="w-3.5 h-3.5" /> Parking
                  </label>
                  <input
                    type="number"
                    value={parkingSpaces}
                    onChange={(e) => setParkingSpaces(e.target.value)}
                    placeholder="2"
                    className="w-full bg-sidebar-background/50 border border-border/40 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all font-medium"
                  />
                </div>
              </div>

              {/* Booleans / Switches */}
              <div className="pt-4 border-t border-border/40 grid grid-cols-3 gap-2">
                <button
                  onClick={() => setGarden(!garden)}
                  className={cn(
                    "flex flex-col items-center justify-center p-3 rounded-xl border transition-all gap-1.5",
                    garden ? "bg-primary/5 border-primary text-primary" : "bg-white border-border/30 text-muted-foreground hover:bg-sidebar-background/30"
                  )}
                >
                  <Trees className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Garden</span>
                </button>
                <button
                  onClick={() => setSwimmingPool(!swimmingPool)}
                  className={cn(
                    "flex flex-col items-center justify-center p-3 rounded-xl border transition-all gap-1.5",
                    swimmingPool ? "bg-primary/5 border-primary text-primary" : "bg-white border-border/30 text-muted-foreground hover:bg-sidebar-background/30"
                  )}
                >
                  <PoolIcon className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Pool</span>
                </button>
                <button
                  onClick={() => setOfficeRoom(!officeRoom)}
                  className={cn(
                    "flex flex-col items-center justify-center p-3 rounded-xl border transition-all gap-1.5",
                    officeRoom ? "bg-primary/5 border-primary text-primary" : "bg-white border-border/30 text-muted-foreground hover:bg-sidebar-background/30"
                  )}
                >
                  <Briefcase className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Office</span>
                </button>
              </div>

              {/* Extracted Features list */}
              {features.length > 0 && (
                <div className="pt-4 border-t border-border/40 space-y-2">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    Extra Extracted Features
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {features.map((feat, idx) => (
                      <span 
                        key={idx}
                        className="px-2.5 py-1 rounded-full bg-primary/[0.04] border border-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider shadow-sm"
                      >
                        {feat}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Trigger Building */}
          <PrimaryButton
            className="w-full h-14 text-base flex items-center justify-center gap-3 shadow-premium"
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Synthesizing structural blueprint...
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5" />
                Generate Architectural Blueprint
              </>
            )}
          </PrimaryButton>
        </div>

        {/* Right Column: Dynamic Blueprint Drafting Canvas */}
        <div className="lg:col-span-7 h-full">
          <Card noPadding className="h-full min-h-[720px] flex flex-col border-none shadow-premium bg-white">
            <div className="p-6 border-b border-border/40 bg-white/80 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/5 text-primary">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base tracking-tight leading-none">Drafting Canvas</h3>
                  <p className="text-[10px] text-muted-foreground mt-1">Live blueprint generation & visualization</p>
                </div>
              </div>
              <AnimatePresence>
                {hasPreview && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex gap-2"
                  >
                    <SecondaryButton className="h-9 px-3.5 text-xs font-bold gap-1.5">
                      <Download className="w-3.5 h-3.5" /> Export
                    </SecondaryButton>
                    <PrimaryButton className="h-9 px-3.5 text-xs font-bold gap-1.5">
                      <Share2 className="w-3.5 h-3.5" /> Share
                    </PrimaryButton>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex-1 bg-[#1E2530] text-white flex items-center justify-center relative overflow-hidden p-6">
              {/* Drafting Blueprint Grid */}
              <div className="absolute inset-0 opacity-[0.12] pointer-events-none" 
                   style={{ 
                     backgroundImage: 'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)', 
                     backgroundSize: '24px 24px' 
                   }} 
              />
              <div className="absolute inset-0 opacity-[0.05] pointer-events-none" 
                   style={{ 
                     backgroundImage: 'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)', 
                     backgroundSize: '120px 120px' 
                   }} 
              />

              <AnimatePresence mode="wait">
                {!isGenerating && !hasPreview && (
                  <motion.div 
                    key="idle"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-center space-y-6 max-w-sm"
                  >
                    <div className="relative mx-auto w-fit">
                      <div className="p-10 rounded-3xl bg-white/[0.04] border border-white/10 backdrop-blur-xl shadow-2xl">
                        <Wand2 className="w-16 h-16 text-white/30" />
                      </div>
                      <motion.div 
                        animate={{ scale: [1, 1.15, 1] }}
                        transition={{ repeat: Infinity, duration: 2.5 }}
                        className="absolute -top-2 -right-2 p-2.5 rounded-xl bg-primary text-white shadow-lg"
                      >
                        <Sparkles className="w-4 h-4" />
                      </motion.div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xl font-bold tracking-tight uppercase text-white/70">Blueprint Draft Room</p>
                      <p className="text-xs text-white/40 leading-relaxed">
                        Populate specs using the AI Wizard or modify form fields on the left. Then click &quot;Generate Architectural Blueprint&quot; to synthesize the plan.
                      </p>
                    </div>

                    {/* Live Specs Overlay */}
                    <div className="pt-4 flex justify-center gap-4 text-[10px] font-mono text-white/50 bg-white/[0.02] border border-white/5 rounded-xl p-3">
                      <span>PLOT: {width || 0}x{length || 0} {unit}</span>
                      <span className="text-white/20">|</span>
                      <span className="uppercase">STYLE: {style || "N/A"}</span>
                      <span className="text-white/20">|</span>
                      <span>FLOORS: {floors || 0}</span>
                    </div>
                  </motion.div>
                )}

                {isGenerating && (
                  <motion.div 
                    key="generating"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center space-y-6"
                  >
                    <div className="relative mx-auto w-fit">
                      <div className="w-28 h-28 rounded-full border-4 border-white/5 border-t-primary animate-spin" />
                      <Wand2 className="w-8 h-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-2xl font-bold tracking-tight">Synthesizing blueprint...</p>
                      <p className="text-xs text-white/40 animate-pulse">Running topology rendering & drafting solvers</p>
                    </div>
                  </motion.div>
                )}

                {hasPreview && (
                  <motion.div 
                    key="preview"
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full h-full flex flex-col justify-between"
                  >
                    {/* Architectural Drawing Mock View */}
                    <div className="flex-1 bg-black/40 border border-white/10 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between shadow-2xl">
                      {/* Compass and Info Overlay */}
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <p className="text-[10px] font-mono text-primary font-bold uppercase tracking-[0.2em]">Live Draft Render</p>
                          <h4 className="text-lg font-bold tracking-tight uppercase">{style} {buildingType}</h4>
                        </div>
                        <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-[9px] font-mono text-white/60">
                          N 🧭
                        </div>
                      </div>

                      {/* Schematic Representation */}
                      <div className="my-8 flex-1 flex items-center justify-center relative">
                        {/* Dynamic Box Representing the Plot */}
                        <motion.div 
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.5 }}
                          className="border border-dashed border-primary/60 bg-primary/5 rounded relative flex flex-col items-center justify-center p-4 select-none"
                          style={{
                            width: `${Math.min(300, Math.max(160, width * 2))}px`,
                            height: `${Math.min(220, Math.max(120, length * 1.5))}px`,
                          }}
                        >
                          {/* Dimensions markings */}
                          <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-mono text-primary flex items-center gap-1">
                            <span className="w-2 h-px bg-primary/40" /> {width} {unit} <span className="w-2 h-px bg-primary/40" />
                          </div>
                          <div className="absolute -left-10 top-1/2 -translate-y-1/2 text-[9px] font-mono text-primary flex flex-col items-center justify-center leading-none">
                            <span>{length}</span>
                            <span>{unit}</span>
                          </div>

                          {/* Rooms mock list inside schematic */}
                          <div className="space-y-1 text-center w-full max-w-[80%] overflow-hidden">
                            <p className="text-[9px] font-bold text-white/70 uppercase truncate">{floors} Floors Layout</p>
                            <div className="flex flex-wrap gap-1 justify-center max-h-[80px] overflow-hidden">
                              {Array.from({ length: Math.min(bedrooms, 4) }).map((_, idx) => (
                                <span key={`bed-${idx}`} className="text-[8px] px-1.5 py-0.5 rounded bg-white/10 text-white/80 uppercase font-mono">Bed {idx+1}</span>
                              ))}
                              {Array.from({ length: Math.min(bathrooms, 3) }).map((_, idx) => (
                                <span key={`bath-${idx}`} className="text-[8px] px-1.5 py-0.5 rounded bg-white/5 text-white/60 uppercase font-mono">Bath {idx+1}</span>
                              ))}
                              {officeRoom && (
                                <span className="text-[8px] px-1.5 py-0.5 rounded bg-primary/20 text-primary uppercase font-mono">Office</span>
                              )}
                            </div>
                          </div>

                          {/* Amenities Mock Markers */}
                          <div className="absolute bottom-1 right-2 flex gap-1.5">
                            {garden && <span className="w-2 h-2 rounded-full bg-emerald-500" title="Garden Included" />}
                            {swimmingPool && <span className="w-2 h-2 rounded-full bg-cyan-400" title="Pool Included" />}
                          </div>
                        </motion.div>
                      </div>

                      {/* Technical specifications panel on blueprint */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-white/10 pt-4 text-[10px] font-mono text-white/60">
                        <div>
                          <p className="text-white/40 text-[9px]">PLOT AREA</p>
                          <p className="font-bold text-white text-xs">{width * length} sq {unit}</p>
                        </div>
                        <div>
                          <p className="text-white/40 text-[9px]">FLOOR COUNT</p>
                          <p className="font-bold text-white text-xs">{floors}</p>
                        </div>
                        <div>
                          <p className="text-white/40 text-[9px]">EST. BUDGET</p>
                          <p className="font-bold text-primary text-xs">${budget ? Number(budget).toLocaleString() : "TBD"}</p>
                        </div>
                        <div>
                          <p className="text-white/40 text-[9px]">PARKING SPACES</p>
                          <p className="font-bold text-white text-xs">{parkingSpaces || "0"}</p>
                        </div>
                      </div>
                    </div>

                    {/* Canvas Floating controls */}
                    <div className="mt-4 flex justify-between items-center bg-black/20 border border-white/5 rounded-xl p-3 text-[10px] font-mono text-white/60">
                      <span>SCALE: 1:100</span>
                      <span className="text-white/20">|</span>
                      <span>RENDER: SYSTEM ACTIVE</span>
                      <div className="flex gap-2">
                        <button onClick={() => setHasPreview(false)} className="px-2 py-0.5 rounded hover:bg-white/10 text-white transition-colors">
                          Reset View
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
