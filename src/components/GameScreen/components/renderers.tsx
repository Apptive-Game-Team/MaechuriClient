import type { TileEntity, PlayerEntity } from '../types';
import { getDirectionIndicatorStyle, isInteractableHighlighted } from '../utils/gameUtils';
import { getAssetImage } from '../../../utils/assetLoader';
import { AssetRenderer } from './AssetRenderer';

const TILE_SIZE_VALUE = 64;

// Direction mapping for player assets (defined once outside the component)
const DIRECTION_TO_ASSET_MAP = {
  'up': 'back',
  'down': 'front',
  'left': 'left',
  'right': 'right',
} as const;

export const Tile = (props: TileEntity) => {
  const { position, tileId, layer, asset, isObject, objectType } = props;
  
  const imageUrl = asset ? getAssetImage(asset) : undefined;

  // Determine scaleMultiplier for objects
  let scaleMultiplier = 1.3; // Default for most objects
  if (objectType === 'CLUE') {
    scaleMultiplier = 0.7;
  }
  // NPC (suspect, detective) is already 1.3, so no change needed for that case explicitly

  // Check if this interactable object should be visually highlighted
  const outlined = isObject === true && typeof tileId === 'string' && isInteractableHighlighted(tileId);

  // Use AssetRenderer for objects to maintain aspect ratio and custom scale,
  // and the old method for background layers to fill the tile.
  if (imageUrl && isObject) {
    return <AssetRenderer imageUrl={imageUrl} size={TILE_SIZE_VALUE} position={position} scaleMultiplier={scaleMultiplier} outlined={outlined} />;
  }
  
  // For floor, walls, and other layers, use the original full-tile rendering
  let backgroundColor = 'transparent';
  if (layer.name === 'wall' && tileId !== 0) {
    backgroundColor = '#8B4513';
  } else if (layer.name === 'floor' && tileId === 0) {
    backgroundColor = '#D2B48C';
  } else if (isObject && tileId !== 0) { // Fallback for objects without an image
    backgroundColor = '#FFD700';
  } else if (!imageUrl) { // Bright pink for missing layer assets
    backgroundColor = '#FF00FF';
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
    zIndex: layer.orderInLayer,
  };

  return (
    <div
      style={style}
    />
  );
};

export const Player = (props: PlayerEntity) => {
  const { position, direction, asset, interpolatedPosition, objectType } = props;

  // Use interpolated position for smooth rendering
  const renderPosition = interpolatedPosition || position;

  // Map direction to asset direction using the constant
  const assetDirection = DIRECTION_TO_ASSET_MAP[direction];

  // Get image URL from asset if available
  const imageUrl = asset ? getAssetImage(asset, assetDirection) : undefined;

  // Player is an object, so use AssetRenderer with its specific scale
  const scaleMultiplier = (objectType === 'PLAYER') ? 1.3 : 1.3; // Explicitly 1.3 for player
  
  if (imageUrl) {
    return <AssetRenderer imageUrl={imageUrl} size={TILE_SIZE_VALUE} position={renderPosition} scaleMultiplier={scaleMultiplier} />;
  }

  const style: React.CSSProperties = {
    position: 'absolute',
    left: renderPosition.x * TILE_SIZE_VALUE,
    top: renderPosition.y * TILE_SIZE_VALUE,
    width: TILE_SIZE_VALUE,
    height: TILE_SIZE_VALUE,
    backgroundColor: '#FF6B6B',
    borderRadius: '50%',
    zIndex: 1000,
  };

  return (
    <div
      style={style}
    >
      <div style={getDirectionIndicatorStyle(direction)} />
    </div>
  );
};
