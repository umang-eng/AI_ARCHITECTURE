"use client";

import React from "react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";

const ExcalidrawWrapper = dynamic(
  () => import("./ExcalidrawWrapper").then((mod) => mod.default),
  { ssr: false },
);

interface BlueprintCanvasProps {
  className?: string;
}

export default function BlueprintCanvas({ className }: BlueprintCanvasProps) {
  return (
    <div className={cn("w-full h-full", className)}>
      <ExcalidrawWrapper />
    </div>
  );
}
