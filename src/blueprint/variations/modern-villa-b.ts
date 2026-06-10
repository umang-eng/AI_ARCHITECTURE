import { Blueprint } from "../types/blueprint";

export const ModernVillaB: Blueprint = {
  plot: { width: 60, height: 80 },
  rooms: [
    { id: "1", name: "Living Room", type: "livingRoom", x: 5, y: 5, width: 30, height: 15 },
    { id: "2", name: "Kitchen", type: "kitchen", x: 35, y: 5, width: 20, height: 15 },
    { id: "3", name: "Dining", type: "dining", x: 5, y: 20, width: 15, height: 10 },
    { id: "4", name: "Hallway", type: "hallway", x: 20, y: 20, width: 35, height: 5 },
    { id: "5", name: "Master Bedroom", type: "bedroom", x: 5, y: 30, width: 20, height: 20 },
    { id: "6", name: "Bedroom 2", type: "bedroom", x: 25, y: 30, width: 15, height: 15 },
    { id: "7", name: "Bedroom 3", type: "bedroom", x: 40, y: 30, width: 15, height: 15 },
    { id: "8", name: "Bedroom 4", type: "bedroom", x: 25, y: 45, width: 15, height: 15 },
    { id: "9", name: "Bathroom 1", type: "bathroom", x: 5, y: 50, width: 10, height: 10 },
    { id: "10", name: "Bathroom 2", type: "bathroom", x: 40, y: 45, width: 10, height: 10 },
  ],
  doors: [
    { id: "d1", x: 15, y: 20, width: 3 },
    { id: "d2", x: 37, y: 20, width: 3 },
    { id: "d3", x: 10, y: 30, width: 3 },
    { id: "d4", x: 32, y: 30, width: 3 },
    { id: "d5", x: 47, y: 30, width: 3 },
    { id: "d6", x: 32, y: 45, width: 3 },
  ],
  windows: [
    { id: "w1", x: 20, y: 5, width: 5 },
    { id: "w2", x: 45, y: 5, width: 5 },
    { id: "w3", x: 5, y: 40, width: 5 },
    { id: "w4", x: 55, y: 40, width: 5 },
    { id: "w5", x: 15, y: 66, width: 5 },
    { id: "w6", x: 35, y: 66, width: 5 },
  ],
};
