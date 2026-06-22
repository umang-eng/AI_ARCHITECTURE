/**
 * 3D House Reconstruction Engine Type Definitions.
 */

export interface CameraPose {
  frameId: number;
  tx: number;
  ty: number;
  tz: number;
  rx: number;
  ry: number;
  rz: number;
}

export interface SpatialGraphConnection {
  fromRoom: string;
  toRoom: string;
  type: string;
}

export interface SpatialDiagnostics {
  floorAreaSqFt: number;
  wallAreaSqFt: number;
  volumeCuFt: number;
  aspectRatio: number;
  orthogonalityScore: number;
}

export interface ReconstructionJobStatus {
  jobId: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  roomType: string;
  dimensions: { width: number; height: number };
  plyUrl?: string;
  objUrl?: string;
  poses: CameraPose[];
  diagnostics?: SpatialDiagnostics;
  connections: SpatialGraphConnection[];
  error?: string;
}

export interface SpatialGraphNode {
  id: string;
  roomType: string;
  x: number;
  y: number;
  width: number;
  height: number;
  level: number;
  connections: string[];
}

export interface ThreeDVector3 {
  x: number;
  y: number;
  z: number;
}

export interface MeasurementResult {
  id: string;
  startPoint: ThreeDVector3;
  endPoint: ThreeDVector3;
  distanceFeet: number;
  timestamp: string;
}
