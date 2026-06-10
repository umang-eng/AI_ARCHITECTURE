export interface RoomSpec {
  minWidth: number;
  minHeight: number;
  idealWidth?: number;
  idealHeight?: number;
}

export const ROOM_LIBRARY: Record<string, RoomSpec> = {
  bedroom: {
    minWidth: 10,
    minHeight: 10,
    idealWidth: 12,
    idealHeight: 14,
  },

  bathroom: {
    minWidth: 5,
    minHeight: 8,
    idealWidth: 7,
    idealHeight: 10,
  },

  kitchen: {
    minWidth: 10,
    minHeight: 10,
    idealWidth: 12,
    idealHeight: 12,
  },

  livingRoom: {
    minWidth: 15,
    minHeight: 18,
    idealWidth: 20,
    idealHeight: 22,
  },

  dining: {
    minWidth: 8,
    minHeight: 8,
    idealWidth: 10,
    idealHeight: 10,
  },

  hallway: {
    minWidth: 3,
    minHeight: 3,
    idealWidth: 5,
    idealHeight: 20,
  },

  garage: {
    minWidth: 10,
    minHeight: 18,
    idealWidth: 12,
    idealHeight: 20,
  },

  office: {
    minWidth: 8,
    minHeight: 8,
    idealWidth: 10,
    idealHeight: 10,
  },

  staircase: {
    minWidth: 4,
    minHeight: 6,
    idealWidth: 5,
    idealHeight: 8,
  },

  garden: {
    minWidth: 10,
    minHeight: 10,
    idealWidth: 15,
    idealHeight: 15,
  },
};
