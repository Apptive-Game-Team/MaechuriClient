import type { Entity } from 'react-game-engine';
import type { Layer, DirectionalAsset } from '../../../types/map';

export interface Position {
  x: number;
  y: number;
}

export type Direction = 'up' | 'down' | 'left' | 'right';

export interface PlayerEntity extends Entity {
  position: Position;
  direction: Direction;
  asset: DirectionalAsset | null;
  isAnimating?: boolean;
}

export interface TileEntity extends Entity {
  position: Position;
  tileId: number;
  layer: Layer;
  asset?: DirectionalAsset;
}

export const TILE_SIZE = 64;
export const MOVEMENT_DURATION = 200; // milliseconds for smooth movement
