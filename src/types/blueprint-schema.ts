/**
 * Universal Blueprint Schema — single source of truth for all architectural data.
 *
 * Architecture: User Requirements → Blueprint Schema → Blueprint Commands → Excalidraw Elements → Canvas
 */

export type BuildingType =
  | "house"
  | "villa"
  | "duplex"
  | "apartment"
  | "office"
  | "commercial"
  | "shop";

export type ArchitecturalStyle =
  | "modern"
  | "minimalist"
  | "industrial"
  | "contemporary"
  | "traditional"
  | "mediterranean"
  | "victorian";

export interface ProjectInfo {
  name: string;
  description: string;
  building_type: BuildingType;
  style: ArchitecturalStyle;
  client_name?: string;
  date: string;
  version: string;
}

export interface PlotInfo {
  width: number;
  height: number;
  unit: "ft" | "m";
}

export interface FloorInfo {
  level: number;
  name: string;
  height_ft: number;
}

export interface RoomData {
  id: string;
  name: string;
  room_type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  level: number;
  color_hex: string;
}

export interface WallData {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  thickness: number;
  wall_type: "exterior" | "interior";
}

export interface DoorData {
  id: string;
  x: number;
  y: number;
  width: number;
  orientation: "horizontal" | "vertical";
  is_main_entrance: boolean;
}

export interface WindowData {
  id: string;
  x: number;
  y: number;
  width: number;
  orientation: "horizontal" | "vertical";
}

export interface StairData {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  direction: "up" | "down";
}

export interface FurnitureData {
  id: string;
  name?: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  color_hex?: string;
  room_id: string;
}

export interface BlueprintMetadata {
  generated_by: string;
  generation_timestamp: string;
  engine_version: string;
  variant: string;
  validation_status: "valid" | "invalid" | "pending";
  validation_errors: string[];
  validation_score?: number;
}

export interface BlueprintSchema {
  project: ProjectInfo;
  plot: PlotInfo;
  floors: FloorInfo[];
  rooms: RoomData[];
  walls: WallData[];
  doors: DoorData[];
  windows: WindowData[];
  stairs: StairData[];
  furniture?: FurnitureData[];
  metadata: BlueprintMetadata;
}
