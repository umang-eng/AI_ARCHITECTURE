/**
 * Blueprint Store — Zustand state management for blueprint generation.
 */

import { create } from "zustand";
import type { BlueprintSchema, BuildingType, ArchitecturalStyle } from "@/types/blueprint-schema";

type ExcalidrawElement = any;

export interface BlueprintVersion {
  id: string;
  blueprint: BlueprintSchema;
  timestamp: string;
  variant: string;
}

interface BlueprintState {
  // Current blueprint
  blueprint: BlueprintSchema | null;
  excalidrawElements: ExcalidrawElement[];

  // UI state
  isGenerating: boolean;
  error: string | null;

  // Generation params
  buildingType: BuildingType;
  style: ArchitecturalStyle;
  plotWidth: number;
  plotHeight: number;
  floors: number;
  bedrooms: number;
  bathrooms: number;
  variant: string;
  projectName: string;
  prompt: string;

  // History
  versions: BlueprintVersion[];
  currentVersionIndex: number;

  // Actions
  setBlueprint: (blueprint: BlueprintSchema, elements: ExcalidrawElement[]) => void;
  setGenerating: (generating: boolean) => void;
  setError: (error: string | null) => void;
  setParam: <K extends keyof BlueprintState>(key: K, value: BlueprintState[K]) => void;
  addVersion: (blueprint: BlueprintSchema, variant: string) => void;
  loadVersion: (index: number) => { blueprint: BlueprintSchema; elements: ExcalidrawElement[] } | null;
  updateExcalidrawElements: (elements: ExcalidrawElement[]) => void;
  clearBlueprint: () => void;
}

export const useBlueprintStore = create<BlueprintState>((set, get) => ({
  blueprint: null,
  excalidrawElements: [],

  isGenerating: false,
  error: null,

  buildingType: "villa",
  style: "modern",
  plotWidth: 60,
  plotHeight: 80,
  floors: 2,
  bedrooms: 4,
  bathrooms: 2,
  variant: "A",
  projectName: "My Blueprint",
  prompt: "",

  versions: [],
  currentVersionIndex: -1,

  setBlueprint: (blueprint, elements) =>
    set({ blueprint, excalidrawElements: elements, error: null }),

  setGenerating: (generating) => set({ isGenerating: generating }),

  setError: (error) => set({ error }),

  setParam: (key, value) => set({ [key]: value } as any),

  addVersion: (blueprint, variant) => {
    const { versions } = get();
    const version: BlueprintVersion = {
      id: `v${versions.length + 1}_${Date.now()}`,
      blueprint,
      timestamp: new Date().toISOString(),
      variant,
    };
    set({
      versions: [...versions, version],
      currentVersionIndex: versions.length,
    });
  },

  loadVersion: (index) => {
    const { versions } = get();
    if (index < 0 || index >= versions.length) return null;
    const version = versions[index];
    set({ currentVersionIndex: index });
    return { blueprint: version.blueprint, elements: [] };
  },

  updateExcalidrawElements: (elements) => set({ excalidrawElements: elements }),

  clearBlueprint: () =>
    set({
      blueprint: null,
      excalidrawElements: [],
      error: null,
      versions: [],
      currentVersionIndex: -1,
    }),
}));
