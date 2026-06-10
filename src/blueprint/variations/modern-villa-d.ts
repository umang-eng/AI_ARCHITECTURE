import { Blueprint } from "../types/blueprint";

export const ModernVillaD: Blueprint = {
  plot: { width: 60, height: 80 },
  rooms: [
    { id: "1", name: "Living Room", type: "livingRoom", x: 10, y: 5, width: 20, height: 18 },
    { id: "2", name: "Kitchen", type: "kitchen", x: 30, y: 5, width: 20, height: 18 },
    { id: "3", name: "Dining", type: "dining", x: 10, y: 23, width: 15, height: 12 },
    { id: "4", name: "Hallway", type: "hallway", x: 25, y: 23, width: 25, height: 5 },
    { id: "5", name: "Master Bedroom", type: "bedroom", x: 5, y: 35, width: 22, height: 18 },
    { id: "6", name: "Bedroom 2", type: "bedroom", x: 27, y: 35, width: 14, height: 18 },
    { id: "7", name: "Bedroom 3", type: "bedroom", x: 41, y: 35, width: 14, height: 18 },
    { id: "8", name: "Bedroom 4", type: "bedroom", x: 5, y: 53, width: 18, height: 15 },
    { id: "9", name: "Bathroom 1", type: "bathroom", x: 23, y: 53, width: 12, height: 10 },
    { id: "10", name: "Bathroom 2", type: "bathroom", x: 35, y: 53, width: 12, height: 10 },
  ],
  doors: [
    { id: "d1", x: 20, y: 23, width: 3 },
    { id: "d2", x: 40, y: 23, width: 3 },
    { id: "d3", x: 16, y: 35, width: 3 },
    { id: "d4", x: 34, y: 35, width: 3 },
    { id: "d5", x: 48, y: 35, width: 3 },
    { id: "d6", x: 29, y: 53, width: 3 },
  ],
  windows: [
    { id: "w1", x: 20, y: 5, width: 5 },
    { id: "w2", x: 40, y: 5, width: 5 },
    { id: "w3", x: 5, y: 44, width: 5 },
    { id: "w4", x: 55, y: 44, width: 5 },
    { id: "w5", x: 14, y: 68, width: 5 },
    { id: "w6", x: 41, y: 68, width: 5 },
  ],
};
