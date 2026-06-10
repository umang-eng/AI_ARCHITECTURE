import { Blueprint } from "../../types/blueprint";

export const DuplexA: Blueprint = {
  plot: { width: 60, height: 70 },
  rooms: [
    { id: "1", name: "Living Room", type: "livingRoom", x: 5, y: 5, width: 22, height: 15 },
    { id: "2", name: "Kitchen", type: "kitchen", x: 27, y: 5, width: 15, height: 15 },
    { id: "3", name: "Dining", type: "dining", x: 42, y: 5, width: 13, height: 15 },
    { id: "4", name: "Hallway", type: "hallway", x: 5, y: 20, width: 50, height: 4 },
    { id: "5", name: "Master Bedroom", type: "bedroom", x: 5, y: 24, width: 18, height: 14 },
    { id: "6", name: "Bedroom 2", type: "bedroom", x: 23, y: 24, width: 14, height: 14 },
    { id: "7", name: "Bathroom 1", type: "bathroom", x: 37, y: 24, width: 8, height: 8 },
    { id: "8", name: "Staircase", type: "staircase", x: 45, y: 24, width: 10, height: 14 },
    { id: "9", name: "Bedroom 3", type: "bedroom", x: 5, y: 38, width: 14, height: 12 },
    { id: "10", name: "Bedroom 4", type: "bedroom", x: 19, y: 38, width: 14, height: 12 },
    { id: "11", name: "Bathroom 2", type: "bathroom", x: 33, y: 38, width: 8, height: 8 },
  ],
  doors: [
    { id: "d1", x: 16, y: 20, width: 3 },
    { id: "d2", x: 34, y: 20, width: 3 },
    { id: "d3", x: 12, y: 24, width: 3 },
    { id: "d4", x: 30, y: 24, width: 3 },
    { id: "d5", x: 12, y: 38, width: 3 },
    { id: "d6", x: 26, y: 38, width: 3 },
  ],
  windows: [
    { id: "w1", x: 16, y: 5, width: 5 },
    { id: "w2", x: 34, y: 5, width: 5 },
    { id: "w3", x: 5, y: 31, width: 5 },
    { id: "w4", x: 55, y: 31, width: 5 },
    { id: "w5", x: 12, y: 55, width: 5 },
    { id: "w6", x: 26, y: 55, width: 5 },
  ],
};
