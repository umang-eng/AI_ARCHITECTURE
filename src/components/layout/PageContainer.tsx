"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const PageContainer = ({ children, className }: PageContainerProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      className={cn("flex-1 p-6 md:p-8 lg:p-12 overflow-y-auto h-screen scroll-smooth", className)}
    >
      <div className="max-w-7xl mx-auto space-y-8 md:space-y-12">
        {children}
      </div>
    </motion.div>
  );
};
