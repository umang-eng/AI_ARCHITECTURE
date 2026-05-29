"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
  noPadding?: boolean;
  hover?: boolean;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}

export const Card = ({ 
  children, 
  className, 
  title, 
  description, 
  noPadding = false,
  hover = true,
  onClick,
}: CardProps) => {
  return (
    <motion.div
      whileHover={hover ? { y: -4, boxShadow: "0 20px 40px rgba(0,0,0,0.06)" } : {}}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      className={cn(
        "bg-white border border-border/40 rounded-[16px] overflow-hidden shadow-premium",
        !noPadding && "p-6",
        className
      )}
      onClick={onClick}
    >
      {(title || description) && (
        <div className={cn("mb-6 space-y-1", noPadding && "p-6 pb-0")}>
          {title && <h3 className="text-xl font-semibold tracking-tight text-foreground">{title}</h3>}
          {description && (
            <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
          )}
        </div>
      )}
      {children}
    </motion.div>
  );
};
