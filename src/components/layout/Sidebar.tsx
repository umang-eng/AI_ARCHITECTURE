"use client";

import React, { useState, useCallback, useEffect } from "react";
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

export const Sidebar = () => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggle = useCallback(() => setIsOpen((v) => !v), []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) setIsOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen]);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <>
      {/* ═══ HAMBURGER BUTTON ═══ */}
      <button
        onClick={toggle}
        className={cn(
          "hidden lg:flex fixed z-50 items-center justify-center transition-all duration-300 ease-out",
          isOpen
            ? "top-6 left-[188px] w-10 h-10 rounded-xl bg-white/90 backdrop-blur-xl shadow-lg border border-border/30"
            : "top-1/2 -translate-y-1/2 left-3 w-12 h-12 rounded-2xl bg-white/90 backdrop-blur-xl shadow-lg border border-border/30 hover:shadow-xl"
        )}
        aria-label="Toggle menu"
      >
        <div className="flex flex-col gap-[5px] w-5">
          <span
            className={cn(
              "block h-[2px] bg-foreground rounded-full transition-all duration-300",
              isOpen ? "rotate-45 translate-[7px]" : ""
            )}
          />
          <span
            className={cn(
              "block h-[2px] bg-foreground rounded-full transition-all duration-300",
              isOpen ? "opacity-0 scale-x-0" : ""
            )}
          />
          <span
            className={cn(
              "block h-[2px] bg-foreground rounded-full transition-all duration-300",
              isOpen ? "-rotate-45 -translate-y-[7px]" : ""
            )}
          />
        </div>
      </button>

      {/* ═══ DESKTOP SIDEBAR (click toggle) ═══ */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsOpen(false)}
              className="hidden lg:block fixed inset-0 z-40 bg-black/10 backdrop-blur-[1px]"
            />
            <motion.aside
              initial={{ x: -240, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -240, opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              className="hidden lg:flex fixed left-3 top-3 bottom-3 z-40 w-[220px] flex-col bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-border/30 overflow-hidden"
            >
              {/* Top: Branding */}
              <div className="flex items-center h-14 px-4 border-b border-border/20">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
                    <Ruler className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-bold text-foreground">
                    AI Architect
                  </span>
                </div>
              </div>

              {/* Navigation */}
              <nav className="flex-1 py-3 px-2.5 space-y-0.5 overflow-y-auto custom-scrollbar">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 h-10 px-3 rounded-xl transition-all duration-200 group relative",
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
                      <span className="text-[13px] font-medium whitespace-nowrap">
                        {item.name}
                      </span>
                      {isActive && (
                        <motion.div
                          layoutId="sidebar-active"
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary"
                        />
                      )}
                    </Link>
                  );
                })}
              </nav>

              {/* Bottom */}
              <div className="p-2.5 space-y-2 border-t border-border/20">
                <Link
                  href="/blueprint"
                  className="flex items-center h-10 px-3 gap-2 rounded-xl bg-primary text-primary-foreground transition-all duration-200"
                >
                  <Plus className="w-4 h-4 shrink-0" />
                  <span className="text-[13px] font-medium whitespace-nowrap">
                    New Blueprint
                  </span>
                </Link>

                <div className="flex items-center h-10 px-3 gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                    UA
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-foreground truncate">
                      Umang Agrawal
                    </p>
                    <p className="text-[9px] text-muted-foreground truncate">
                      Lead Architect
                    </p>
                  </div>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ═══ MOBILE: hamburger button ═══ */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 w-12 h-12 rounded-2xl bg-white/90 backdrop-blur-xl shadow-lg border border-border/30 flex items-center justify-center"
        aria-label="Open menu"
      >
        <div className="flex flex-col gap-[5px] w-5">
          <span className="block h-[2px] bg-foreground rounded-full" />
          <span className="block h-[2px] bg-foreground rounded-full" />
          <span className="block h-[2px] bg-foreground rounded-full" />
        </div>
      </button>

      {/* ═══ MOBILE: slide-out sidebar ═══ */}
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
              <div className="flex flex-col h-full bg-white/95 backdrop-blur-xl border-r border-border/30 shadow-2xl">
                {/* Top: Branding + Close */}
                <div className="flex items-center justify-between h-14 px-4 border-b border-border/20">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
                      <Ruler className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-bold text-foreground">
                      AI Architect
                    </span>
                  </div>
                  <button
                    onClick={() => setIsMobileOpen(false)}
                    className="w-8 h-8 rounded-lg hover:bg-primary/5 flex items-center justify-center text-muted-foreground"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-3 px-2.5 space-y-0.5 overflow-y-auto custom-scrollbar">
                  {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setIsMobileOpen(false)}
                        className={cn(
                          "flex items-center gap-3 h-10 px-3 rounded-xl transition-all duration-200 group relative",
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
                        <span className="text-[13px] font-medium whitespace-nowrap">
                          {item.name}
                        </span>
                        {isActive && (
                          <motion.div
                            layoutId="sidebar-active-mobile"
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary"
                          />
                        )}
                      </Link>
                    );
                  })}
                </nav>

                {/* Bottom */}
                <div className="p-2.5 space-y-2 border-t border-border/20">
                  <Link
                    href="/blueprint"
                    onClick={() => setIsMobileOpen(false)}
                    className="flex items-center h-10 px-3 gap-2 rounded-xl bg-primary text-primary-foreground transition-all duration-200"
                  >
                    <Plus className="w-4 h-4 shrink-0" />
                    <span className="text-[13px] font-medium whitespace-nowrap">
                      New Blueprint
                    </span>
                  </Link>

                  <div className="flex items-center h-10 px-3 gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                      UA
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium text-foreground truncate">
                        Umang Agrawal
                      </p>
                      <p className="text-[9px] text-muted-foreground truncate">
                        Lead Architect
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
