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
  interpolatedPosition?: Position; // Smoothly interpolated position for rendering
  animation?: {
    startTime: number;
    startPos: Position;
    targetPos: Position;
  };
}

export interface TileEntity extends Entity {
  position: Position;
  tileId: number;
  layer: Layer;
  asset?: DirectionalAsset;
}

export interface FogOfWarEntity extends Entity {
  visibleTiles?: Map<string, number>;
  playerPosition?: Position;
  renderer: React.FC<FogOfWarEntity>;
}

export const TILE_SIZE = 64;
export const MOVEMENT_DURATION = 200; // milliseconds for smooth movement

// Vision system constants
export const VISION_RANGE = 16; // tiles - maximum vision range
export const CLEAR_VISION_RADIUS = 8; // tiles - radius where vision is clear (no gradient)
export const GRADIENT_START_RADIUS = 6; // tiles - radius where gradient starts
export const FOG_RESOLUTION_MULTIPLIER = 3; // Higher value = smoother fog edges
