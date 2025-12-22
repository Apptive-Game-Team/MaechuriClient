import type { Entity } from 'react-game-engine';
import type { TileEntity, PlayerEntity } from '../types';
import { getDirectionIndicatorStyle } from '../utils/gameUtils';

const TILE_SIZE_VALUE = 64;

export const renderTile = (entity: Entity) => {
  const { position, tileId, layer } = entity as TileEntity;
  
  let backgroundColor = 'transparent';
  if (layer.name === 'wall' && tileId !== 0) {
    backgroundColor = '#8B4513';
  } else if (layer.name === 'floor' && tileId === 0) {
    backgroundColor = '#D2B48C';
  } else if (layer.name === 'interactable-objects' && tileId !== 0) {
    backgroundColor = '#FFD700';
  }

  return (
    <div
      key={`${layer.name}-${position.x}-${position.y}`}
      style={{
        position: 'absolute',
        left: position.x * TILE_SIZE_VALUE,
        top: position.y * TILE_SIZE_VALUE,
        width: TILE_SIZE_VALUE,
        height: TILE_SIZE_VALUE,
        backgroundColor,
        border: '1px solid rgba(0,0,0,0.1)',
      }}
    />
  );
};

export const renderPlayer = (entity: Entity) => {
  const { position, direction } = entity as PlayerEntity;

  return (
    <div
      key={`player-${position.x}-${position.y}-${direction}`}
      style={{
        position: 'absolute',
        left: position.x * TILE_SIZE_VALUE,
        top: position.y * TILE_SIZE_VALUE,
        width: TILE_SIZE_VALUE,
        height: TILE_SIZE_VALUE,
        backgroundColor: '#FF6B6B',
        borderRadius: '50%',
        zIndex: 1000,
      }}
    >
      <div style={getDirectionIndicatorStyle(direction)} />
    </div>
  );
};
