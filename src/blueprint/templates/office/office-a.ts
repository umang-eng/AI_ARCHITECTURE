import { Blueprint } from "../../types/blueprint";

export const OfficeA: Blueprint = {
  plot: { width: 70, height: 50 },
  rooms: [
    { id: "1", name: "Reception", type: "hallway", x: 5, y: 5, width: 20, height: 15 },
    { id: "2", name: "Open Workspace", type: "office", x: 25, y: 5, width: 30, height: 15 },
    { id: "3", name: "Conference Room", type: "office", x: 55, y: 5, width: 10, height: 15 },
    { id: "4", name: "Hallway", type: "hallway", x: 5, y: 20, width: 60, height: 4 },
    { id: "5", name: "Manager Office", type: "office", x: 5, y: 24, width: 15, height: 12 },
    { id: "6", name: "Meeting Room", type: "office", x: 20, y: 24, width: 12, height: 12 },
    { id: "7", name: "Server Room", type: "utility", x: 32, y: 24, width: 10, height: 12 },
    { id: "8", name: "Break Room", type: "utility", x: 42, y: 24, width: 12, height: 12 },
    { id: "9", name: "Restroom 1", type: "bathroom", x: 54, y: 24, width: 6, height: 6 },
    { id: "10", name: "Restroom 2", type: "bathroom", x: 54, y: 30, width: 6, height: 6 },
  ],
  doors: [
    { id: "d1", x: 15, y: 20, width: 3 },
    { id: "d2", x: 40, y: 20, width: 3 },
    { id: "d3", x: 12, y: 24, width: 3 },
    { id: "d4", x: 26, y: 24, width: 3 },
    { id: "d5", x: 37, y: 24, width: 3 },
    { id: "d6", x: 48, y: 24, width: 3 },
  ],
  windows: [
    { id: "w1", x: 15, y: 5, width: 5 },
    { id: "w2", x: 40, y: 5, width: 5 },
    { id: "w3", x: 5, y: 30, width: 5 },
    { id: "w4", x: 65, y: 30, width: 5 },
    { id: "w5", x: 25, y: 45, width: 5 },
    { id: "w6", x: 45, y: 45, width: 5 },
  ],
};
