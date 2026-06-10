"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Excalidraw } from "@excalidraw/excalidraw";
import { exportToSvg, exportToBlob } from "@excalidraw/excalidraw";
import { useBlueprintStore } from "@/store/blueprint-store";

const EMPTY_ELEMENTS: any[] = [];

export default function ExcalidrawWrapper() {
  const excalidrawAPIRef = useRef<any>(null);
  const blueprint = useBlueprintStore((s) => s.blueprint);
  const excalidrawElements = useBlueprintStore((s) => s.excalidrawElements);
  const updateExcalidrawElements = useBlueprintStore((s) => s.updateExcalidrawElements);
  const [isReady, setIsReady] = useState(false);
  const prevElementsLen = useRef(0);
  const isSyncing = useRef(false);
  const mountedRef = useRef(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!excalidrawAPIRef.current || !isReady) return;
    if (excalidrawElements.length === 0) return;
    if (excalidrawElements.length === prevElementsLen.current) return;

    prevElementsLen.current = excalidrawElements.length;
    isSyncing.current = true;

    const api = excalidrawAPIRef.current;

    api.updateScene({ elements: excalidrawElements });

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (!mountedRef.current) return;
      try {
        api.scrollToContent(excalidrawElements, {
          fitToViewport: true,
          viewportZoomFactor: 0.9,
        });
      } catch {
        // silently ignore
      }
      setTimeout(() => {
        if (mountedRef.current) isSyncing.current = false;
      }, 500);
    }, 300);
  }, [excalidrawElements, isReady]);

  useEffect(() => {
    if (blueprint) {
      prevElementsLen.current = 0;
    }
  }, [blueprint]);

  const handleReady = useCallback((api: any) => {
    excalidrawAPIRef.current = api;
    setIsReady(true);
  }, []);

  const handleChange = useCallback(
    (_elements: any, _appState: any, _files: any) => {
      if (isSyncing.current) return;
      if (excalidrawAPIRef.current) {
        const sceneElements = excalidrawAPIRef.current.getSceneElements();
        if (sceneElements && sceneElements.length > 0) {
          updateExcalidrawElements([...sceneElements]);
        }
      }
    },
    [updateExcalidrawElements],
  );

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
    return () => {
      delete (window as any).__blueprintExport;
    };
  }, [exportSVG, exportPNG]);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <Excalidraw
        excalidrawAPI={handleReady}
        onChange={handleChange}
        initialData={{ elements: EMPTY_ELEMENTS } as any}
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
    </div>
  );
}
