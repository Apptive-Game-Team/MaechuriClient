import React from 'react';
import type { Entity } from 'react-game-engine';
import type { PlayerEntity, TileEntity } from '../types';
import { calculateVisibleTiles, calculateFogOpacity } from '../utils/raycastUtils';

const TILE_SIZE_VALUE = 64;

export const FogOfWar = (props: Entity) => {
  const entities = props as Record<string, Entity>;
  const player = entities.player as PlayerEntity;
  
  if (!player) return null;
  
  // Use interpolated position for smooth fog movement
  const playerPos = player.interpolatedPosition || player.position;
  
  // Calculate visible tiles
  const visibleTiles = calculateVisibleTiles(playerPos);
  
  // Create fog tiles for all map tiles
  const fogTiles: React.ReactElement[] = [];
  
  // Get map dimensions from first layer
  const firstTileKey = Object.keys(entities).find(key => key.startsWith('floor-'));
  if (firstTileKey) {
    const firstTile = entities[firstTileKey] as TileEntity;
    const tileMap = firstTile.layer.tileMap;
    const mapHeight = tileMap.length;
    const mapWidth = tileMap[0].length;
    
    for (let y = 0; y < mapHeight; y++) {
      for (let x = 0; x < mapWidth; x++) {
        const tileKey = `${x},${y}`;
        const isVisible = visibleTiles.has(tileKey);
        
        // Calculate fog opacity
        let opacity = 1; // Default fully fogged
        if (isVisible) {
          opacity = calculateFogOpacity(playerPos, { x, y });
        }
        
        // Only render fog if there's some opacity
        if (opacity > 0) {
          fogTiles.push(
            <div
              key={`fog-${x}-${y}`}
              style={{
                position: 'absolute',
                left: x * TILE_SIZE_VALUE,
                top: y * TILE_SIZE_VALUE,
                width: TILE_SIZE_VALUE,
                height: TILE_SIZE_VALUE,
                backgroundColor: '#000000',
                opacity: opacity,
                pointerEvents: 'none',
                zIndex: 2000, // Above player
              }}
            />
          );
        }
      }
    }
  }
  
  return <>{fogTiles}</>;
};
