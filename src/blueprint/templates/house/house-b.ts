import { Blueprint } from "../../types/blueprint";

export const HouseB: Blueprint = {
  plot: { width: 50, height: 60 },
  rooms: [
    { id: "1", name: "Living Room", type: "livingRoom", x: 5, y: 5, width: 18, height: 18 },
    { id: "2", name: "Kitchen", type: "kitchen", x: 23, y: 5, width: 12, height: 10 },
    { id: "3", name: "Dining", type: "dining", x: 35, y: 5, width: 10, height: 10 },
    { id: "4", name: "Hallway", type: "hallway", x: 5, y: 23, width: 40, height: 4 },
    { id: "5", name: "Master Bedroom", type: "bedroom", x: 5, y: 27, width: 16, height: 14 },
    { id: "6", name: "Bedroom 2", type: "bedroom", x: 21, y: 27, width: 12, height: 14 },
    { id: "7", name: "Bedroom 3", type: "bedroom", x: 33, y: 27, width: 12, height: 14 },
    { id: "8", name: "Bathroom", type: "bathroom", x: 5, y: 41, width: 10, height: 8 },
    { id: "9", name: "Storage", type: "storage", x: 15, y: 41, width: 8, height: 8 },
  ],
  doors: [
    { id: "d1", x: 14, y: 23, width: 3 },
    { id: "d2", x: 27, y: 23, width: 3 },
    { id: "d3", x: 10, y: 27, width: 3 },
    { id: "d4", x: 27, y: 27, width: 3 },
    { id: "d5", x: 39, y: 27, width: 3 },
  ],
  windows: [
    { id: "w1", x: 14, y: 5, width: 4 },
    { id: "w2", x: 40, y: 5, width: 4 },
    { id: "w3", x: 5, y: 34, width: 4 },
    { id: "w4", x: 45, y: 34, width: 4 },
    { id: "w5", x: 10, y: 50, width: 4 },
  ],
};
