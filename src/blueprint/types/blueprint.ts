export interface Plot {
  width: number;
  height: number;
}

export interface Room {
  id: string;
  name: string;
  type: string;

  x: number;
  y: number;

  width: number;
  height: number;
}

export interface Door {
  id: string;

  x: number;
  y: number;

  width: number;
}

export interface Window {
  id: string;

  x: number;
  y: number;

  width: number;
}

export interface Blueprint {
  plot: Plot;

  rooms: Room[];

  doors: Door[];

  windows: Window[];

  furniture?: any[];
}
