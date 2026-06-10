import { Blueprint } from "../../types/blueprint";

export const ApartmentA: Blueprint = {
  plot: { width: 40, height: 50 },
  rooms: [
    { id: "1", name: "Living Room", type: "livingRoom", x: 5, y: 5, width: 18, height: 14 },
    { id: "2", name: "Kitchen", type: "kitchen", x: 23, y: 5, width: 12, height: 14 },
    { id: "3", name: "Hallway", type: "hallway", x: 5, y: 19, width: 30, height: 4 },
    { id: "4", name: "Master Bedroom", type: "bedroom", x: 5, y: 23, width: 15, height: 12 },
    { id: "5", name: "Bedroom 2", type: "bedroom", x: 20, y: 23, width: 15, height: 12 },
    { id: "6", name: "Bathroom", type: "bathroom", x: 5, y: 35, width: 10, height: 8 },
    { id: "7", name: "Balcony", type: "garden", x: 20, y: 35, width: 15, height: 8 },
  ],
  doors: [
    { id: "d1", x: 14, y: 19, width: 3 },
    { id: "d2", x: 29, y: 19, width: 3 },
    { id: "d3", x: 12, y: 23, width: 3 },
    { id: "d4", x: 27, y: 23, width: 3 },
    { id: "d5", x: 10, y: 35, width: 3 },
  ],
  windows: [
    { id: "w1", x: 14, y: 5, width: 4 },
    { id: "w2", x: 29, y: 5, width: 4 },
    { id: "w3", x: 5, y: 29, width: 4 },
    { id: "w4", x: 35, y: 29, width: 4 },
    { id: "w5", x: 27, y: 43, width: 4 },
  ],
};
