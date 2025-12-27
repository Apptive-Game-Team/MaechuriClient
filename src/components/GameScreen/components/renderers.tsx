import type { Entity } from 'react-game-engine';
import type { TileEntity, PlayerEntity } from '../types';
import { getDirectionIndicatorStyle } from '../utils/gameUtils';
import { getAssetImage } from '../../../utils/assetLoader';

const TILE_SIZE_VALUE = 64;

// Direction mapping for player assets (defined once outside the component)
const DIRECTION_TO_ASSET_MAP = {
  'up': 'back',
  'down': 'front',
  'left': 'left',
  'right': 'right',
} as const;

export const renderTile = (entity: Entity) => {
  const { position, tileId, layer, asset } = entity as TileEntity;
  
  // Get image URL from asset if available
  const imageUrl = asset ? getAssetImage(asset) : undefined;
  
  // Default background colors for when no image is available
  let backgroundColor = 'transparent';
  if (layer.name === 'wall' && tileId !== 0) {
    backgroundColor = '#8B4513';
  } else if (layer.name === 'floor' && tileId === 0) {
    backgroundColor = '#D2B48C';
  } else if (layer.name === 'interactable-objects' && tileId !== 0) {
    backgroundColor = '#FFD700';
  }

  const style: React.CSSProperties = {
    position: 'absolute',
    left: position.x * TILE_SIZE_VALUE,
    top: position.y * TILE_SIZE_VALUE,
    width: TILE_SIZE_VALUE,
    height: TILE_SIZE_VALUE,
    backgroundColor: imageUrl ? 'transparent' : backgroundColor,
    border: '1px solid rgba(0,0,0,0.1)',
    backgroundImage: imageUrl ? `url(${imageUrl})` : undefined,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  };

  return (
    <div
      key={`${layer.name}-${position.x}-${position.y}`}
      style={style}
    />
  );
};

export const renderPlayer = (entity: Entity) => {
  const { position, direction, asset } = entity as PlayerEntity;

  // Map direction to asset direction using the constant
  const assetDirection = DIRECTION_TO_ASSET_MAP[direction];

  // Get image URL from asset if available
  const imageUrl = asset ? getAssetImage(asset, assetDirection) : undefined;

  const style: React.CSSProperties = {
    position: 'absolute',
    left: position.x * TILE_SIZE_VALUE,
    top: position.y * TILE_SIZE_VALUE,
    width: TILE_SIZE_VALUE,
    height: TILE_SIZE_VALUE,
    backgroundColor: imageUrl ? 'transparent' : '#FF6B6B',
    borderRadius: imageUrl ? '0' : '50%',
    zIndex: 1000,
    backgroundImage: imageUrl ? `url(${imageUrl})` : undefined,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  };

  return (
    <div
      key={`player-${position.x}-${position.y}-${direction}`}
      style={style}
    >
      {!imageUrl && <div style={getDirectionIndicatorStyle(direction)} />}
    </div>
  );
};
