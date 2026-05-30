"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Excalidraw } from "@excalidraw/excalidraw";
import { exportToSvg, exportToBlob } from "@excalidraw/excalidraw";
import { useBlueprintStore } from "@/store/blueprint-store";

export default function ExcalidrawWrapper() {
  const excalidrawAPIRef = useRef<any>(null);
  const { excalidrawElements, blueprint, updateExcalidrawElements } = useBlueprintStore();
  const [isReady, setIsReady] = useState(false);
  const prevBlueprintId = useRef<string | null>(null);

  // Sync Excalidraw scene when blueprint changes
  useEffect(() => {
    if (!excalidrawAPIRef.current || !isReady) return;
    if (excalidrawElements.length === 0) return;

    const api = excalidrawAPIRef.current;
    const blueprintId = blueprint?.metadata?.generation_timestamp || "";
    if (blueprintId === prevBlueprintId.current) return;
    prevBlueprintId.current = blueprintId;

    api.updateScene({ elements: excalidrawElements });

    setTimeout(() => {
      try {
        api.scrollToContent(excalidrawElements, { fitToViewport: true, viewportZoomFactor: 0.85 });
      } catch {}
    }, 150);
  }, [excalidrawElements, isReady, blueprint]);

  const handleReady = useCallback((api: any) => {
    excalidrawAPIRef.current = api;
    setIsReady(true);
  }, []);

  const handleChange = useCallback((elements: any, appState: any, files: any) => {
    updateExcalidrawElements([...elements]);
  }, [updateExcalidrawElements]);

  const exportSVG = useCallback(async (): Promise<string | null> => {
    if (!excalidrawAPIRef.current) return null;
    const elements = excalidrawAPIRef.current.getSceneElements();
    if (!elements || elements.length === 0) return null;
    const svg = await exportToSvg({
      elements,
      appState: { exportWithDarkMode: false },
      files: null,
    });
    return svg.outerHTML;
  }, []);

  const exportPNG = useCallback(async (): Promise<Blob | null> => {
    if (!excalidrawAPIRef.current) return null;
    const elements = excalidrawAPIRef.current.getSceneElements();
    if (!elements || elements.length === 0) return null;
    return exportToBlob({
      elements,
      appState: { exportWithDarkMode: false },
      files: null,
    });
  }, []);

  useEffect(() => {
    (window as any).__blueprintExport = { exportSVG, exportPNG };
    return () => { delete (window as any).__blueprintExport; };
  }, [exportSVG, exportPNG]);

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Excalidraw
        excalidrawAPI={handleReady}
        onChange={handleChange}
        initialData={{
          elements: excalidrawElements as any,
          appState: {
            viewBackgroundColor: "#ffffff",
            gridSize: 10,
            gridModeEnabled: true,
          },
        }}
        UIOptions={{
          canvasActions: {
            loadScene: false,
            saveToActiveFile: false,
            export: { saveFileToDisk: false },
          },
          tools: { image: false },
        }}
        langCode="en"
      />
    </div>
  );
}
