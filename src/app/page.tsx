"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card } from "@/components/ui-custom/Card";
import { PrimaryButton } from "@/components/ui-custom/Buttons";
import { cn } from "@/lib/utils";
import { getHealth } from "@/lib/api";
import { motion } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  Clock,
  FileCode,
  Search,
  ChevronRight,
} from "lucide-react";

const recentProjects = [
  {
    id: 1,
    title: "Modern Minimalist Villa",
    type: "Residential",
    lastEdited: "2 hours ago",
    status: "Draft",
  },
  {
    id: 2,
    title: "Eco-Tech Office Hub",
    type: "Commercial",
    lastEdited: "1 day ago",
    status: "Completed",
  },
  {
    id: 3,
    title: "Skyline Penthouse",
    type: "Residential",
    lastEdited: "3 days ago",
    status: "Review",
  },
];

const optionChips = ["Plot Size", "Building Type", "Style", "Budget"];

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

export default function Home() {
  const router = useRouter();
  const [selectedChip, setSelectedChip] = useState<string>(optionChips[0]);
  const [backendHealthy, setBackendHealthy] = useState<boolean | null>(null);
  const [backendStatus, setBackendStatus] = useState<string>("Checking backend connectivity...");

  const handleStartProject = () => router.push('/projects');
  const handleViewAll = () => router.push('/projects');
  const handleProjectClick = (projectId: number) => router.push('/projects');
  const handlePreviewClick = () => router.push('/3d-design');

  useEffect(() => {
    getHealth()
      .then((result) => {
        if (result.success) {
          setBackendHealthy(result.data.status === "healthy");
          setBackendStatus(`Backend ${result.data.status} • ${result.data.version}`);
        } else {
          setBackendHealthy(false);
          setBackendStatus(result.error);
        }
      })
      .catch((error) => {
        setBackendHealthy(false);
        setBackendStatus(String(error));
      });
  }, []);

  return (
    <PageContainer className="flex flex-col items-center py-12 md:py-20">
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-4xl w-full text-center space-y-16 md:space-y-24"
      >
        {/* Section 1: Hero */}
        <motion.div variants={itemVariants} className="space-y-6">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground leading-[1.05]">
            Design Your Dream Building <br />
            <span className="text-primary/90 relative inline-block">
              With AI
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="absolute bottom-2 left-0 h-1 bg-primary/20 rounded-full"
              />
            </span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Transform your architectural vision into blueprints, floor plans, and 3D designs in minutes with our advanced AI engine.
          </p>
          <div className="inline-flex items-center justify-center gap-2 mx-auto rounded-full border px-4 py-2 text-sm font-semibold text-foreground/70 shadow-sm transition-all">
            <span className={cn(
              "inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.25em]",
              backendHealthy === true ? "bg-emerald-500/10 text-emerald-600 border border-emerald-200" : "bg-amber-500/10 text-amber-700 border border-amber-200"
            )}>
              {backendHealthy === true ? "Backend connected" : backendHealthy === false ? "Backend unreachable" : "Checking backend"}
            </span>
            <span className="hidden sm:inline">{backendStatus}</span>
          </div>
        </motion.div>

        {/* Section 2: Architecture Preview Card */}
        <motion.div variants={itemVariants} className="w-full">
          <Card 
            noPadding 
            className="aspect-video w-full bg-sidebar-background flex items-center justify-center border-dashed border-2 border-border/60 overflow-hidden relative group cursor-pointer"
            onClick={handlePreviewClick}
          >
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-10 group-hover:opacity-20 transition-opacity duration-700" />
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="text-center space-y-4 relative z-10"
            >
              <div className="p-5 rounded-2xl bg-white/90 backdrop-blur-md mx-auto w-fit shadow-premium">
                <Sparkles className="w-10 h-10 text-primary" />
              </div>
              <p className="text-sm font-bold text-foreground/40 uppercase tracking-[0.2em]">
                Interactive 3D Preview
              </p>
            </motion.div>
          </Card>
        </motion.div>

        {/* Section 3 & 4: Prompt Input & Chips */}
        <motion.div variants={itemVariants} className="w-full space-y-8">
          <div className="relative group">
            <div className="absolute left-6 top-8 text-muted-foreground group-focus-within:text-primary transition-colors">
              <Search className="w-6 h-6" />
            </div>
            <textarea
              placeholder="Describe your building project..."
              className="w-full bg-white border border-border/40 rounded-[32px] pt-8 pb-12 pl-16 pr-8 text-xl shadow-premium focus:outline-none focus:ring-4 focus:ring-primary/5 min-h-[160px] resize-none transition-all placeholder:text-muted-foreground/50"
            />
            <div className="absolute right-8 bottom-6">
              <p className="text-xs text-muted-foreground italic bg-sidebar-background/50 px-3 py-1 rounded-full">
                Example: Modern villa on a 60x80 plot with 4 bedrooms and swimming pool.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {optionChips.map((chip) => {
              const isSelected = chip === selectedChip;
              return (
                <motion.button
                  key={chip}
                  type="button"
                  whileHover={{ scale: 1.05, backgroundColor: "#fff" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedChip(chip)}
                  className={cn(
                    "px-6 py-2.5 rounded-full border text-sm font-semibold transition-all shadow-sm",
                    isSelected
                      ? "bg-primary text-white border-primary"
                      : "bg-white border-border/40 text-muted-foreground hover:text-foreground hover:border-primary/50 hover:shadow-md"
                  )}
                >
                  {chip}
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Section 5: Start Project Button */}
        <motion.div variants={itemVariants}>
          <PrimaryButton
            type="button"
            className="h-16 px-12 text-xl flex items-center gap-3 group"
            onClick={handleStartProject}
          >
            Start Project 
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </PrimaryButton>
        </motion.div>

        {/* Section 6: Recent Projects */}
        <motion.div variants={itemVariants} className="w-full pt-16 space-y-8">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-2xl font-bold tracking-tight">Recent Projects</h3>
            <button
              type="button"
              onClick={handleViewAll}
              className="text-sm font-bold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
            >
              View All <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {recentProjects.map((project) => (
              <Card
                key={project.id}
                className="text-left group cursor-pointer p-6"
                onClick={() => handleProjectClick(project.id)}
              >
                <div className="space-y-6">
                  <div className="p-4 rounded-2xl bg-sidebar-background w-fit group-hover:bg-primary/5 transition-colors">
                    <FileCode className="w-6 h-6 text-foreground/70 group-hover:text-primary transition-colors" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg group-hover:text-primary transition-colors">
                      {project.title}
                    </h4>
                    <p className="text-sm text-muted-foreground font-medium mt-1">{project.type}</p>
                  </div>
                  <div className="pt-5 border-t border-border/40 flex items-center justify-between">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      {project.lastEdited}
                    </p>
                    <span className="text-[10px] px-2.5 py-1 rounded-full bg-sidebar-background group-hover:bg-primary/10 font-bold uppercase tracking-wider transition-colors">
                      {project.status}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </PageContainer>
  );
}
