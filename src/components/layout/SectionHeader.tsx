import React from "react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

export const SectionHeader = ({
  title,
  description,
  children,
  className,
}: SectionHeaderProps) => {
  return (
    <div className={cn("flex items-end justify-between gap-4 mb-6", className)}>
      <div className="space-y-1">
        <h2 className="text-3xl font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        {description && (
          <p className="text-muted-foreground text-lg">{description}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-3">{children}</div>}
    </div>
  );
};
