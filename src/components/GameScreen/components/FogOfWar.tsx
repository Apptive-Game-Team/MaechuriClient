import React from 'react';
import { mockScenarioData } from '../../../data/mockData';
import type { FogOfWarEntity } from '../types';
import { calculateFogOpacity } from '../utils/raycastUtils';
import { TILE_SIZE } from '../types';

export const FogOfWar = (props: FogOfWarEntity) => {
  const { visibleTiles, playerPosition } = props;

  // Get map dimensions from mockScenarioData
  const mapHeight = mockScenarioData.map.layers[0].tileMap.length;
  const mapWidth = mockScenarioData.map.layers[0].tileMap[0].length;

  const fogTiles: React.ReactElement[] = [];

  for (let y = 0; y < mapHeight; y++) {
    for (let x = 0; x < mapWidth; x++) {
      const tileKey = `${x},${y}`;
      const isVisible = visibleTiles ? visibleTiles.has(tileKey) : false;

      let opacity = 1; // Default to full fog
      if (isVisible && playerPosition) {
        opacity = calculateFogOpacity(playerPosition, { x, y });
      }

      if (opacity > 0) {
        fogTiles.push(
          <div
            key={`fog-${x}-${y}`}
            style={{
              position: 'absolute',
              left: x * TILE_SIZE,
              top: y * TILE_SIZE,
              width: TILE_SIZE,
              height: TILE_SIZE,
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

  return <>{fogTiles}</>;
};
