/**
 * Interior Designer AI Type Definitions.
 */

export interface MaterialSpec {
  element: string; // e.g. floor, walls, ceiling, furniture_id
  materialName: string;
  colorHex: string;
  roughness: number;
  metalness: number;
  textureType: string; // e.g. wood, marble, tatami, concrete, paint
}

export interface LightSpec {
  id: string;
  type: string; // e.g. ambient, task, accent
  x: number;
  y: number;
  z: number;
  intensity: number;
  colorKelvin: number;
  colorHex: string;
}

export interface DecorationSpec {
  id: string;
  type: string; // e.g. rug, painting, plant, mirror
  x: number;
  y: number;
  width: number;
  height: number;
  colorHex: string;
}

export interface DesignScoreBreakdown {
  colorHarmony: number;
  lightingAdequacy: number;
  spaceClearance: number;
  materialBalance: number;
}

export interface InteriorDesignResult {
  style: string;
  budget: string;
  materialJson: MaterialSpec[];
  lightingJson: LightSpec[];
  interiorJson: DecorationSpec[];
  designScore: number;
  scoreBreakdown: DesignScoreBreakdown;
  critiques: string[];
}

export interface PipelineFurnitureItem {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}
