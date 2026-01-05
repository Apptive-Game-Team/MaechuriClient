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
  // 1. 시작 위치를 정수로 변환하여 무한 루프 방지
  const startX = Math.round(from.x);
  const startY = Math.round(from.y);

  const dx = Math.abs(to.x - startX);
  const dy = Math.abs(to.y - startY);
  const sx = startX < to.x ? 1 : -1;
  const sy = startY < to.y ? 1 : -1;
  let err = dx - dy;

  let currentX = startX;
  let currentY = startY;

  // 무한 루프 방지를 위한 안전장치 (dx + dy는 이동할 최대 타일 수)
  const maxIterations = dx + dy + 2;
  for (let i = 0; i < maxIterations; i++) {
    // 2. 목표 타일이 아닌 중간 타일이 시야를 막는지 확인
    if (isVisionBlocking(currentX, currentY)) {
      if (currentX !== to.x || currentY !== to.y) {
        return false; // 시야가 중간 타일에 의해 막힘
      }
    }

    // 목표에 도달하면 시야가 트인 것
    if (currentX === to.x && currentY === to.y) {
      return true;
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

  return false; // 경로를 찾지 못한 경우
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
