"use client";

import React, { useState, useEffect } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { Card } from "@/components/ui-custom/Card";
import { PrimaryButton, SecondaryButton } from "@/components/ui-custom/Buttons";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  MoreVertical,
  ExternalLink,
  Copy,
  Trash2,
  Calendar,
  Building2,
  ArrowUpRight,
  Filter,
  LayoutGrid,
  List,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { getProjects } from "@/lib/api";
import type { Project } from "@/types/api";

const demoProjects = [
  {
    id: 1,
    name: "Luxury Villa",
    createdDate: "Oct 24, 2025",
    type: "Residential",
    status: "In Progress",
    image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=2071&auto=format&fit=crop",
  },
  {
    id: 2,
    name: "Apartment Building",
    createdDate: "Oct 20, 2025",
    type: "Commercial",
    status: "Completed",
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=2070&auto=format&fit=crop",
  },
  {
    id: 3,
    name: "Commercial Office",
    createdDate: "Oct 15, 2025",
    type: "Office",
    status: "Draft",
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop",
  },
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

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
};

export default function ProjectsPage() {
  const [backendError, setBackendError] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProjects() {
      setLoading(true);
      const result = await getProjects();
      if (result.success) {
        setProjects(result.data);
        setBackendError(null);
      } else {
        setProjects([]);
        setBackendError(result.error);
      }
      setLoading(false);
    }

    loadProjects();
  }, []);

  const activeProjects = projects && projects.length ? projects : demoProjects;

  const getProjectName = (project: Project | typeof demoProjects[number]) =>
    "project_name" in project ? project.project_name : project.name;

  const getProjectType = (project: Project | typeof demoProjects[number]) =>
    "building_type" in project ? project.building_type : project.type;

  const getProjectDate = (project: Project | typeof demoProjects[number]) =>
    "created_at" in project
      ? new Date(project.created_at).toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : project.createdDate;

  const getProjectImage = (project: Project | typeof demoProjects[number]) =>
    "image" in project
      ? project.image
      : "https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=2070&auto=format&fit=crop";

  const getProjectStatus = (project: Project | typeof demoProjects[number]) => {
    const status = project.status;
    if (status === "completed" || status === "Completed") return "Completed";
    if (status === "in_progress" || status === "In Progress") return "In Progress";
    if (status === "review" || status === "Review") return "Review";
    if (status === "draft" || status === "Draft") return "Draft";
    return status;
  };

  return (
    <PageContainer>
      <SectionHeader
        title="My Projects"
        description="Manage and organize your architectural designs."
      >
        <PrimaryButton className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Project
        </PrimaryButton>
      </SectionHeader>

      {backendError && (
        <div className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Unable to fetch live projects from the backend: {backendError}. If you are not signed in, please authenticate or continue with demo projects.
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-12">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Search projects..."
            className="w-full bg-white border border-border/40 rounded-[16px] py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all shadow-sm"
          />
        </div>
        <div className="flex gap-3">
          <SecondaryButton className="h-12 px-5 text-sm flex items-center gap-2">
            <Filter className="w-4 h-4" /> Filter
          </SecondaryButton>
          <div className="flex p-1 bg-sidebar-background rounded-xl border border-border/40">
            <button className="p-2 rounded-lg bg-white shadow-sm text-primary">
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground">
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate={loading ? "hidden" : "visible"}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
      >
        <AnimatePresence>
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <div className="aspect-[16/10] bg-sidebar-background rounded-[16px] animate-pulse" />
                <div className="h-6 bg-sidebar-background rounded-lg animate-pulse w-3/4" />
                <div className="h-4 bg-sidebar-background rounded-lg animate-pulse w-1/2" />
              </div>
            ))
          ) : (
            (projects && projects.length ? projects : demoProjects).map((project) => (
              <motion.div key={project.id} variants={cardVariants}>
                <Card className="group p-0 h-full border-border/40 flex flex-col">
                  {/* Project Preview Image */}
                  <div className="aspect-[16/10] relative overflow-hidden bg-sidebar-background">
                    <img
                      src={getProjectImage(project)}
                      alt={getProjectName(project)}
                      className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        whileHover={{ scale: 1 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="p-4 rounded-full bg-white shadow-premium text-primary"
                      >
                        <ArrowUpRight className="w-6 h-6" />
                      </motion.div>
                    </div>
                    <div className="absolute top-4 right-4">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md shadow-sm border",
                        getProjectStatus(project) === "Completed" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                        getProjectStatus(project) === "In Progress" ? "bg-blue-500/10 text-blue-600 border-blue-500/20" :
                        "bg-amber-500/10 text-amber-600 border-amber-500/20"
                      )}>
                        {getProjectStatus(project)}
                      </span>
                    </div>
                  </div>

                  {/* Project Details */}
                  <div className="p-6 flex-1 flex flex-col space-y-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2">
                        <h3 className="font-bold text-xl tracking-tight group-hover:text-primary transition-colors leading-tight">
                          {getProjectName(project)}
                        </h3>
                        <div className="flex items-center gap-4 text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                          <span className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5" />
                            {getProjectType(project)}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            {getProjectDate(project)}
                          </span>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-2 hover:bg-sidebar-background rounded-xl transition-colors text-muted-foreground hover:text-foreground">
                            <MoreVertical className="w-5 h-5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 rounded-[16px] p-2 shadow-premium border-border/40">
                          <DropdownMenuItem className="flex items-center gap-3 rounded-xl p-2.5 cursor-pointer font-medium">
                            <ExternalLink className="w-4 h-4" /> Open Project
                          </DropdownMenuItem>
                          <DropdownMenuItem className="flex items-center gap-3 rounded-xl p-2.5 cursor-pointer font-medium">
                            <Copy className="w-4 h-4" /> Duplicate
                          </DropdownMenuItem>
                          <div className="h-px bg-border/40 my-1" />
                          <DropdownMenuItem className="flex items-center gap-3 rounded-xl p-2.5 cursor-pointer font-medium text-destructive focus:text-destructive focus:bg-destructive/5">
                            <Trash2 className="w-4 h-4" /> Delete Project
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="pt-6 mt-auto border-t border-border/40 flex items-center gap-3">
                      <PrimaryButton className="flex-1 h-11 text-xs font-bold rounded-xl">
                        Continue Designing
                      </PrimaryButton>
                      <SecondaryButton className="h-11 w-11 p-0 rounded-xl flex items-center justify-center">
                        <Copy className="w-4 h-4" />
                      </SecondaryButton>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </motion.div>
    </PageContainer>
  );
}
