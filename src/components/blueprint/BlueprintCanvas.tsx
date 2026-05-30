"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useBlueprintStore } from "@/store/blueprint-store";
import { cn } from "@/lib/utils";

// Dynamically import Excalidraw (no SSR)
const ExcalidrawWrapper = dynamic(
  () => import("./ExcalidrawWrapper").then((mod) => mod.default),
  { ssr: false },
);

interface BlueprintCanvasProps {
  className?: string;
}

export default function BlueprintCanvas({ className }: BlueprintCanvasProps) {
  const { excalidrawElements, blueprint } = useBlueprintStore();

  return (
    <div className={cn("w-full h-full", className)}>
      <ExcalidrawWrapper />
    </div>
  );
}
