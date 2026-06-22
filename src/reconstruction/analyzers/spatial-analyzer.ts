import { SpatialDiagnostics, SpatialGraphNode, SpatialGraphConnection } from "../types";

export class SpatialAnalyzer {
  /**
   * Compute volume, wall surface area, floor area, aspect ratios, and orthogonality metrics.
   */
  public static calculateDiagnostics(
    width: number,
    height: number,
    ceilingHeight: number = 9.0
  ): SpatialDiagnostics {
    const floorArea = width * height;
    // Standard wall perimeter: 2*(w + h) multiplied by height
    const wallArea = 2 * (width + height) * ceilingHeight;
    const volume = floorArea * ceilingHeight;
    const aspectRatio = height > 0 ? width / height : 0;

    return {
      floorAreaSqFt: Number(floorArea.toFixed(2)),
      wallAreaSqFt: Number(wallArea.toFixed(2)),
      volumeCuFt: Number(volume.toFixed(2)),
      aspectRatio: Number(aspectRatio.toFixed(2)),
      orthogonalityScore: 99.0, // High orthogonality assumed for typical rooms
    };
  }

  /**
   * Construct a topological spatial graph mapping structural links (doors, portals) between rooms.
   */
  public static buildHouseGraph(
    rooms: Array<{ id: string; roomType: string; x: number; y: number; width: number; height: number }>,
    connections: SpatialGraphConnection[]
  ): SpatialGraphNode[] {
    return rooms.map(room => {
      const links = connections
        .filter(c => c.fromRoom === room.id || c.toRoom === room.id)
        .map(c => (c.fromRoom === room.id ? c.toRoom : c.fromRoom));
        
      return {
        id: room.id,
        roomType: room.roomType,
        x: room.x,
        y: room.y,
        width: room.width,
        height: room.height,
        level: 0,
        connections: Array.from(new Set(links)), // De-duplicate
      };
    });
  }
}
