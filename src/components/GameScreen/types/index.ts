import type { Entity } from 'react-game-engine';
import type { Layer, DirectionalAsset, Direction } from '../../../types/map';
import type { RecordType } from '../../../types/record'; // Import RecordType

export type { Direction };
export interface Position {
  x: number;
  y: number;
}

export interface PlayerEntity extends Entity {
  position: Position;
  direction: Direction;
  speed: number;
  asset: DirectionalAsset | null;
  lastTilePosition?: Position;
  pathQueue?: Position[];          // A* waypoints for mouse-driven navigation
  pendingInteraction?: boolean;    // Trigger interaction on path completion
  pendingInteractDirection?: Direction; // Direction to face when interacting
}

export interface TileEntity extends Entity {
  position: Position;
  tileId: number | string;
  layer: Layer;
  asset?: DirectionalAsset;
  isObject?: boolean;
  objectType?: RecordType | 'PLAYER' | 'SUSPECT' | 'DETECTIVE'; // Add objectType for granular scaling
}

export const TILE_SIZE = 64;
export const MOVEMENT_DURATION = 200; // milliseconds for smooth movement
export const PLAYER_ASSET_ID = 'p:1'; // Asset ID for player in the assets array
