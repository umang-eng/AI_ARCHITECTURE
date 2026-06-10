import { Blueprint } from "../../types/blueprint";

export const VillaC: Blueprint = {
  plot: { width: 60, height: 80 },
  rooms: [
    { id: "1", name: "Living Room", type: "livingRoom", x: 5, y: 5, width: 20, height: 25 },
    { id: "2", name: "Kitchen", type: "kitchen", x: 25, y: 5, width: 15, height: 12 },
    { id: "3", name: "Dining", type: "dining", x: 25, y: 17, width: 15, height: 13 },
    { id: "4", name: "Hallway", type: "hallway", x: 40, y: 5, width: 15, height: 25 },
    { id: "5", name: "Master Bedroom", type: "bedroom", x: 5, y: 35, width: 20, height: 15 },
    { id: "6", name: "Bedroom 2", type: "bedroom", x: 25, y: 35, width: 15, height: 15 },
    { id: "7", name: "Bedroom 3", type: "bedroom", x: 40, y: 35, width: 15, height: 15 },
    { id: "8", name: "Bedroom 4", type: "bedroom", x: 5, y: 50, width: 15, height: 15 },
    { id: "9", name: "Bathroom 1", type: "bathroom", x: 20, y: 50, width: 10, height: 10 },
    { id: "10", name: "Bathroom 2", type: "bathroom", x: 30, y: 50, width: 10, height: 10 },
  ],
  doors: [
    { id: "d1", x: 15, y: 30, width: 3 },
    { id: "d2", x: 32, y: 30, width: 3 },
    { id: "d3", x: 47, y: 30, width: 3 },
    { id: "d4", x: 12, y: 50, width: 3 },
    { id: "d5", x: 25, y: 50, width: 3 },
    { id: "d6", x: 35, y: 50, width: 3 },
  ],
  windows: [
    { id: "w1", x: 15, y: 5, width: 5 },
    { id: "w2", x: 32, y: 5, width: 5 },
    { id: "w3", x: 5, y: 42, width: 5 },
    { id: "w4", x: 55, y: 42, width: 5 },
    { id: "w5", x: 20, y: 66, width: 5 },
    { id: "w6", x: 40, y: 66, width: 5 },
  ],
};
