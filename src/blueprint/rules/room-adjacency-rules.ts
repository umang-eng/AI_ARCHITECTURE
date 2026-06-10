export const roomRules = {
  kitchen: [
    "dining",
    "livingRoom",
  ],

  dining: [
    "kitchen",
    "livingRoom",
  ],

  bathroom: [
    "bedroom",
    "hallway",
  ],

  bedroom: [
    "bathroom",
    "hallway",
  ],

  garage: [
    "hallway",
    "kitchen",
  ],

  livingRoom: [
    "kitchen",
    "dining",
    "hallway",
  ],

  hallway: [
    "livingRoom",
    "bedroom",
    "bathroom",
    "kitchen",
    "staircase",
  ],

  staircase: [
    "hallway",
  ],

  office: [
    "hallway",
    "livingRoom",
  ],

  garden: [
    "livingRoom",
    "kitchen",
  ],
};
