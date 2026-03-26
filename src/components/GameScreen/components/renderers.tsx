import React from 'react';
import type { TileEntity, PlayerEntity } from '../types';
import { getDirectionIndicatorStyle, isInteractableHighlighted } from '../utils/gameUtils';
import { getAssetImage } from '../../../utils/assetLoader';
import { AssetRenderer } from './AssetRenderer';

const TILE_SIZE_VALUE = 64;

// Direction mapping for player assets
const DIRECTION_TO_ASSET_MAP = {
  'up': 'back',
  'down': 'front',
  'left': 'left',
  'right': 'right',
} as const;

export interface MapLayerProps {
  layerName: string;
  orderInLayer: number;
  tiles: { x: number; y: number; tileId: number; imageUrl?: string }[];
}

// Memoized MapLayer - very important as it contains many tiles
export const MapLayer = React.memo((props: any) => {
  const { tiles, orderInLayer, layerName } = props;
  
  if (!tiles) return null;

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, zIndex: orderInLayer }}>
      {tiles.map((tile: any, idx: number) => (
        <div
          key={`${layerName}-${tile.x}-${tile.y}-${idx}`}
          style={{
            position: 'absolute',
            left: tile.x * TILE_SIZE_VALUE,
            top: tile.y * TILE_SIZE_VALUE,
            width: TILE_SIZE_VALUE,
            height: TILE_SIZE_VALUE,
            backgroundColor: tile.imageUrl ? 'transparent' : (layerName === 'Borders' ? 'rgba(0,0,0,0.2)' : 'transparent'),
            backgroundImage: tile.imageUrl ? `url(${tile.imageUrl})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            imageRendering: 'pixelated',
          }}
        />
      ))}
    </div>
  );
});

// Memoized Tile
export const Tile = React.memo((props: TileEntity) => {
  const { position, tileId, layer, asset, isObject, objectType } = props;
  
  const imageUrl = asset ? getAssetImage(asset) : undefined;

  let scaleMultiplier = 1.3;
  if (objectType === 'CLUE') {
    scaleMultiplier = 0.7;
  }
  
  const outlined = isObject === true && typeof tileId === 'string' && isInteractableHighlighted(tileId);

  if (imageUrl && isObject) {
    return <AssetRenderer imageUrl={imageUrl} size={TILE_SIZE_VALUE} position={position} scaleMultiplier={scaleMultiplier} outlined={outlined} />;
  }
  
  const style: React.CSSProperties = {
    position: 'absolute',
    left: position.x * TILE_SIZE_VALUE,
    top: position.y * TILE_SIZE_VALUE,
    width: TILE_SIZE_VALUE,
    height: TILE_SIZE_VALUE,
    backgroundImage: imageUrl ? `url(${imageUrl})` : undefined,
    backgroundSize: 'cover',
    zIndex: layer.orderInLayer,
  };

  return <div style={style} />;
});

// Memoized Player
export const Player = React.memo((props: PlayerEntity) => {
  const { position, direction, asset } = props;

  const assetDirection = DIRECTION_TO_ASSET_MAP[direction];
  const imageUrl = asset ? getAssetImage(asset, assetDirection) : undefined;

  if (imageUrl) {
    return <AssetRenderer imageUrl={imageUrl} size={TILE_SIZE_VALUE} position={position} scaleMultiplier={1.3} />;
  }

  const style: React.CSSProperties = {
    position: 'absolute',
    left: position.x * TILE_SIZE_VALUE,
    top: position.y * TILE_SIZE_VALUE,
    width: TILE_SIZE_VALUE,
    height: TILE_SIZE_VALUE,
    backgroundColor: '#FF6B6B',
    borderRadius: '50%',
    zIndex: 1000,
  };

  return (
    <div style={style}>
      <div style={getDirectionIndicatorStyle(direction)} />
    </div>
  );
});
