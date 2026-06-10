"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Excalidraw } from "@excalidraw/excalidraw";
import { exportToSvg, exportToBlob } from "@excalidraw/excalidraw";
import { useBlueprintStore } from "@/store/blueprint-store";

const EMPTY_INITIAL_DATA = { elements: [] };

export default function ExcalidrawWrapper() {
  const excalidrawAPIRef = useRef<any>(null);
  const blueprint = useBlueprintStore((s) => s.blueprint);
  const excalidrawElements = useBlueprintStore((s) => s.excalidrawElements);
  const updateExcalidrawElements = useBlueprintStore((s) => s.updateExcalidrawElements);
  const [isReady, setIsReady] = useState(false);
  const prevBlueprintId = useRef<string | null>(null);
  const isSyncing = useRef(false);
  const mountedRef = useRef(true);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (!excalidrawAPIRef.current || !isReady) return;
    if (excalidrawElements.length === 0) return;

    const blueprintId = blueprint?.metadata?.generation_timestamp || "";
    if (blueprintId === prevBlueprintId.current) return;
    prevBlueprintId.current = blueprintId;

    isSyncing.current = true;

    const api = excalidrawAPIRef.current;
    api.updateScene({ elements: excalidrawElements });

    const t1 = setTimeout(() => {
      if (!mountedRef.current) return;
      try {
        api.scrollToContent(excalidrawElements, {
          fitToViewport: true,
          viewportZoomFactor: 0.88,
        });
      } catch {
        // silently ignore
      }
      const t2 = setTimeout(() => {
        if (mountedRef.current) {
          isSyncing.current = false;
        }
      }, 400);
      timersRef.current.push(t2);
    }, 200);
    timersRef.current.push(t1);

    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, [excalidrawElements, isReady, blueprint]);

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
    <div style={{ width: "100%", height: "100%" }}>
      <Excalidraw
        excalidrawAPI={handleReady}
        onChange={handleChange}
        initialData={EMPTY_INITIAL_DATA as any}
        zenModeEnabled={true}
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
