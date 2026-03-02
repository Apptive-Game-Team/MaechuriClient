import type { Direction, Position } from '../types';
import type { GameMap } from '../../../types/map';

// Store the current map data globally for utility functions
let currentMapData: GameMap | null = null;

export const setCurrentMapData = (mapData: GameMap) => {
  currentMapData = mapData;
};

export const checkCollision = (x: number, y: number): boolean => {
  if (!currentMapData) return false;
  const { layers, objects } = currentMapData;

  const tileX = Math.round(x);
  const tileY = Math.round(y);

  for (const layer of layers) {
    if (layer.type.includes("Non-Passable")) {
      if (tileY >= 0 && tileY < layer.tileMap.length && 
          tileX >= 0 && tileX < layer.tileMap[0].length) {
        if (layer.tileMap[tileY][tileX] !== 0) {
          return true; // Collision detected
        }
      }
    }
  }

  for (const object of objects) {
    if (Math.round(object.position.x) === tileX && Math.round(object.position.y) === tileY) {
      if (object.type.includes("Non-Passable")) {
        return true; // Collision with object detected
      }
    }
  }

  return false;
};

export const checkInteraction = (x: number, y: number): string | null => {
  if (!currentMapData) return null;
  const { layers, objects } = currentMapData;
  const tileX = Math.round(x);
  const tileY = Math.round(y);

  for (const layer of layers) {
    if (layer.type.includes("Interactable")) {
      if (tileY >= 0 && tileY < layer.tileMap.length && 
          tileX >= 0 && tileX < layer.tileMap[0].length) {
        const tileId = layer.tileMap[tileY][tileX];
        if (tileId !== 0) {
          return String(tileId);
        }
      }
    }
  }

  for (const object of objects) {
    if (Math.round(object.position.x) === tileX && Math.round(object.position.y) === tileY) {
      if (object.type.includes("Interactable")) {
        return object.id;
      }
    }
  }

  return null;
};

export const getObjectInfo = (x: number, y: number): { id: string; name: string } | null => {
  if (!currentMapData) return null;
  const { objects } = currentMapData;
  const tileX = Math.round(x);
  const tileY = Math.round(y);

  for (const object of objects) {
    if (Math.round(object.position.x) === tileX && Math.round(object.position.y) === tileY) {
      if (object.type.includes("Interactable")) {
        return { id: object.id, name: object.name };
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
    default:
      // This should not happen with the Direction type, but it satisfies the compiler
      throw new Error(`Invalid direction: ${direction}`);
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
