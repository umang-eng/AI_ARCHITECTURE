export interface RoomAllocation {
  type: string;
  count: number;
}

export function allocateRooms(input: {
  bedrooms: number;
  bathrooms: number;
  floors?: number;
  hasGarage?: boolean;
  hasGarden?: boolean;
  hasOffice?: boolean;
}): RoomAllocation[] {
  const rooms: RoomAllocation[] = [
    { type: "livingRoom", count: 1 },
    { type: "kitchen", count: 1 },
    { type: "dining", count: 1 },
    { type: "hallway", count: 1 },
    { type: "bedroom", count: input.bedrooms },
    { type: "bathroom", count: input.bathrooms },
  ];

  if (input.hasGarage) {
    rooms.push({ type: "garage", count: 1 });
  }

  if (input.hasOffice) {
    rooms.push({ type: "office", count: 1 });
  }

  if (input.hasGarden) {
    rooms.push({ type: "garden", count: 1 });
  }

  if ((input.floors || 1) > 1) {
    rooms.push({ type: "staircase", count: 1 });
  }

  return rooms;
}
