export interface SplatPoint {
  x: number;
  y: number;
  z: number;
  r: number;
  g: number;
  b: number;
}

export class SplatGenerator {
  /**
   * Parse an ASCII PLY point cloud file into an array of colored 3D points.
   * Allows high-performance rendering of Gaussian Splat points via a Three.js Particle System.
   */
  public static parsePLY(plyText: string): SplatPoint[] {
    const lines = plyText.split("\n");
    const points: SplatPoint[] = [];
    let isHeader = true;

    for (let line of lines) {
      line = line.trim();
      if (isHeader) {
        if (line === "end_header") {
          isHeader = false;
        }
        continue;
      }
      if (!line) continue;
      const parts = line.split(/\s+/);
      if (parts.length >= 6) {
        const x = parseFloat(parts[0]);
        const y = parseFloat(parts[1]);
        const z = parseFloat(parts[2]);
        const r = parseInt(parts[3], 10) / 255;
        const g = parseInt(parts[4], 10) / 255;
        const b = parseInt(parts[5], 10) / 255;
        
        if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
          points.push({ x, y, z, r, g, b });
        }
      }
    }
    return points;
  }
}
