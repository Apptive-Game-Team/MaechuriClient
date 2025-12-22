import { mockScenarioData } from '../../../data/mockData';
import type { Direction, Position } from '../types';

export const checkCollision = (x: number, y: number): boolean => {
  const { layers } = mockScenarioData.map;
  
  for (const layer of layers) {
    if (layer.type.includes("Non-Passable")) {
      if (y >= 0 && y < layer.tileMap.length && 
          x >= 0 && x < layer.tileMap[0].length) {
        if (layer.tileMap[y][x] !== 0) {
          return true; // Collision detected
        }
      }
    }
  }
  return false;
};

export const checkInteraction = (x: number, y: number): number | null => {
  const { layers } = mockScenarioData.map;
  
  for (const layer of layers) {
    if (layer.type.includes("Interactable")) {
      if (y >= 0 && y < layer.tileMap.length && 
          x >= 0 && x < layer.tileMap[0].length) {
        const tileId = layer.tileMap[y][x];
        if (tileId !== 0) {
          return tileId;
        }
      }
    }
  }
  return null;
};

export const getFacingPosition = (position: Position, direction: Direction): Position => {
  switch (direction) {
    case 'up':
      return { x: position.x, y: position.y - 1 };
    case 'down':
      return { x: position.x, y: position.y + 1 };
    case 'left':
      return { x: position.x - 1, y: position.y };
    case 'right':
      return { x: position.x + 1, y: position.y };
  }
};

export const getDirectionIndicatorStyle = (direction: Direction) => {
  const baseStyle = {
    position: 'absolute' as const,
    width: 0,
    height: 0,
    borderStyle: 'solid' as const,
  };

  switch (direction) {
    case 'up':
      return {
        ...baseStyle,
        bottom: '50%',
        left: '50%',
        transform: 'translateX(-50%)',
        borderWidth: '0 8px 12px 8px',
        borderColor: 'transparent transparent #ffffff transparent',
      };
    case 'down':
      return {
        ...baseStyle,
        top: '50%',
        left: '50%',
        transform: 'translateX(-50%)',
        borderWidth: '12px 8px 0 8px',
        borderColor: '#ffffff transparent transparent transparent',
      };
    case 'left':
      return {
        ...baseStyle,
        top: '50%',
        right: '50%',
        transform: 'translateY(-50%)',
        borderWidth: '8px 12px 8px 0',
        borderColor: 'transparent #ffffff transparent transparent',
      };
    case 'right':
      return {
        ...baseStyle,
        top: '50%',
        left: '50%',
        transform: 'translateY(-50%)',
        borderWidth: '8px 0 8px 12px',
        borderColor: 'transparent transparent transparent #ffffff',
      };
  }
};
