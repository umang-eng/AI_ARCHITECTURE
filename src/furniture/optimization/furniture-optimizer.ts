import { FurnitureItem } from "../types";
import { Blueprint } from "../../blueprint/types/blueprint";
import { validateFurnitureLayout } from "../validators/furniture-validator";
import { getFurnitureBounds } from "../validators/overlap-validator";

export function optimizeFurnitureLayout(
  furniture: FurnitureItem[],
  blueprint: Blueprint,
): FurnitureItem[] {
  const optimized = furniture.map((f) => ({ ...f }));

  for (let pass = 0; pass < 3; pass++) {
    let report = validateFurnitureLayout(optimized, blueprint);
    if (report.valid) break;

    // Optimize each item that is in violation
    for (const f of optimized) {
      const parentRoom = blueprint.rooms.find((r) => r.id === f.roomId);
      if (!parentRoom) continue;

      // Check if this item is involved in any errors
      const hasErrors = report.errors.some((err) => err.includes(f.id));
      if (!hasErrors) continue;

      // Try wall alignment snaps (very standard for wardrobes, sofas, beds, TV units)
      const options = [
        // Snap to Left Wall
        { x: parentRoom.x + f.width / 2 + 0.1, y: f.y, rotation: f.rotation },
        // Snap to Right Wall
        { x: parentRoom.x + parentRoom.width - f.width / 2 - 0.1, y: f.y, rotation: f.rotation },
        // Snap to Top Wall
        { x: f.x, y: parentRoom.y + f.height / 2 + 0.1, rotation: f.rotation },
        // Snap to Bottom Wall
        { x: f.x, y: parentRoom.y + parentRoom.height - f.height / 2 - 0.1, rotation: f.rotation },
        // Try Rotating
        { x: f.x, y: f.y, rotation: (f.rotation + 90) % 360 },
      ];

      let solved = false;
      const backupX = f.x;
      const backupY = f.y;
      const backupRot = f.rotation;

      for (const opt of options) {
        f.x = opt.x;
        f.y = opt.y;
        f.rotation = opt.rotation;

        const newReport = validateFurnitureLayout(optimized, blueprint);
        const stillInViolation = newReport.errors.some((err) => err.includes(f.id));

        if (!stillInViolation) {
          solved = true;
          report = newReport;
          break;
        }
      }

      if (!solved) {
        // Restore backup if none of the snaps solved it
        f.x = backupX;
        f.y = backupY;
        f.rotation = backupRot;
      }
    }
  }

  return optimized;
}
