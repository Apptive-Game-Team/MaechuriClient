export type LayerType = "Interactable" | "Non-Interactable" | "Passable" | "Non-Passable";

export interface Layer {
  orderInLayer: number;
  name: string;
  type: LayerType[];
  tileMap: number[][];
}

export interface DirectionalAsset {
  left?: string;
  right?: string;
  front?: string;
  back?: string;
}

export interface MapObject {
  id: number;
  objectUrl: string;
}

export interface GameMap {
  layers: Layer[];
  objects: MapObject[];
  playerObjectUrl?: string;
}

export interface ScenarioData {
  createdDate: string;
  scenarioId: number;
  scenarioName: string;
  map: GameMap;
}
