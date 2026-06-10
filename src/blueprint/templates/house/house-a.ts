import { Blueprint } from "../../types/blueprint";

export const HouseA: Blueprint = {
  plot: { width: 50, height: 60 },
  rooms: [
    { id: "1", name: "Living Room", type: "livingRoom", x: 5, y: 5, width: 20, height: 15 },
    { id: "2", name: "Kitchen", type: "kitchen", x: 25, y: 5, width: 15, height: 15 },
    { id: "3", name: "Dining", type: "dining", x: 40, y: 5, width: 5, height: 15 },
    { id: "4", name: "Hallway", type: "hallway", x: 5, y: 20, width: 40, height: 5 },
    { id: "5", name: "Master Bedroom", type: "bedroom", x: 5, y: 25, width: 15, height: 15 },
    { id: "6", name: "Bedroom 2", type: "bedroom", x: 20, y: 25, width: 12, height: 15 },
    { id: "7", name: "Bedroom 3", type: "bedroom", x: 32, y: 25, width: 13, height: 15 },
    { id: "8", name: "Bathroom 1", type: "bathroom", x: 5, y: 40, width: 8, height: 8 },
    { id: "9", name: "Bathroom 2", type: "bathroom", x: 13, y: 40, width: 8, height: 8 },
    { id: "10", name: "Laundry", type: "utility", x: 21, y: 40, width: 8, height: 8 },
  ],
  doors: [
    { id: "d1", x: 15, y: 20, width: 3 },
    { id: "d2", x: 30, y: 20, width: 3 },
    { id: "d3", x: 12, y: 25, width: 3 },
    { id: "d4", x: 26, y: 25, width: 3 },
    { id: "d5", x: 38, y: 25, width: 3 },
    { id: "d6", x: 9, y: 40, width: 3 },
  ],
  windows: [
    { id: "w1", x: 15, y: 5, width: 4 },
    { id: "w2", x: 32, y: 5, width: 4 },
    { id: "w3", x: 5, y: 32, width: 4 },
    { id: "w4", x: 45, y: 32, width: 4 },
    { id: "w5", x: 15, y: 50, width: 4 },
  ],
};
