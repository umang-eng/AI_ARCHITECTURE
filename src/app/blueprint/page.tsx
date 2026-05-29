"use client";

import React, { useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { Card } from "@/components/ui-custom/Card";
import { PrimaryButton, SecondaryButton } from "@/components/ui-custom/Buttons";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileUp,
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
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getHealth } from "@/lib/api";

export default function BlueprintGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasPreview, setHasPreview] = useState(false);
  const [backendMessage, setBackendMessage] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setBackendMessage(null);

    const result = await getHealth();
    if (result.success) {
      setBackendMessage(`Backend connected: ${result.data.version}`);
      setHasPreview(true);
    } else {
      setBackendMessage(`Backend unavailable: ${result.error}`);
      setHasPreview(false);
    }

    setTimeout(() => {
      setIsGenerating(false);
    }, 3000);
  };

  return (
    <PageContainer>
      <SectionHeader
        title="Blueprint Generator"
        description="Transform your ideas and plot dimensions into professional architectural blueprints."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Inputs */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-4 space-y-6"
        >
          {/* Section 1: Upload */}
          <Card 
            title="Upload Plot File" 
            description="Supported: PDF, PNG, JPG, DWG"
            className="border-none shadow-premium"
          >
            <motion.div 
              whileHover={{ scale: 1.01, borderColor: "var(--primary)" }}
              className="mt-4 border-2 border-dashed border-border/40 rounded-2xl p-8 flex flex-col items-center justify-center gap-4 hover:bg-sidebar-background/50 transition-all cursor-pointer group"
            >
              <div className="p-4 rounded-2xl bg-sidebar-background group-hover:bg-white shadow-sm transition-colors">
                <FileUp className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-bold">Drop your files here</p>
                <p className="text-xs text-muted-foreground">or click to browse from device</p>
              </div>
            </motion.div>
            
            <div className="mt-6 flex flex-wrap gap-2">
              {["PDF", "Image", "DWG"].map((type) => (
                <div key={type} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-sidebar-background text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  {type === "PDF" && <FileText className="w-3 h-3" />}
                  {type === "Image" && <ImageIcon className="w-3 h-3" />}
                  {type === "DWG" && <FileCode className="w-3 h-3" />}
                  {type}
                </div>
              ))}
            </div>
          </Card>

          {/* Section 2: Manual Inputs */}
          <Card 
            title="Specifications" 
            description="Define your project requirements"
            className="border-none shadow-premium"
          >
            <div className="mt-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <Ruler className="w-3.5 h-3.5" /> Width (ft)
                  </label>
                  <input
                    type="number"
                    placeholder="60"
                    className="w-full bg-sidebar-background/50 border border-border/40 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <Ruler className="w-3.5 h-3.5" /> Length (ft)
                  </label>
                  <input
                    type="number"
                    placeholder="80"
                    className="w-full bg-sidebar-background/50 border border-border/40 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all font-medium"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5" /> Total Floors
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {["1", "2", "3", "4+"].map((f) => (
                    <button key={f} className={cn(
                      "py-2 text-xs font-bold rounded-xl border border-border/40 transition-all",
                      f === "2" ? "bg-primary text-white border-primary" : "bg-white text-muted-foreground hover:border-primary/50"
                    )}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <Bed className="w-3.5 h-3.5" /> Bedrooms
                  </label>
                  <input
                    type="number"
                    placeholder="3"
                    className="w-full bg-sidebar-background/50 border border-border/40 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <Bath className="w-3.5 h-3.5" /> Bathrooms
                  </label>
                  <input
                    type="number"
                    placeholder="2"
                    className="w-full bg-sidebar-background/50 border border-border/40 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all font-medium"
                  />
                </div>
              </div>
            </div>
          </Card>

          <PrimaryButton
            className="w-full h-14 text-lg flex items-center justify-center gap-3 shadow-premium"
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5" />
                Generate Blueprint
              </>
            )}
          </PrimaryButton>
          {backendMessage && (
            <p className="mt-3 text-sm text-muted-foreground">
              {backendMessage}
            </p>
          )}
        </motion.div>

        {/* Right Column: Preview Area */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-8 h-full"
        >
          <Card noPadding className="h-full min-h-[700px] flex flex-col border-none shadow-premium relative bg-white">
            <div className="p-6 border-b border-border/40 bg-white/80 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/5 text-primary">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-lg tracking-tight">Interactive Canvas</h3>
              </div>
              <AnimatePresence>
                {hasPreview && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex gap-2"
                  >
                    <SecondaryButton className="h-10 px-4 text-xs font-bold gap-2">
                      <Download className="w-4 h-4" /> Export
                    </SecondaryButton>
                    <PrimaryButton className="h-10 px-4 text-xs font-bold gap-2">
                      <Share2 className="w-4 h-4" /> Share
                    </PrimaryButton>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex-1 bg-sidebar-background flex items-center justify-center relative overflow-hidden">
              {/* Grid Background */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                   style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '32px 32px' }} 
              />
              
              <AnimatePresence mode="wait">
                {!isGenerating && !hasPreview && (
                  <motion.div 
                    key="idle"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-center space-y-6"
                  >
                    <div className="relative mx-auto w-fit">
                      <div className="p-10 rounded-3xl bg-white shadow-premium border border-border/20">
                        <Wand2 className="w-16 h-16 text-muted-foreground/20" />
                      </div>
                      <motion.div 
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="absolute -top-2 -right-2 p-3 rounded-2xl bg-primary text-white shadow-lg"
                      >
                        <Sparkles className="w-5 h-5" />
                      </motion.div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-2xl font-bold tracking-tight text-foreground/40">Ready to Generate</p>
                      <p className="text-sm text-muted-foreground/60 max-w-xs mx-auto leading-relaxed">
                        Complete the project specifications on the left to start building your blueprint.
                      </p>
                    </div>
                  </motion.div>
                )}

                {isGenerating && (
                  <motion.div 
                    key="generating"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center space-y-8"
                  >
                    <div className="relative mx-auto w-fit">
                      <div className="w-32 h-32 rounded-full border-4 border-primary/10 border-t-primary animate-spin" />
                      <Wand2 className="w-10 h-10 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <div className="space-y-3">
                      <p className="text-3xl font-black tracking-tighter">Analyzing Topology</p>
                      <div className="flex items-center justify-center gap-2">
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
                            className="w-2 h-2 rounded-full bg-primary"
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {hasPreview && (
                  <motion.div 
                    key="preview"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full h-full p-8 md:p-12"
                  >
                    <div className="w-full h-full bg-white rounded-3xl shadow-2xl border border-border/20 relative overflow-hidden group cursor-zoom-in">
                      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1503387762-592dee58c460?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-[0.08] group-hover:opacity-10 transition-opacity duration-700" />
                      
                      <div className="absolute top-8 left-8 space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Main Floor Plan</p>
                        <h4 className="text-2xl font-bold tracking-tight">Luxury Residence V1</h4>
                      </div>

                      <div className="absolute bottom-8 right-8 flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Total Area</p>
                          <p className="text-lg font-bold">4,800 sq ft</p>
                        </div>
                        <div className="w-px h-8 bg-border/40" />
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Scale</p>
                          <p className="text-lg font-bold">1:100</p>
                        </div>
                      </div>

                      {/* Mock UI for canvas tools */}
                      <div className="absolute top-1/2 right-8 -translate-y-1/2 flex flex-col gap-2">
                        {[Maximize2, Download, Share2].map((Icon, i) => (
                          <button key={i} className="p-3 rounded-2xl bg-white shadow-premium border border-border/20 hover:text-primary transition-colors">
                            <Icon className="w-5 h-5" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Card>
        </motion.div>
      </div>
    </PageContainer>
  );
}
