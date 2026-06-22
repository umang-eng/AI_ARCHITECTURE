import { create } from "zustand";
import { InteriorDesignResult } from "../types";

interface InteriorState {
  activeDesign: InteriorDesignResult | null;
  selectedStyle: string;
  selectedBudget: string;
  isProcessing: boolean;
  error: string | null;

  setActiveDesign: (design: InteriorDesignResult | null) => void;
  setSelectedStyle: (style: string) => void;
  setSelectedBudget: (budget: string) => void;
  setProcessing: (value: boolean) => void;
  setError: (error: string | null) => void;
}

export const useInteriorStore = create<InteriorState>((set) => ({
  activeDesign: null,
  selectedStyle: "modern",
  selectedBudget: "standard",
  isProcessing: false,
  error: null,

  setActiveDesign: (design) => set({ activeDesign: design, error: null }),
  setSelectedStyle: (style) => set({ selectedStyle: style }),
  setSelectedBudget: (budget) => set({ selectedBudget: budget }),
  setProcessing: (value) => set({ isProcessing: value }),
  setError: (error) => set({ error }),
}));
