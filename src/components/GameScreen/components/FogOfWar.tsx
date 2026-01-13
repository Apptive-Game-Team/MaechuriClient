import { useEffect, useRef } from 'react';
import { mockScenarioData } from '../../../data/mockData';
import type { FogOfWarEntity } from '../types';
import { calculateFogOpacity } from '../utils/raycastUtils';
import { TILE_SIZE, FOG_RESOLUTION_MULTIPLIER } from '../types';

export const FogOfWar = (props: FogOfWarEntity) => {
  const { visibleTiles, playerPosition } = props;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const mapHeight = mockScenarioData.map.layers[0].tileMap.length;
  const mapWidth = mockScenarioData.map.layers[0].tileMap[0].length;
  const mapPixelWidth = mapWidth * TILE_SIZE;
  const mapPixelHeight = mapHeight * TILE_SIZE;

  const fogCellSize = TILE_SIZE / FOG_RESOLUTION_MULTIPLIER;
  const mapHeightFine = mapHeight * FOG_RESOLUTION_MULTIPLIER;
  const mapWidthFine = mapWidth * FOG_RESOLUTION_MULTIPLIER;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !playerPosition) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#000000';

    for (let y = 0; y < mapHeightFine; y++) {
      for (let x = 0; x < mapWidthFine; x++) {
        const tileKey = `${x},${y}`;
        const visibilityFactor = visibleTiles ? visibleTiles.get(tileKey) || 0 : 0;

        let opacity = 1; // Default to full fog

        if (visibilityFactor > 0) {
          const cellCenterX = (x + 0.5) / FOG_RESOLUTION_MULTIPLIER;
          const cellCenterY = (y + 0.5) / FOG_RESOLUTION_MULTIPLIER;
          
          const distanceOpacity = calculateFogOpacity(playerPosition, { x: cellCenterX, y: cellCenterY });
          const shadowOpacity = 1 - visibilityFactor;
          opacity = Math.max(distanceOpacity, shadowOpacity);
        }

        if (opacity > 0) {
          ctx.globalAlpha = opacity;
          // Draw a slightly larger rectangle to prevent grid artifacts from anti-aliasing
          ctx.fillRect(
            x * fogCellSize - 0.5, 
            y * fogCellSize - 0.5, 
            fogCellSize + 1, 
            fogCellSize + 1
          );
        }
      }
    }
  }, [visibleTiles, playerPosition, fogCellSize, mapHeightFine, mapWidthFine]);

  return (
    <canvas
      ref={canvasRef}
      width={mapPixelWidth}
      height={mapPixelHeight}
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        pointerEvents: 'none',
        zIndex: 2000,
      }}
    />
  );
};

