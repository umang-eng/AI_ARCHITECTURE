import { DecorationSpec } from "../types";

export class LayoutOptimizer {
  /**
   * Optimize spatial coordinates to prevent collision/obstruction near door sweeps and narrow zones.
   */
  public static optimizeLayout(
    decorations: DecorationSpec[],
    roomWidth: number,
    roomHeight: number,
    doors: Array<{ x: number; y: number; width: number }>
  ): DecorationSpec[] {
    return decorations.map(d => {
      let dx = d.x;
      let dy = d.y;
      let dw = d.width;
      let dh = d.height;

      // 1. Wall Boundaries constraint checks
      if (dx - dw / 2 < 0) dx = dw / 2;
      if (dx + dw / 2 > roomWidth) dx = roomWidth - dw / 2;
      if (dy - dh / 2 < 0) dy = dh / 2;
      if (dy + dh / 2 > roomHeight) dy = roomHeight - dh / 2;

      // 2. Door swing clearance check (keep decoration 3ft away from any door node center)
      doors.forEach(door => {
        const dist = Math.hypot(dx - door.x, dy - door.y);
        if (dist < 3.0 && d.type !== "rug") {
          // Push decoration away from door center along diagonal
          const angle = Math.atan2(dy - door.y, dx - door.x);
          dx += 3.0 * Math.cos(angle);
          dy += 3.0 * Math.sin(angle);
        }
      });

      return {
        ...d,
        x: Number(dx.toFixed(2)),
        y: Number(dy.toFixed(2)),
        width: Number(dw.toFixed(2)),
        height: Number(dh.toFixed(2)),
      };
    });
  }
}
