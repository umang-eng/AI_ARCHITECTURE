/**
 * Blueprint Commands — intermediate representation between schema and Excalidraw.
 *
 * Architecture: Blueprint Schema → Blueprint Commands → Excalidraw Elements
 *
 * Commands are simple declarative instructions. The renderer converts them
 * to Excalidraw elements. This separation ensures the schema is never
 * coupled to any specific rendering engine.
 */

export type CommandType =
  | "DRAW_ROOM"
  | "DRAW_WALL"
  | "DRAW_DOOR"
  | "DRAW_WINDOW"
  | "DRAW_STAIR"
  | "DRAW_TEXT"
  | "DRAW_DIMENSION"
  | "DRAW_PLOT_BOUNDARY";

export interface BaseCommand {
  type: CommandType;
  id: string;
}

export interface DrawRoomCommand extends BaseCommand {
  type: "DRAW_ROOM";
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
  room_type: string;
  color_hex: string;
  level: number;
}

export interface DrawWallCommand extends BaseCommand {
  type: "DRAW_WALL";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  thickness: number;
  wall_type: "exterior" | "interior";
}

export interface DrawDoorCommand extends BaseCommand {
  type: "DRAW_DOOR";
  x: number;
  y: number;
  width: number;
  orientation: "horizontal" | "vertical";
  is_main_entrance: boolean;
}

export interface DrawWindowCommand extends BaseCommand {
  type: "DRAW_WINDOW";
  x: number;
  y: number;
  width: number;
  orientation: "horizontal" | "vertical";
}

export interface DrawStairCommand extends BaseCommand {
  type: "DRAW_STAIR";
  x: number;
  y: number;
  width: number;
  height: number;
  direction: "up" | "down";
}

export interface DrawTextCommand extends BaseCommand {
  type: "DRAW_TEXT";
  x: number;
  y: number;
  text: string;
  font_size: number;
  color: string;
}

export interface DrawDimensionCommand extends BaseCommand {
  type: "DRAW_DIMENSION";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label: string;
}

export interface DrawPlotBoundaryCommand extends BaseCommand {
  type: "DRAW_PLOT_BOUNDARY";
  x: number;
  y: number;
  width: number;
  height: number;
}

export type BlueprintCommand =
  | DrawRoomCommand
  | DrawWallCommand
  | DrawDoorCommand
  | DrawWindowCommand
  | DrawStairCommand
  | DrawTextCommand
  | DrawDimensionCommand
  | DrawPlotBoundaryCommand;
