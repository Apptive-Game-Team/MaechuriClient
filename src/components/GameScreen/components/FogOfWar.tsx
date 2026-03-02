import { useEffect, useRef, useMemo } from 'react';
import type { FogOfWarEntity } from '../types';
import { calculateFogOpacity } from '../utils/raycastUtils';
import { TILE_SIZE, FOG_RESOLUTION_MULTIPLIER } from '../types';

export const FogOfWar = (props: FogOfWarEntity) => {
  const { visibleTiles, playerPosition, mapWidth, mapHeight } = props;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { mapPixelWidth, mapPixelHeight, fogCellSize, mapHeightFine, mapWidthFine } = useMemo(() => {
    const mapPixelWidth = mapWidth ? mapWidth * TILE_SIZE : 0;
    const mapPixelHeight = mapHeight ? mapHeight * TILE_SIZE : 0;
    const fogCellSize = TILE_SIZE / FOG_RESOLUTION_MULTIPLIER;
    const mapHeightFine = mapHeight ? mapHeight * FOG_RESOLUTION_MULTIPLIER : 0;
    const mapWidthFine = mapWidth ? mapWidth * FOG_RESOLUTION_MULTIPLIER : 0;
    return { mapPixelWidth, mapPixelHeight, fogCellSize, mapHeightFine, mapWidthFine };
  }, [mapWidth, mapHeight]);

  useEffect(() => {
    if (mapWidth === undefined || mapHeight === undefined || !playerPosition) {
      console.warn("FogOfWar received undefined mapWidth, mapHeight, or playerPosition, not rendering effect.");
      return; // Return early from the effect
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions here to be safe
    canvas.width = mapPixelWidth;
    canvas.height = mapPixelHeight;

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
  }, [visibleTiles, playerPosition, mapWidth, mapHeight, fogCellSize, mapHeightFine, mapPixelWidth, mapPixelHeight, mapWidthFine]);

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
