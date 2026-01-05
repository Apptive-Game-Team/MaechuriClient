export type LayerType = "Interactable" | "Non-Interactable" | "Passable" | "Non-Passable" | "Blocks-Vision";

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

export interface Position {
  x: number;
  y: number;
}

export interface MapObject {
  id: number;
  orderInLayer: number;
  name: string;
  type: LayerType[];
  position: Position;
}

export interface Asset {
  id: number;
  imageUrl: string;
}

export interface GameMap {
  layers: Layer[];
  objects: MapObject[];
  assets: Asset[];
}

export interface ScenarioData {
  createdDate: string;
  scenarioId: number;
  scenarioName: string;
  map: GameMap;
}
