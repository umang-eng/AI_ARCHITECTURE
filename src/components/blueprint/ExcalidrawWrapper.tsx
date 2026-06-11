"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Excalidraw } from "@excalidraw/excalidraw";
import { exportToSvg, exportToBlob } from "@excalidraw/excalidraw";
import { useBlueprintStore } from "@/store/blueprint-store";

const EMPTY_ELEMENTS: any[] = [];

export default function ExcalidrawWrapper() {
  const blueprint = useBlueprintStore((s) => s.blueprint);
  const excalidrawElements = useBlueprintStore((s) => s.excalidrawElements);
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);

  const sceneKey = useMemo(() => {
    if (!blueprint) return "blueprint-excalidraw-empty";
    return `blueprint-excalidraw-${blueprint.metadata.variant}-${blueprint.plot.width}x${blueprint.plot.height}`;
  }, [blueprint]);

  const handleReady = useCallback((api: any) => {
    setExcalidrawAPI(api);
  }, []);

  const exportSVG = useCallback(async (): Promise<string | null> => {
    if (!excalidrawAPI) return null;
    const elements = excalidrawAPI.getSceneElements();
    if (!elements || elements.length === 0) return null;
    const svg = await exportToSvg({
      elements,
      appState: { exportWithDarkMode: false },
      files: null,
    });
    return svg.outerHTML;
  }, [excalidrawAPI]);

  const exportPNG = useCallback(async (): Promise<Blob | null> => {
    if (!excalidrawAPI) return null;
    const elements = excalidrawAPI.getSceneElements();
    if (!elements || elements.length === 0) return null;
    return exportToBlob({
      elements,
      appState: { exportWithDarkMode: false },
      files: null,
    });
  }, [excalidrawAPI]);

  useEffect(() => {
    (window as any).__blueprintExport = { exportSVG, exportPNG };
    return () => {
      delete (window as any).__blueprintExport;
    };
  }, [exportSVG, exportPNG]);

  useEffect(() => {
    if (!excalidrawAPI) return;
    if (excalidrawElements.length === 0) return;

    try {
      excalidrawAPI.updateScene({ elements: excalidrawElements });
      excalidrawAPI.scrollToContent(excalidrawElements, {
        fitToViewport: true,
        viewportZoomFactor: 0.9,
      });
    } catch {
      // ignore update issues during initialization
    }
  }, [excalidrawAPI, excalidrawElements]);

  // Hide Excalidraw hamburger menu button
  useEffect(() => {
    const hideMenuButton = () => {
      const selectors = [
        ".excalidraw .dropdown-menu-button.main-menu-trigger",
        ".excalidraw [class*='main-menu-trigger']",
        ".excalidraw [class*='App-menu_button']",
        ".excalidraw button[data-testid='menu-button']",
      ];
      for (const sel of selectors) {
        const btn = document.querySelector<HTMLElement>(sel);
        if (btn) {
          btn.style.display = "none";
          btn.style.visibility = "hidden";
          btn.style.width = "0";
          btn.style.height = "0";
          btn.style.overflow = "hidden";
          btn.style.pointerEvents = "none";
        }
      }
    };

    hideMenuButton();
    const id = setInterval(hideMenuButton, 500);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "visible" }}>
      <Excalidraw
        key={sceneKey}
        excalidrawAPI={handleReady}
        initialData={{ elements: excalidrawElements.length ? excalidrawElements : EMPTY_ELEMENTS } as any}
        UIOptions={{
          canvasActions: {
            loadScene: false,
            saveToActiveFile: false,
            export: { saveFileToDisk: false },
            changeViewBackgroundColor: false,
            toggleTheme: false,
          },
          tools: { image: false },
        }}
        langCode="en"
      />
      <div className="blueprint-grid-overlay" />
    </div>
  );
}
