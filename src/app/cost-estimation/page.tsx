"use client";

import React, { useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { Card } from "@/components/ui-custom/Card";
import { PrimaryButton, SecondaryButton } from "@/components/ui-custom/Buttons";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calculator,
  TrendingUp,
  HardHat,
  Zap,
  Droplets,
  Paintbrush,
  MapPin,
  Ruler,
  Layers,
  ShieldCheck,
  Download,
  Share2,
  ChevronRight,
  Info,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const breakdownItems = [
  { name: "Materials", icon: HardHat, percentage: 45, cost: "$124,500", color: "bg-blue-500" },
  { name: "Labor", icon: HardHat, percentage: 25, cost: "$69,200", color: "bg-amber-500" },
  { name: "Electrical", icon: Zap, percentage: 10, cost: "$27,600", color: "bg-yellow-500" },
  { name: "Plumbing", icon: Droplets, percentage: 10, cost: "$27,600", color: "bg-cyan-500" },
  { name: "Interior", icon: Paintbrush, percentage: 10, cost: "$27,600", color: "bg-rose-500" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function CostEstimation() {
  const [isCalculating, setIsCalculating] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleCalculate = () => {
    setIsCalculating(true);
    setTimeout(() => {
      setIsCalculating(false);
      setShowResults(true);
    }, 2000);
  };

  return (
    <PageContainer>
      <SectionHeader
        title="Construction Cost Estimator"
        description="Get accurate AI-powered cost projections for your architectural projects."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Input Panel */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-4 space-y-6"
        >
          <Card title="Project Details" description="Define parameters for estimation" className="border-none shadow-premium">
            <div className="mt-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                  <Ruler className="w-3.5 h-3.5" /> Plot Area (sq ft)
                </label>
                <input
                  type="number"
                  placeholder="2400"
                  className="w-full bg-sidebar-background/50 border border-border/40 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5" /> Building Floors
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["1", "2", "3"].map((f) => (
                    <button key={f} className={cn(
                      "py-2.5 text-xs font-bold rounded-xl border border-border/40 transition-all",
                      f === "2" ? "bg-primary text-white border-primary shadow-sm" : "bg-white text-muted-foreground hover:border-primary/50"
                    )}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5" /> Material Grade
                </label>
                <div className="space-y-2">
                  {["Standard", "Premium", "Luxury"].map((grade) => (
                    <button key={grade} className={cn(
                      "w-full px-4 py-3 text-left text-xs font-bold rounded-xl border border-border/40 flex items-center justify-between group transition-all",
                      grade === "Premium" ? "bg-primary/5 border-primary/20 text-primary" : "bg-white text-muted-foreground hover:border-primary/20"
                    )}>
                      {grade}
                      <ChevronRight className={cn("w-3.5 h-3.5 transition-transform group-hover:translate-x-1", grade === "Premium" ? "text-primary" : "text-muted-foreground/30")} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5" /> Construction Site
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="San Francisco, CA"
                    className="w-full bg-sidebar-background/50 border border-border/40 rounded-xl px-10 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all font-medium"
                  />
                </div>
              </div>
            </div>
          </Card>

          <PrimaryButton
            className="w-full h-16 text-lg flex items-center justify-center gap-3 shadow-premium group"
            onClick={handleCalculate}
            disabled={isCalculating}
          >
            {isCalculating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Calculator className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                Analyze Costs
              </>
            )}
          </PrimaryButton>
        </motion.div>

        {/* Right: Results Panel */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-8 space-y-8"
        >
          <AnimatePresence mode="wait">
            {!showResults && !isCalculating ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Card className="h-full min-h-[500px] flex items-center justify-center border-dashed border-2 border-border/40 bg-sidebar-background/10">
                  <div className="text-center space-y-6">
                    <div className="p-8 rounded-[32px] bg-white shadow-premium border border-border/10 mx-auto w-fit">
                      <Calculator className="w-12 h-12 text-muted-foreground/20" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-2xl font-black tracking-tighter uppercase italic text-foreground/40">Ready for Analysis</p>
                      <p className="text-sm text-muted-foreground/50 max-w-xs mx-auto leading-relaxed">
                        Define your project parameters to receive a comprehensive AI cost estimation report.
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ) : (
              <motion.div 
                key="results"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className={cn("space-y-8", isCalculating && "opacity-50 grayscale pointer-events-none")}
              >
                {/* Total Cost Summary */}
                <motion.div variants={itemVariants}>
                  <Card noPadding className="bg-primary text-primary-foreground border-none overflow-hidden relative shadow-premium">
                    <div className="absolute -top-12 -right-12 p-8 opacity-[0.05]">
                      <Calculator className="w-64 h-64" />
                    </div>
                    <div className="relative z-10 p-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-primary-foreground/60 uppercase tracking-[0.4em]">Projected Total Investment</p>
                        <h2 className="text-6xl font-black tracking-tighter italic">$276,500</h2>
                        <div className="flex items-center gap-3 mt-4">
                          <div className="flex items-center gap-2 text-[10px] font-bold px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-xl border border-white/10">
                            <TrendingUp className="w-3.5 h-3.5" /> +5.2% MARKET INDEX
                          </div>
                          <p className="text-[10px] font-bold text-primary-foreground/40 uppercase tracking-widest italic">Est. Completion: Q4 2026</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="p-4 rounded-2xl bg-white/10 hover:bg-white/20 transition-colors border border-white/10">
                          <Download className="w-5 h-5" />
                        </button>
                        <button className="p-4 rounded-2xl bg-white/10 hover:bg-white/20 transition-colors border border-white/10">
                          <Share2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </Card>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Cost Breakdown */}
                  <motion.div variants={itemVariants}>
                    <Card title="Allocation Matrix" description="Distribution across infrastructure tiers" className="border-none shadow-premium h-full">
                      <div className="mt-8 space-y-8">
                        {breakdownItems.map((item, i) => (
                          <div key={item.name} className="space-y-3 group">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={cn("p-2 rounded-lg bg-sidebar-background group-hover:bg-white shadow-sm transition-colors", item.color.replace('bg-', 'text-'))}>
                                  <item.icon className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-bold tracking-tight">{item.name}</span>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-black tracking-tight">{item.cost}</p>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{item.percentage}%</p>
                              </div>
                            </div>
                            <div className="h-1.5 w-full bg-sidebar-background rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${item.percentage}%` }}
                                transition={{ duration: 1, delay: 0.5 + (i * 0.1) }}
                                className={cn("h-full rounded-full transition-all duration-1000", item.color)}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </motion.div>

                  {/* Charts Placeholder */}
                  <motion.div variants={itemVariants}>
                    <Card title="Market Volatility" description="Regional pricing trends" className="border-none shadow-premium h-full">
                      <div className="mt-8 aspect-square w-full bg-sidebar-background/50 rounded-3xl relative flex flex-col items-center justify-center overflow-hidden border border-border/40">
                        {/* Technical Grid Overlay */}
                        <div className="absolute inset-0 opacity-[0.03]" 
                             style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '32px 32px' }} 
                        />
                        
                        {/* Mock Radial Chart */}
                        <div className="relative w-56 h-56 rounded-full flex items-center justify-center">
                           <svg className="w-full h-full transform -rotate-90">
                             <circle cx="112" cy="112" r="90" fill="none" stroke="currentColor" strokeWidth="24" className="text-white shadow-sm" />
                             <motion.circle 
                               initial={{ strokeDasharray: "0 1000" }}
                               animate={{ strokeDasharray: "400 1000" }}
                               transition={{ duration: 1.5, delay: 1 }}
                               cx="112" cy="112" r="90" fill="none" stroke="currentColor" strokeWidth="24" strokeDashoffset="0" className="text-primary" 
                             />
                           </svg>
                           <div className="absolute inset-0 flex items-center justify-center flex-col">
                             <p className="text-3xl font-black italic tracking-tighter">$115</p>
                             <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">USD / Sq Ft</p>
                           </div>
                        </div>

                        <div className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-white/50 backdrop-blur-md border border-white/50 flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            <Info className="w-4 h-4" />
                          </div>
                          <p className="text-[10px] font-bold text-foreground/70 leading-relaxed uppercase tracking-wide">
                            Costs are 12% lower than national average for this sector.
                          </p>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </PageContainer>
  );
}
