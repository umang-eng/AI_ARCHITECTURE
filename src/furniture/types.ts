export interface FurnitureItem {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number; // 0, 90, 180, 270
  color_hex?: string;
  roomId: string;
}

export interface LibraryItem {
  type: string;
  name: string;
  width: number; // default width in ft
  height: number; // default height/depth in ft
  clearance: number; // clearance padding around item in ft
  rotationOptions: number[];
  category: "living" | "bedroom" | "kitchen" | "dining" | "office" | "bathroom";
}

export interface StyleConfig {
  sizeMultiplier: number;
  itemDensity: "low" | "medium" | "high";
  themeColors: {
    sofa: string;
    bed: string;
    dining: string;
    office: string;
    cabinet: string;
    fixture: string;
  };
}
