"use client";

import React from "react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";

const Canvas2D = dynamic(
  () => import("./Canvas2D").then((mod) => mod.default),
  { ssr: false },
);

interface BlueprintCanvasProps {
  className?: string;
}

export default function BlueprintCanvas({ className }: BlueprintCanvasProps) {
  return (
    <div className={cn("w-full h-full", className)}>
      <Canvas2D />
    </div>
  );
}
