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
  ChevronLeft,
} from "lucide-react";

const navItems = [
  { name: "Home", href: "/", icon: Home },
  { name: "Projects", href: "/projects", icon: Folder },
  { name: "Blueprint", href: "/blueprint", icon: Ruler },
  { name: "3D Design", href: "/3d-design", icon: Box },
  { name: "Interior", href: "/interior-design", icon: Armchair },
  { name: "Cost", href: "/cost-estimation", icon: Banknote },
  { name: "Settings", href: "/settings", icon: Settings },
];

const SIDEBAR_COLLAPSED = 60;
const SIDEBAR_EXPANDED = 220;

export const Sidebar = () => {
  const pathname = usePathname();
  const [isHovered, setIsHovered] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const sidebarContent = (
    <div
      className={cn(
        "flex flex-col h-full bg-white/90 backdrop-blur-xl border-r border-border/30 shadow-lg transition-all duration-300 ease-out",
        isHovered ? "w-[220px]" : "w-[60px]"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Top: Branding + Toggle */}
      <div className="flex items-center h-14 px-3 border-b border-border/20">
        <div className="flex items-center gap-2 min-w-0 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <Ruler className="w-4 h-4 text-white" />
          </div>
          <AnimatePresence>
            {isHovered && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="text-sm font-bold text-foreground whitespace-nowrap overflow-hidden"
              >
                AI Architect
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Middle: Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 h-10 rounded-xl transition-all duration-200 group relative",
                isHovered ? "px-3" : "px-0 justify-center",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-primary/5 hover:text-foreground"
              )}
            >
              <item.icon
                className={cn(
                  "w-[18px] h-[18px] shrink-0 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              <AnimatePresence>
                {isHovered && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="text-[13px] font-medium whitespace-nowrap overflow-hidden"
                  >
                    {item.name}
                  </motion.span>
                )}
              </AnimatePresence>
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className={cn(
                    "absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary",
                    !isHovered && "left-1/2 -translate-x-1/2 top-auto -translate-y-0 bottom-1 w-1 h-1 rounded-full"
                  )}
                />
              )}
              {/* Tooltip when collapsed */}
              {!isHovered && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-foreground text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                  {item.name}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: New Project + User */}
      <div className="p-2 space-y-2 border-t border-border/20">
        <Link
          href="/blueprint"
          className={cn(
            "flex items-center h-10 rounded-xl bg-primary text-primary-foreground transition-all duration-200",
            isHovered ? "px-3 gap-2 justify-center" : "justify-center px-0"
          )}
        >
          <Plus className="w-4 h-4 shrink-0" />
          <AnimatePresence>
            {isHovered && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="text-[13px] font-medium whitespace-nowrap overflow-hidden"
              >
                New Blueprint
              </motion.span>
            )}
          </AnimatePresence>
        </Link>

        {/* User Avatar */}
        <div
          className={cn(
            "flex items-center h-10 rounded-xl transition-all duration-200",
            isHovered ? "px-3 gap-2" : "justify-center px-0"
          )}
        >
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
            UA
          </div>
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="min-w-0 overflow-hidden"
              >
                <p className="text-[11px] font-medium text-foreground truncate">Umang Agrawal</p>
                <p className="text-[9px] text-muted-foreground truncate">Lead Architect</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar - floating */}
      <aside
        className="hidden lg:block fixed left-3 top-3 bottom-3 z-40 rounded-2xl overflow-hidden"
        style={{ width: isHovered ? SIDEBAR_EXPANDED : SIDEBAR_COLLAPSED }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 rounded-xl bg-white/90 backdrop-blur-xl shadow-lg border border-border/30 text-foreground"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="4" x2="20" y1="12" y2="12"/>
          <line x1="4" x2="20" y1="6" y2="6"/>
          <line x1="4" x2="20" y1="18" y2="18"/>
        </svg>
      </button>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
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
