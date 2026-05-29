"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Folder,
  Ruler,
  Box,
  Armchair,
  Banknote,
  Settings,
  Plus,
  Menu,
  X,
} from "lucide-react";

const navItems = [
  { name: "Home", href: "/", icon: Home },
  { name: "Projects", href: "/projects", icon: Folder },
  { name: "Blueprint", href: "/blueprint", icon: Ruler },
  { name: "3D Design", href: "/3d-design", icon: Box },
  { name: "Interior Design", href: "/interior-design", icon: Armchair },
  { name: "Cost Estimation", href: "/cost-estimation", icon: Banknote },
  { name: "Settings", href: "/settings", icon: Settings },
];

export const Sidebar = () => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const sidebarContent = (
    <div className="flex flex-col h-full bg-sidebar-background border-r border-border/40">
      {/* Top: Branding */}
      <div className="p-8 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          AI Architect
        </h1>
        <button 
          className="lg:hidden p-2 rounded-lg hover:bg-white/50"
          onClick={() => setIsOpen(false)}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Middle: Navigation */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-[12px] transition-all duration-200 group",
                isActive
                  ? "bg-white text-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-white/50 hover:text-foreground"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5 transition-transform duration-200 group-hover:scale-110",
                isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
              )} />
              {item.name}
              {isActive && (
                <motion.div
                  layoutId="active-nav"
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-primary"
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: Version & User Info */}
      <div className="p-4 border-t border-border/40 space-y-4">
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-[12px] font-medium shadow-sm hover:opacity-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          New Project
        </motion.button>
        
        <div className="flex items-center gap-3 px-4 py-2 hover:bg-white/50 rounded-[12px] cursor-pointer transition-colors group">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary group-hover:bg-primary/20 transition-colors">
            UA
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">Umang Agrawal</p>
            <p className="text-xs text-muted-foreground truncate">Lead Architect</p>
          </div>
        </div>

        <div className="px-4 py-2 flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
            Version 1.0
          </p>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-6 left-6 z-50">
        <button 
          onClick={() => setIsOpen(true)}
          className="p-3 rounded-xl bg-white shadow-premium border border-border/40 text-foreground"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-[260px] h-screen fixed left-0 top-0 z-40">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60] lg:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-[280px] z-[70] lg:hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
