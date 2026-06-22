export interface MeshGeometry {
  vertices: Float32Array;
  indices: Uint16Array;
}

export class MeshGenerator {
  /**
   * Dynamically generate 3D mesh vertices and face indices for the room enclosure walls.
   * Generates standard coordinates for the floor, ceiling, and four wall planes.
   */
  public static generateRoomBox(
    width: number,
    height: number,
    ceilingHeight: number = 9.0
  ): {
    floor: MeshGeometry;
    ceiling: MeshGeometry;
    walls: MeshGeometry;
  } {
    // Floor Geometry (Horizontal plane at z=0)
    const floorVerts = new Float32Array([
      0, 0, 0,
      width, 0, 0,
      width, height, 0,
      0, height, 0
    ]);
    const floorIndices = new Uint16Array([
      0, 2, 1,
      0, 3, 2
    ]);

    // Ceiling Geometry (Horizontal plane at z=ceilingHeight)
    const ceilingVerts = new Float32Array([
      0, 0, ceilingHeight,
      width, 0, ceilingHeight,
      width, height, ceilingHeight,
      0, height, ceilingHeight
    ]);
    const ceilingIndices = new Uint16Array([
      0, 1, 2,
      0, 2, 3
    ]);

    // Walls Geometry (Vertical wall segments)
    const wallVerts = new Float32Array([
      // Front wall
      0, 0, 0,
      width, 0, 0,
      width, 0, ceilingHeight,
      0, 0, ceilingHeight,
      
      // Right wall
      width, 0, 0,
      width, height, 0,
      width, height, ceilingHeight,
      width, 0, ceilingHeight,
      
      // Back wall
      width, height, 0,
      0, height, 0,
      0, height, ceilingHeight,
      width, height, ceilingHeight,
      
      // Left wall
      0, height, 0,
      0, 0, 0,
      0, 0, ceilingHeight,
      0, height, ceilingHeight
    ]);

    const wIdx: number[] = [];
    for (let i = 0; i < 4; i++) {
      const base = i * 4;
      wIdx.push(base, base + 1, base + 2);
      wIdx.push(base, base + 2, base + 3);
    }
    const wallIndices = new Uint16Array(wIdx);

    return {
      floor: { vertices: floorVerts, indices: floorIndices },
      ceiling: { vertices: ceilingVerts, indices: ceilingIndices },
      walls: { vertices: wallVerts, indices: wallIndices }
    };
  }
}
