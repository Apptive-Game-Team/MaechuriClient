import { mockScenarioData } from '../../../data/mockData';
import type { Position } from '../types';
import { 
  VISION_RANGE, 
  CLEAR_VISION_RADIUS,
  GRADIENT_START_RADIUS,
  FOG_RESOLUTION_MULTIPLIER
} from '../types';

/**
 * Check if a tile blocks vision based on layer types
 */
export const isVisionBlocking = (x: number, y: number): boolean => {
  const { layers } = mockScenarioData.map;
  const mapHeight = layers[0].tileMap.length;
  const mapWidth = layers[0].tileMap[0].length;
  
  for (const layer of layers) {
    if (layer.type.includes("Blocks-Vision")) {
      if (y >= 0 && y < mapHeight && x >= 0 && x < mapWidth) {
        if (layer.tileMap[y][x] !== 0) {
          return true; // This tile blocks vision
        }
      }
    }
  }
  return false;
};

/**
 * Perform a precise raycast from a start position to an end position
 * using a DDA-like algorithm (Amanatides & Woo).
 * Returns true if line of sight is clear, false if blocked.
 */
export const raycast = (from: Position, to: Position): boolean => {
  const startMapX = Math.floor(from.x);
  const startMapY = Math.floor(from.y);
  const endMapX = Math.floor(to.x);
  const endMapY = Math.floor(to.y);

  // If start and end are in the same tile, visibility is clear.
  // This prevents the player's current tile from being blacked out.
  if (startMapX === endMapX && startMapY === endMapY) {
    return true;
  }

  const rayDirX = to.x - from.x;
  const rayDirY = to.y - from.y;

  if (rayDirX === 0 && rayDirY === 0) {
    return true;
  }

  let mapX = Math.floor(from.x);
  let mapY = Math.floor(from.y);

  // Length of ray from one x or y-side to next x or y-side
  const deltaDistX = Math.abs(rayDirX === 0 ? Infinity : 1 / rayDirX);
  const deltaDistY = Math.abs(rayDirY === 0 ? Infinity : 1 / rayDirY);

  let stepX: number;
  let sideDistX: number;

  if (rayDirX < 0) {
    stepX = -1;
    sideDistX = (from.x - mapX) * deltaDistX;
  } else {
    stepX = 1;
    sideDistX = (mapX + 1.0 - from.x) * deltaDistX;
  }

  let stepY: number;
  let sideDistY: number;

  if (rayDirY < 0) {
    stepY = -1;
    sideDistY = (from.y - mapY) * deltaDistY;
  } else {
    stepY = 1;
    sideDistY = (mapY + 1.0 - from.y) * deltaDistY;
  }

  // Arbitrary large number to prevent infinite loops
  const maxDistance = VISION_RANGE * 2;
  let distance = 0;

  const isDestinationBlocking = isVisionBlocking(endMapX, endMapY);

  while (distance < maxDistance) {
    if (sideDistX < sideDistY) {
      sideDistX += deltaDistX;
      mapX += stepX;
    } else {
      sideDistY += deltaDistY;
      mapY += stepY;
    }
    distance++;

    if (isVisionBlocking(mapX, mapY)) {
      // If we hit a wall, we only block vision if the destination is NOT a wall.
      // This stops walls from casting shadows on other walls.
      if (!isDestinationBlocking) {
        if (mapX !== endMapX || mapY !== endMapY) {
          return false;
        }
      }
    }

    if (mapX === endMapX && mapY === endMapY) {
      return true;
    }
  }

  // If we reach max distance without hitting the target, something is wrong,
  // but we'll consider it a clear path to avoid getting stuck in fog.
  return true;
};


/**
 * Calculate which fine-grained fog cells are visible from the player position
 * Returns a Map of cell coordinates to their visibility factor (0.0 to 1.0)
 */
export const calculateVisibleTiles = (playerPos: Position): Map<string, number> => {
  const visibleTiles = new Map<string, number>();
  const { layers } = mockScenarioData.map;
  
  if (layers.length === 0 || layers[0].tileMap.length === 0) {
    return visibleTiles;
  }
  
  const mapHeight = layers[0].tileMap.length;
  const mapWidth = layers[0].tileMap[0].length;

  // Operate in the high-resolution fog grid coordinate space
  const playerXFine = playerPos.x * FOG_RESOLUTION_MULTIPLIER;
  const playerYFine = playerPos.y * FOG_RESOLUTION_MULTIPLIER;
  const visionRangeFine = VISION_RANGE * FOG_RESOLUTION_MULTIPLIER;

  const minY = Math.max(0, Math.floor(playerYFine - visionRangeFine));
  const maxY = Math.min(mapHeight * FOG_RESOLUTION_MULTIPLIER - 1, Math.ceil(playerYFine + visionRangeFine));
  const minX = Math.max(0, Math.floor(playerXFine - visionRangeFine));
  const maxX = Math.min(mapWidth * FOG_RESOLUTION_MULTIPLIER - 1, Math.ceil(playerXFine + visionRangeFine));
  
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const cellCenterTileX = (x + 0.5) / FOG_RESOLUTION_MULTIPLIER;
      const cellCenterTileY = (y + 0.5) / FOG_RESOLUTION_MULTIPLIER;
      
      const dx = cellCenterTileX - playerPos.x;
      const dy = cellCenterTileY - playerPos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > VISION_RANGE) {
        continue;
      }

      // Supersampling: cast 5 rays to different points in the cell
      const samplePoints = [
        { x: 0.5, y: 0.5 }, // Center
        { x: 0.1, y: 0.1 }, // Top-left
        { x: 0.9, y: 0.1 }, // Top-right
        { x: 0.1, y: 0.9 }, // Bottom-left
        { x: 0.9, y: 0.9 }, // Bottom-right
      ];

      let successfulRays = 0;
      for (const point of samplePoints) {
        const targetTileX = (x + point.x) / FOG_RESOLUTION_MULTIPLIER;
        const targetTileY = (y + point.y) / FOG_RESOLUTION_MULTIPLIER;
        if (raycast(playerPos, { x: targetTileX, y: targetTileY })) {
          successfulRays++;
        }
      }

      if (successfulRays > 0) {
        const visibilityFactor = successfulRays / samplePoints.length;
        visibleTiles.set(`${x},${y}`, visibilityFactor);
      }
    }
  }
  
  return visibleTiles;
};

/**
 * Calculate opacity for a tile based on distance from player
 * Returns 0 (fully transparent) to 1 (fully opaque fog)
 */
export const calculateFogOpacity = (playerPos: Position, tilePos: Position): number => {
  const dx = tilePos.x - playerPos.x;
  const dy = tilePos.y - playerPos.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // If within the clear vision radius, no fog
  if (distance <= CLEAR_VISION_RADIUS) {
    return 0;
  }
  
  // If beyond the vision range, full fog
  if (distance >= VISION_RANGE) {
    return 1;
  }
  
  // Calculate linear interpolation from 0 to 1 between GRADIENT_START_RADIUS and VISION_RANGE
  const gradientRange = VISION_RANGE - GRADIENT_START_RADIUS;
  const gradientPosition = distance - GRADIENT_START_RADIUS;
  
  return gradientPosition / gradientRange;
};
