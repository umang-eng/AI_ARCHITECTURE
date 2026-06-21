/**
 * Vision Intelligence Engine Type Definitions.
 */

export interface VisionDimension {
  width: number;
  height: number;
}

export interface VisionFurniture {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

export interface VisionDoor {
  id: string;
  x: number;
  y: number;
  width: number;
  orientation: "horizontal" | "vertical";
}

export interface VisionWindow {
  id: string;
  x: number;
  y: number;
  width: number;
  orientation: "horizontal" | "vertical";
}

export interface VisionRoomLayout {
  id: string;
  roomType: string;
  x: number;
  y: number;
  dimensions: VisionDimension;
  furniture: VisionFurniture[];
  doors: VisionDoor[];
  windows: VisionWindow[];
}

export interface VisionAnalysisResult {
  roomType: string;
  dimensions: VisionDimension;
  furniture: VisionFurniture[];
  doors: VisionDoor[];
  windows: VisionWindow[];
  layoutScore: number;
  rooms?: VisionRoomLayout[];
}

export interface RenovationSuggestion {
  id: string;
  category: "color" | "furniture" | "lighting" | "structural";
  description: string;
  impact: "low" | "medium" | "high";
  costEstimate: string;
}

export interface FurnitureRecommendation {
  id: string;
  furnitureType: string;
  reason: string;
  priority: "essential" | "recommended" | "optional";
  dimensions: VisionDimension;
}
