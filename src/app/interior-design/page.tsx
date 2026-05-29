"use client";

import React, { useState } from "react";
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
  Heart,
  Share2,
  Download,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const categories = [
  { id: "living", name: "Living Room", icon: Sofa },
  { id: "bedroom", name: "Bedroom", icon: Bed },
  { id: "kitchen", name: "Kitchen", icon: UtensilsCrossed },
  { id: "bathroom", name: "Bathroom", icon: Bath },
  { id: "office", name: "Office", icon: Briefcase },
];

const mockGallery = [
  {
    id: 1,
    title: "Minimalist Scandi",
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=2158&auto=format&fit=crop",
    aspect: "aspect-[3/4]",
  },
  {
    id: 2,
    title: "Industrial Loft",
    image: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=2070&auto=format&fit=crop",
    aspect: "aspect-[1/1]",
  },
  {
    id: 3,
    title: "Modern Japandi",
    image: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?q=80&w=2070&auto=format&fit=crop",
    aspect: "aspect-[4/5]",
  },
  {
    id: 4,
    title: "Urban Jungle",
    image: "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?q=80&w=2070&auto=format&fit=crop",
    aspect: "aspect-[3/2]",
  },
  {
    id: 5,
    title: "Classical Elegance",
    image: "https://images.unsplash.com/photo-1616486341351-793db4015093?q=80&w=2155&auto=format&fit=crop",
    aspect: "aspect-[4/3]",
  },
  {
    id: 6,
    title: "Mid-Century Modern",
    image: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=2000&auto=format&fit=crop",
    aspect: "aspect-[3/4]",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function InteriorDesign() {
  const [selectedCategory, setSelectedCategory] = useState("living");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setShowResults(true);
    }, 3000);
  };

  return (
    <PageContainer>
      <SectionHeader
        title="Interior Designer"
        description="Visualize stunning interior concepts tailored to your architectural style."
      />

      <div className="space-y-16">
        {/* Section 1: Categories */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6"
        >
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = selectedCategory === cat.id;
            return (
              <motion.button
                key={cat.id}
                variants={itemVariants}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "p-8 rounded-[24px] border transition-all flex flex-col items-center gap-4 group relative overflow-hidden",
                  isActive
                    ? "bg-primary text-primary-foreground border-primary shadow-premium scale-[1.02]"
                    : "bg-white text-muted-foreground border-border/40 hover:bg-sidebar-background hover:border-primary/20 shadow-sm"
                )}
              >
                {isActive && (
                  <motion.div 
                    layoutId="cat-bg"
                    className="absolute inset-0 bg-primary z-0"
                  />
                )}
                <div className={cn(
                  "p-4 rounded-2xl transition-colors relative z-10",
                  isActive ? "bg-white/10" : "bg-sidebar-background group-hover:bg-white shadow-sm"
                )}>
                  <Icon className="w-8 h-8" />
                </div>
                <span className="text-sm font-bold tracking-tight relative z-10">{cat.name}</span>
              </motion.button>
            );
          })}
        </motion.div>

        {/* Section 2: Input Area */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="max-w-3xl mx-auto w-full space-y-6"
        >
          <Card noPadding className="shadow-premium border-none overflow-hidden group/input">
            <textarea
              placeholder="Describe your interior vision (e.g. Modern luxury living room with wooden textures and floor-to-ceiling windows)..."
              className="w-full bg-white p-8 text-xl focus:outline-none min-h-[160px] resize-none font-medium placeholder:text-muted-foreground/30"
            />
            <div className="bg-sidebar-background/30 p-6 border-t border-border/40 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest px-2">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                AI Optimization Active
              </div>
              <PrimaryButton 
                className="h-14 px-10 gap-3 text-lg shadow-premium w-full md:w-auto" 
                onClick={handleGenerate}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Wand2 className="w-5 h-5" />
                )}
                {isGenerating ? "Synthesizing..." : "Generate Concepts"}
              </PrimaryButton>
            </div>
          </Card>
        </motion.div>

        {/* Section 3: Results */}
        <AnimatePresence mode="wait">
          {(isGenerating || showResults) && (
            <motion.div 
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-12"
            >
              <div className="flex items-center justify-between border-b border-border/40 pb-6">
                <h3 className="text-2xl font-black tracking-tighter uppercase italic">Neural Gallery</h3>
                {showResults && !isGenerating && (
                  <div className="flex gap-3">
                    {[Share2, Download].map((Icon, i) => (
                      <button key={i} className="p-3 rounded-2xl bg-white shadow-premium border border-border/20 hover:text-primary transition-colors">
                        <Icon className="w-5 h-5" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
                {isGenerating ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <motion.div 
                      key={i} 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className={cn(
                        "w-full bg-sidebar-background rounded-[32px] animate-pulse relative overflow-hidden",
                        i % 3 === 0 ? "aspect-[3/4]" : i % 3 === 1 ? "aspect-[1/1]" : "aspect-[4/5]"
                      )}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent animate-shimmer" />
                    </motion.div>
                  ))
                ) : (
                  mockGallery.map((item, i) => (
                    <motion.div 
                      key={item.id} 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="relative group/item break-inside-avoid"
                    >
                      <div className={cn("relative overflow-hidden rounded-[32px] border border-border/20 shadow-premium", item.aspect)}>
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover/item:scale-110"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/item:opacity-100 transition-all duration-500 flex flex-col justify-between p-8 backdrop-blur-[2px]">
                          <div className="flex justify-end">
                            <motion.button 
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="p-4 rounded-2xl bg-white/10 backdrop-blur-xl text-white hover:bg-white/20 transition-colors border border-white/20"
                            >
                              <Heart className="w-6 h-6" />
                            </motion.button>
                          </div>
                          <div className="space-y-2">
                            <p className="text-white font-black text-2xl tracking-tighter uppercase italic">{item.title}</p>
                            <p className="text-white/60 text-[10px] font-bold uppercase tracking-[0.3em]">AI Visualization</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageContainer>
  );
}
