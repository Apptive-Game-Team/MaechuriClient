import { mockScenarioData } from '../../../data/mockData';
import type { Position } from '../types';
import { VISION_RANGE, CLEAR_VISION_RADIUS, GRADIENT_START_RADIUS } from '../types';

/**
 * Check if a tile blocks vision based on layer types
 */
export const isVisionBlocking = (x: number, y: number): boolean => {
  const { layers } = mockScenarioData.map;
  
  for (const layer of layers) {
    if (layer.type.includes("Blocks-Vision")) {
      if (y >= 0 && y < layer.tileMap.length && 
          x >= 0 && x < layer.tileMap[0].length) {
        if (layer.tileMap[y][x] !== 0) {
          return true; // This tile blocks vision
        }
      }
    }
  }
  return false;
};

/**
 * Perform raycast from start position to end position
 * Returns true if line of sight is clear, false if blocked
 */
export const raycast = (from: Position, to: Position): boolean => {
  // Use Bresenham's line algorithm to trace the line
  const dx = Math.abs(to.x - from.x);
  const dy = Math.abs(to.y - from.y);
  const sx = from.x < to.x ? 1 : -1;
  const sy = from.y < to.y ? 1 : -1;
  let err = dx - dy;
  
  let currentX = from.x;
  let currentY = from.y;
  
  while (true) {
    // Don't check the starting position
    if (!(currentX === from.x && currentY === from.y)) {
      // Check if current position blocks vision
      if (isVisionBlocking(currentX, currentY)) {
        return false; // Line of sight blocked
      }
    }
    
    // Reached the target
    if (currentX === to.x && currentY === to.y) {
      break;
    }
    
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      currentX += sx;
    }
    if (e2 < dx) {
      err += dx;
      currentY += sy;
    }
  }
  
  return true; // Line of sight is clear
};

/**
 * Calculate which tiles are visible from the player position
 * Returns a Set of tile coordinates in the format "x,y"
 */
export const calculateVisibleTiles = (playerPos: Position): Set<string> => {
  const visibleTiles = new Set<string>();
  const { layers } = mockScenarioData.map;
  
  // Validate map structure
  if (layers.length === 0 || layers[0].tileMap.length === 0) {
    return visibleTiles;
  }
  
  const mapHeight = layers[0].tileMap.length;
  const mapWidth = layers[0].tileMap[0].length;
  
  // Use circular iteration for better performance
  // Only check tiles within a square that bounds the circular vision range
  const minY = Math.max(0, Math.floor(playerPos.y - VISION_RANGE));
  const maxY = Math.min(mapHeight - 1, Math.ceil(playerPos.y + VISION_RANGE));
  const minX = Math.max(0, Math.floor(playerPos.x - VISION_RANGE));
  const maxX = Math.min(mapWidth - 1, Math.ceil(playerPos.x + VISION_RANGE));
  
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      // Calculate distance from player
      const dx = x - playerPos.x;
      const dy = y - playerPos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Skip if beyond vision range
      if (distance > VISION_RANGE) {
        continue;
      }
      
      // Perform raycast to check line of sight
      if (raycast(playerPos, { x, y })) {
        visibleTiles.add(`${x},${y}`);
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
  
  // Within clear vision radius - no fog
  if (distance <= GRADIENT_START_RADIUS) {
    return 0;
  }
  
  // Between gradient start and clear vision radius
  if (distance < CLEAR_VISION_RADIUS) {
    const gradientRange = CLEAR_VISION_RADIUS - GRADIENT_START_RADIUS;
    const gradientPosition = distance - GRADIENT_START_RADIUS;
    return gradientPosition / gradientRange * 0.5; // Max 50% opacity in this range
  }
  
  // Beyond clear vision radius - increase fog
  if (distance < VISION_RANGE) {
    const fadeRange = VISION_RANGE - CLEAR_VISION_RADIUS;
    const fadePosition = distance - CLEAR_VISION_RADIUS;
    return 0.5 + (fadePosition / fadeRange * 0.5); // 50% to 100% opacity
  }
  
  // Beyond vision range - fully fogged
  return 1;
};
