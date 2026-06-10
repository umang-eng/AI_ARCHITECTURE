/**
 * Blueprint JSON Schema — the strict output format that the AI model must produce.
 *
 * This is the contract between the trained QLoRA model and the frontend renderer.
 * The model outputs JSON matching this schema; the parser converts it to internal types.
 */

export const BLUEPRINT_JSON_SCHEMA_VERSION = "1.0";

export interface BlueprintAIOutputPlot {
  width: number;
  height: number;
}

export interface BlueprintAIOutputRoom {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BlueprintAIOutputDoor {
  id: string;
  x: number;
  y: number;
  width: number;
  orientation?: "horizontal" | "vertical";
}

export interface BlueprintAIOutputWindow {
  id: string;
  x: number;
  y: number;
  width: number;
  orientation?: "horizontal" | "vertical";
}

export interface BlueprintAIOutput {
  plot: BlueprintAIOutputPlot;
  rooms: BlueprintAIOutputRoom[];
  doors: BlueprintAIOutputDoor[];
  windows: BlueprintAIOutputWindow[];
}

export const BLUEPRINT_JSON_SCHEMA = {
  type: "object",
  required: ["plot", "rooms"],
  properties: {
    plot: {
      type: "object",
      required: ["width", "height"],
      properties: {
        width: { type: "number", minimum: 10, maximum: 200 },
        height: { type: "number", minimum: 10, maximum: 300 },
      },
    },
    rooms: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        required: ["id", "type", "x", "y", "width", "height"],
        properties: {
          id: { type: "string" },
          type: {
            type: "string",
            enum: [
              "bedroom",
              "master_bedroom",
              "kitchen",
              "living_room",
              "dining",
              "bathroom",
              "hallway",
              "garage",
              "garden",
              "office",
              "utility",
              "laundry",
              "closet",
              "study",
              "balcony",
              "terrace",
              "pool",
              "storage",
            ],
          },
          x: { type: "number", minimum: 0 },
          y: { type: "number", minimum: 0 },
          width: { type: "number", minimum: 3 },
          height: { type: "number", minimum: 3 },
        },
      },
    },
    doors: {
      type: "array",
      items: {
        type: "object",
        required: ["id", "x", "y", "width"],
        properties: {
          id: { type: "string" },
          x: { type: "number" },
          y: { type: "number" },
          width: { type: "number", minimum: 1 },
          orientation: { type: "string", enum: ["horizontal", "vertical"] },
        },
      },
    },
    windows: {
      type: "array",
      items: {
        type: "object",
        required: ["id", "x", "y", "width"],
        properties: {
          id: { type: "string" },
          x: { type: "number" },
          y: { type: "number" },
          width: { type: "number", minimum: 1 },
          orientation: { type: "string", enum: ["horizontal", "vertical"] },
        },
      },
    },
  },
};

export const SYSTEM_PROMPT = `You are an expert architectural blueprint generator.
Given a user's description of a building, output ONLY valid JSON — no markdown, no explanation, no extra text.

The JSON must follow this exact schema:
{
  "plot": { "width": <number in feet>, "height": <number in feet> },
  "rooms": [
    { "id": "<unique_id>", "type": "<room_type>", "x": <number>, "y": <number>, "width": <number>, "height": <number> }
  ],
  "doors": [
    { "id": "<unique_id>", "x": <number>, "y": <number>, "width": 3 }
  ],
  "windows": [
    { "id": "<unique_id>", "x": <number>, "y": <number>, "width": 4 }
  ]
}

Rules:
- All coordinates are in feet, origin (0,0) is top-left
- Rooms must not overlap and must fit within the plot boundary
- Each room needs a unique id (e.g., "bedroom_1", "kitchen_1")
- Room types: bedroom, master_bedroom, kitchen, living_room, dining, bathroom, hallway, garage, garden, office, utility, laundry, closet, study, balcony, terrace, pool, storage
- Doors connect rooms (place at wall boundaries)
- Windows go on exterior walls
- Output JSON ONLY. No markdown. No code blocks. No explanation.`;
