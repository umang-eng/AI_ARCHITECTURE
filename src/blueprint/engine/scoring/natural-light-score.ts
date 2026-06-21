import { PlacedRoom } from "../layout-engine/placement-algorithm";

export function calculateNaturalLightScore(
  rooms: PlacedRoom[],
  plotWidth: number,
  plotHeight: number,
): number {
  if (rooms.length === 0) return 0;

  let totalHabitableRooms = 0;
  let exteriorHabitableRooms = 0;

  const habitableTypes = ["bedroom", "master_bedroom", "livingRoom", "living", "dining", "kitchen", "office"];
  const exteriorThreshold = 10.0; // rooms within 10 ft of outer plot edges can have direct window exposure

  for (const r of rooms) {
    if (!habitableTypes.includes(r.type)) continue;
    totalHabitableRooms++;

    const touchesLeft = r.x <= exteriorThreshold;
    const touchesRight = r.x + r.width >= plotWidth - exteriorThreshold;
    const touchesTop = r.y <= exteriorThreshold;
    const touchesBottom = r.y + r.height >= plotHeight - exteriorThreshold;

    if (touchesLeft || touchesRight || touchesTop || touchesBottom) {
      exteriorHabitableRooms++;
    }
  }

  if (totalHabitableRooms === 0) return 100;

  const ratio = exteriorHabitableRooms / totalHabitableRooms;
  return Math.round(ratio * 100);
}
