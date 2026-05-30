export interface HealthStatus {
  status: string;
  version: string;
  timestamp: string;
}

export interface Project {
  id: number;
  user_id: number;
  project_name: string;
  project_description?: string;
  building_type: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface BuildingDesignCreatePayload {
  design_name: string;
  design_type: string;
  design_data: Record<string, unknown>;
  project_id: number;
}

export interface BuildingDesign {
  id: number;
  project_id: number;
  design_name?: string;
  design_type?: string;
  design_data?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface AuthTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface Plot {
  width: number;
  length: number;
  unit: string;
}

export interface BuildingRequirements {
  building_type: string;
  style: string;
  plot: Plot;
  floors: number;
  bedrooms: number;
  bathrooms: number;
  budget?: number | null;
  features: string[];
  parking_spaces?: number | null;
  garden?: boolean | null;
  swimming_pool?: boolean | null;
  office_room?: boolean | null;
}

export interface AIRoom {
  name: string;
  area_m2: number;
  x: number;
  y: number;
  width: number;
  length: number;
}

export interface AIDoor {
  x: number;
  y: number;
  orientation: string;
  swing: string;
}

export interface AIWindow {
  x: number;
  y: number;
  width: number;
  orientation: string;
}

export interface AIStaircase {
  x: number;
  y: number;
  width: number;
  length: number;
  direction: string;
}

export interface AIDesignLayout {
  id?: string;
  name: string;
  summary: string;
  floors?: number;
  total_area_m2?: number;
  rooms: AIRoom[];
  doors: AIDoor[];
  windows: AIWindow[];
  stairs: AIStaircase[];
  footprint_m2?: number;
  estimated_cost_usd?: number;
  notes?: string;
}
