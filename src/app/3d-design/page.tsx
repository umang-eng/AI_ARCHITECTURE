"use client";

import React, { useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { Card } from "@/components/ui-custom/Card";
import { PrimaryButton, SecondaryButton } from "@/components/ui-custom/Buttons";
import { motion, AnimatePresence } from "framer-motion";
import {
  Box,
  Wand2,
  RotateCcw,
  ZoomIn,
  Move,
  Loader2,
  Sparkles,
  Maximize2,
  Download,
  Share2,
  Settings,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ThreeDDesign() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasModel, setHasModel] = useState(false);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setHasModel(true);
    }, 4000);
  };

  return (
    <PageContainer>
      <SectionHeader
        title="3D Building Designer"
        description="Generate and visualize your architectural concepts in a fully interactive 3D environment."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full min-h-[750px]">
        {/* Left Panel: Designer */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-3 flex flex-col gap-6"
        >
          <Card 
            title="Designer" 
            description="AI-driven 3D modeling"
            className="flex-1 border-none shadow-premium bg-white flex flex-col"
          >
            <div className="mt-6 flex-1 flex flex-col space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Architectural Prompt</label>
                <textarea
                  placeholder="Create a modern luxury villa with glass facade and infinity pool..."
                  className="w-full flex-1 bg-sidebar-background/50 border border-border/40 rounded-2xl p-4 text-sm focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all resize-none font-medium min-h-[150px]"
                />
              </div>
              
              <div className="space-y-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Quick Styles
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {["Modern", "Minimalist", "Industrial", "Classical"].map((style) => (
                    <button
                      key={style}
                      className="px-3 py-2 rounded-xl bg-sidebar-background border border-border/40 text-[11px] font-bold hover:bg-white hover:border-primary/30 transition-all shadow-sm"
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-border/40 space-y-4">
                <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  <span>AI Accuracy</span>
                  <span className="text-primary">High</span>
                </div>
                <div className="h-1.5 w-full bg-sidebar-background rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "85%" }}
                    className="h-full bg-primary rounded-full"
                  />
                </div>
              </div>
            </div>
          </Card>

          <PrimaryButton
            className="w-full h-16 text-lg flex items-center justify-center gap-3 shadow-premium group"
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
                <Zap className="w-5 h-5 group-hover:text-amber-400 transition-colors" />
                Generate 3D
              </>
            )}
          </PrimaryButton>
        </motion.div>

        {/* Right Panel: Viewer */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-9 h-full"
        >
          <Card noPadding className="h-full min-h-[600px] flex flex-col border-none shadow-premium relative bg-white group/viewer">
            {/* Toolbar */}
            <div className="absolute top-6 left-6 z-20 flex items-center gap-2">
              <div className="px-4 py-2 rounded-2xl bg-white/90 backdrop-blur-md border border-border/40 shadow-premium flex items-center gap-3">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  hasModel ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/30"
                )} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/80">
                  {hasModel ? "Render Active" : "Viewer Idle"}
                </span>
              </div>
            </div>

            <div className="absolute top-6 right-6 z-20 flex items-center gap-2 opacity-0 group-hover/viewer:opacity-100 transition-all duration-300 translate-y-2 group-hover/viewer:translate-y-0">
              {[Maximize2, Download, Share2, Settings].map((Icon, i) => (
                <SecondaryButton key={i} className="h-11 w-11 p-0 rounded-2xl flex items-center justify-center bg-white/90 backdrop-blur-md border-border/40 shadow-premium">
                  <Icon className="w-4 h-4" />
                </SecondaryButton>
              ))}
            </div>

            {/* Viewer Canvas */}
            <div className="w-full h-full bg-[#FBFBFA] flex items-center justify-center relative overflow-hidden">
              {/* Technical Grid */}
              <div className="absolute inset-0 opacity-[0.04] pointer-events-none" 
                   style={{ 
                     backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', 
                     backgroundSize: '64px 64px' 
                   }} 
              />

              <AnimatePresence mode="wait">
                {!isGenerating && !hasModel && (
                  <motion.div 
                    key="idle"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    className="text-center space-y-8 relative z-10"
                  >
                    <div className="relative mx-auto w-fit">
                      <div className="p-12 rounded-[40px] bg-white shadow-premium border border-border/10">
                        <Box className="w-20 h-16 text-muted-foreground/10" />
                      </div>
                      <motion.div 
                        animate={{ y: [0, -10, 0] }}
                        transition={{ repeat: Infinity, duration: 3 }}
                        className="absolute -top-4 -right-4 p-4 rounded-3xl bg-primary text-white shadow-xl"
                      >
                        <Sparkles className="w-6 h-6" />
                      </motion.div>
                    </div>
                    <div className="space-y-3">
                      <p className="text-3xl font-black tracking-tighter text-foreground/40 uppercase">3D Engine Ready</p>
                      <p className="text-sm text-muted-foreground/50 max-w-xs mx-auto font-medium leading-relaxed">
                        Input your design vision to initialize the neural architectural renderer.
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
                    className="text-center space-y-10 relative z-10"
                  >
                    <div className="relative mx-auto w-fit">
                      <div className="w-40 h-40 rounded-full border-[6px] border-primary/5 border-t-primary animate-spin" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <motion.div
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                        >
                          <Box className="w-16 h-16 text-primary" />
                        </motion.div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <p className="text-4xl font-black tracking-tighter text-foreground">Synthesizing Meshes</p>
                      <div className="flex items-center justify-center gap-3">
                        {[0.1, 0.2, 0.3].map((delay, i) => (
                          <motion.div
                            key={i}
                            animate={{ 
                              height: [12, 24, 12],
                              opacity: [0.3, 1, 0.3]
                            }}
                            transition={{ repeat: Infinity, duration: 1, delay }}
                            className="w-1.5 rounded-full bg-primary"
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {hasModel && (
                  <motion.div 
                    key="model"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-full h-full relative"
                  >
                    {/* Placeholder High-Quality Render */}
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-30 mix-blend-multiply transition-transform duration-[10s] hover:scale-110" />
                    
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/20" />

                    <div className="absolute inset-0 flex items-center justify-center">
                      <motion.div 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="text-center space-y-4"
                      >
                        <div className="px-8 py-4 rounded-[32px] bg-white/10 backdrop-blur-2xl border border-white/20 shadow-2xl">
                          <p className="text-2xl font-black text-foreground tracking-tighter uppercase italic">Interactive Render</p>
                          <p className="text-[10px] font-bold text-muted-foreground mt-2 tracking-[0.3em] uppercase">Neural Engine v2.0</p>
                        </div>
                      </motion.div>
                    </div>

                    {/* Pro 3D Controls */}
                    <motion.div 
                      initial={{ y: 50, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.8 }}
                      className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 px-8 py-4 rounded-[28px] bg-white/90 backdrop-blur-xl border border-border/40 shadow-premium z-30"
                    >
                      <button className="p-3 rounded-2xl hover:bg-sidebar-background transition-all group active:scale-90" title="Orbit">
                        <RotateCcw className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                      </button>
                      <div className="w-px h-8 bg-border/40 mx-2" />
                      <button className="p-3 rounded-2xl hover:bg-sidebar-background transition-all group active:scale-90" title="Zoom">
                        <ZoomIn className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                      </button>
                      <div className="w-px h-8 bg-border/40 mx-2" />
                      <button className="p-3 rounded-2xl hover:bg-sidebar-background transition-all group active:scale-90" title="Pan">
                        <Move className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                      </button>
                    </motion.div>
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
