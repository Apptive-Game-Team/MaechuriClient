import React, { useEffect, useMemo } from 'react';
import { GameEngine } from 'react-game-engine';
import type { Entity } from 'react-game-engine';
import { mockScenarioData } from '../../data/mockData';
import type { Layer } from '../../types/map';
import './GameScreen.css';

const TILE_SIZE = 64;

// Helper function to get direction indicator style
const getDirectionIndicatorStyle = (direction: Direction) => {
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

interface Position {
  x: number;
  y: number;
}

type Direction = 'up' | 'down' | 'left' | 'right';

interface PlayerEntity extends Entity {
  position: Position;
  direction: Direction;
}

interface TileEntity extends Entity {
  position: Position;
  tileId: number;
  layer: Layer;
}

const GameScreen: React.FC = () => {
  const [playerPosition, setPlayerPosition] = React.useState<Position>({ x: 1, y: 1 });
  const [playerDirection, setPlayerDirection] = React.useState<Direction>('down');

  const checkCollision = (x: number, y: number): boolean => {
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

  const checkInteraction = (x: number, y: number): number | null => {
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

  const getFacingPosition = React.useCallback((position: Position): Position => {
    switch (playerDirection) {
      case 'up':
        return { x: position.x, y: position.y - 1 };
      case 'down':
        return { x: position.x, y: position.y + 1 };
      case 'left':
        return { x: position.x - 1, y: position.y };
      case 'right':
        return { x: position.x + 1, y: position.y };
    }
  }, [playerDirection]);

  const handleKeyDown = React.useCallback((e: KeyboardEvent) => {
    let newDirection: Direction | null = null;

    // Determine direction from key press
    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        newDirection = 'up';
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        newDirection = 'down';
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        newDirection = 'left';
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        newDirection = 'right';
        break;
      case ' ':
      case 'e':
      case 'E':
        // Interact key - only check the direction the player is facing
        setPlayerPosition((currentPosition) => {
          const facingPosition = getFacingPosition(currentPosition);
          const interactableId = checkInteraction(facingPosition.x, facingPosition.y);
          if (interactableId !== null) {
            alert(`Interacting with object ID: ${interactableId}`);
          }
          return currentPosition;
        });
        return;
    }

    // Update direction if a movement key was pressed
    if (newDirection) {
      setPlayerDirection(newDirection);
      
      // Try to move in the new direction
      setPlayerPosition((currentPosition) => {
        let newX = currentPosition.x;
        let newY = currentPosition.y;

        switch (newDirection) {
          case 'up':
            newY -= 1;
            break;
          case 'down':
            newY += 1;
            break;
          case 'left':
            newX -= 1;
            break;
          case 'right':
            newX += 1;
            break;
        }

        if (!checkCollision(newX, newY)) {
          return { x: newX, y: newY };
        }
        return currentPosition;
      });
    }
  }, [getFacingPosition]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  const renderTile = (entity: Entity) => {
    const { position, tileId, layer } = entity as TileEntity;
    
    let backgroundColor = 'transparent';
    if (layer.name === 'wall' && tileId !== 0) {
      backgroundColor = '#8B4513';
    } else if (layer.name === 'floor' && tileId === 0) {
      backgroundColor = '#D2B48C';
    } else if (layer.name === 'interactable-objects' && tileId !== 0) {
      backgroundColor = '#FFD700';
    }

    return (
      <div
        key={`${layer.name}-${position.x}-${position.y}`}
        style={{
          position: 'absolute',
          left: position.x * TILE_SIZE,
          top: position.y * TILE_SIZE,
          width: TILE_SIZE,
          height: TILE_SIZE,
          backgroundColor,
          border: '1px solid rgba(0,0,0,0.1)',
        }}
      />
    );
  };

  const renderPlayer = (entity: Entity) => {
    const { position, direction } = entity as PlayerEntity;

    return (
      <div
        style={{
          position: 'absolute',
          left: position.x * TILE_SIZE,
          top: position.y * TILE_SIZE,
          width: TILE_SIZE,
          height: TILE_SIZE,
          backgroundColor: '#FF6B6B',
          borderRadius: '50%',
          zIndex: 1000,
        }}
      >
        <div style={getDirectionIndicatorStyle(direction)} />
      </div>
    );
  };

  const entities = useMemo(() => {
    const result: Record<string, TileEntity | PlayerEntity> = {};
    const { layers } = mockScenarioData.map;

    // Sort layers by orderInLayer
    const sortedLayers = [...layers].sort((a, b) => a.orderInLayer - b.orderInLayer);

    // Create tile entities for each layer
    sortedLayers.forEach((layer) => {
      layer.tileMap.forEach((row, y) => {
        row.forEach((tileId, x) => {
          const key = `${layer.name}-${x}-${y}`;
          result[key] = {
            position: { x, y },
            tileId,
            layer,
            renderer: renderTile,
          };
        });
      });
    });

    // Add player entity
    result.player = {
      position: playerPosition,
      direction: playerDirection,
      renderer: renderPlayer,
    };

    return result;
  }, [playerPosition, playerDirection]);

  const mapWidth = mockScenarioData.map.layers[0].tileMap[0].length * TILE_SIZE;
  const mapHeight = mockScenarioData.map.layers[0].tileMap.length * TILE_SIZE;

  return (
    <div className="game-screen">
      <div className="game-info">
        <h2>{mockScenarioData.scenarioName}</h2>
        <p>Use Arrow Keys or WASD to move. Press E or Space to interact with objects.</p>
        <p>Player Position: ({playerPosition.x}, {playerPosition.y}) | Direction: {playerDirection}</p>
      </div>
      <div className="game-container" style={{ width: mapWidth, height: mapHeight }}>
        <GameEngine
          style={{ width: mapWidth, height: mapHeight }}
          systems={[]}
          entities={entities}
        />
      </div>
    </div>
  );
};

export default GameScreen;
