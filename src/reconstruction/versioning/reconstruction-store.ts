import { create } from "zustand";
import { ReconstructionJobStatus, MeasurementResult } from "../types";

interface ReconstructionState {
  activeJob: ReconstructionJobStatus | null;
  measurements: MeasurementResult[];
  showWalls: boolean;
  showFurniture: boolean;
  showSplat: boolean;
  showCameraPoses: boolean;
  isProcessing: boolean;
  error: string | null;

  setActiveJob: (job: ReconstructionJobStatus | null) => void;
  addMeasurement: (m: MeasurementResult) => void;
  deleteMeasurement: (id: string) => void;
  clearMeasurements: () => void;
  setLayerToggle: (layer: "showWalls" | "showFurniture" | "showSplat" | "showCameraPoses", value: boolean) => void;
  setProcessing: (value: boolean) => void;
  setError: (error: string | null) => void;
}

export const useReconstructionStore = create<ReconstructionState>((set) => ({
  activeJob: null,
  measurements: [],
  showWalls: true,
  showFurniture: true,
  showSplat: true,
  showCameraPoses: true,
  isProcessing: false,
  error: null,

  setActiveJob: (job) => set({ activeJob: job, error: null }),
  
  addMeasurement: (m) => set((state) => ({ measurements: [...state.measurements, m] })),
  
  deleteMeasurement: (id) => set((state) => ({ measurements: state.measurements.filter(m => m.id !== id) })),
  
  clearMeasurements: () => set({ measurements: [] }),
  
  setLayerToggle: (layer, value) => set({ [layer]: value }),
  
  setProcessing: (value) => set({ isProcessing: value }),
  
  setError: (error) => set({ error }),
}));
