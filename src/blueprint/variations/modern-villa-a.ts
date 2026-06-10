import { Blueprint } from "../types/blueprint";

export const ModernVillaA: Blueprint = {
  plot: { width: 60, height: 80 },
  rooms: [
    { id: "1", name: "Living Room", type: "livingRoom", x: 5, y: 5, width: 25, height: 20 },
    { id: "2", name: "Kitchen", type: "kitchen", x: 30, y: 5, width: 15, height: 20 },
    { id: "3", name: "Dining", type: "dining", x: 45, y: 5, width: 10, height: 20 },
    { id: "4", name: "Hallway", type: "hallway", x: 5, y: 25, width: 50, height: 5 },
    { id: "5", name: "Master Bedroom", type: "bedroom", x: 5, y: 30, width: 18, height: 18 },
    { id: "6", name: "Bedroom 2", type: "bedroom", x: 23, y: 30, width: 14, height: 18 },
    { id: "7", name: "Bedroom 3", type: "bedroom", x: 37, y: 30, width: 14, height: 18 },
    { id: "8", name: "Bedroom 4", type: "bedroom", x: 5, y: 48, width: 14, height: 18 },
    { id: "9", name: "Bathroom 1", type: "bathroom", x: 19, y: 48, width: 10, height: 10 },
    { id: "10", name: "Bathroom 2", type: "bathroom", x: 29, y: 48, width: 10, height: 10 },
  ],
  doors: [
    { id: "d1", x: 17, y: 25, width: 3 },
    { id: "d2", x: 30, y: 25, width: 3 },
    { id: "d3", x: 44, y: 25, width: 3 },
    { id: "d4", x: 12, y: 48, width: 3 },
    { id: "d5", x: 24, y: 48, width: 3 },
    { id: "d6", x: 34, y: 48, width: 3 },
  ],
  windows: [
    { id: "w1", x: 15, y: 5, width: 5 },
    { id: "w2", x: 37, y: 5, width: 5 },
    { id: "w3", x: 5, y: 39, width: 5 },
    { id: "w4", x: 55, y: 39, width: 5 },
    { id: "w5", x: 30, y: 66, width: 5 },
    { id: "w6", x: 44, y: 66, width: 5 },
  ],
};
