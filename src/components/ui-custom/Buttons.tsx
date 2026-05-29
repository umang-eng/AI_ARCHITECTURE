"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
}

export const PrimaryButton = ({ children, className, ...props }: ButtonProps) => {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "bg-primary text-primary-foreground h-12 px-6 rounded-[12px] font-medium shadow-sm hover:shadow-md transition-all active:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      {...props as any}
    >
      {children}
    </motion.button>
  );
};

export const SecondaryButton = ({
  children,
  className,
  ...props
}: ButtonProps) => {
  return (
    <motion.button
      whileHover={{ scale: 1.02, backgroundColor: "var(--sidebar-background)" }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "bg-white text-foreground border border-border/50 h-12 px-6 rounded-[12px] font-medium shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      {...props as any}
    >
      {children}
    </motion.button>
  );
};
