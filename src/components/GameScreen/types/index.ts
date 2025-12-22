import type { Entity } from 'react-game-engine';
import type { Layer } from '../../../types/map';

export interface Position {
  x: number;
  y: number;
}

export type Direction = 'up' | 'down' | 'left' | 'right';

export interface PlayerEntity extends Entity {
  position: Position;
  direction: Direction;
}

export interface TileEntity extends Entity {
  position: Position;
  tileId: number;
  layer: Layer;
}

export const TILE_SIZE = 64;
