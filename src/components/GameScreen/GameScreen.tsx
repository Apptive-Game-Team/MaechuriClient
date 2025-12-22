import React, { useEffect, useMemo } from 'react';
import { GameEngine } from 'react-game-engine';
import type { Entity } from 'react-game-engine';
import { mockScenarioData } from '../../data/mockData';
import type { Layer } from '../../types/map';
import './GameScreen.css';

const TILE_SIZE = 64;

interface Position {
  x: number;
  y: number;
}

interface PlayerEntity extends Entity {
  position: Position;
}

interface TileEntity extends Entity {
  position: Position;
  tileId: number;
  layer: Layer;
}

const GameScreen: React.FC = () => {
  const [playerPosition, setPlayerPosition] = React.useState<Position>({ x: 1, y: 1 });

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

  const handleKeyDown = React.useCallback((e: KeyboardEvent) => {
    setPlayerPosition((currentPosition) => {
      let newX = currentPosition.x;
      let newY = currentPosition.y;
      let moved = false;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          newY -= 1;
          moved = true;
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          newY += 1;
          moved = true;
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          newX -= 1;
          moved = true;
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          newX += 1;
          moved = true;
          break;
        case ' ':
        case 'e':
        case 'E': {
          // Interact key
          // Check all 4 directions for interactable objects
          const directions = [
            { x: currentPosition.x, y: currentPosition.y - 1 }, // up
            { x: currentPosition.x, y: currentPosition.y + 1 }, // down
            { x: currentPosition.x - 1, y: currentPosition.y }, // left
            { x: currentPosition.x + 1, y: currentPosition.y }, // right
          ];

          for (const dir of directions) {
            const interactableId = checkInteraction(dir.x, dir.y);
            if (interactableId !== null) {
              alert(`Interacting with object ID: ${interactableId}`);
              break;
            }
          }
          break;
        }
      }

      if (moved) {
        if (!checkCollision(newX, newY)) {
          return { x: newX, y: newY };
        }
      }
      return currentPosition;
    });
  }, []);

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
    const { position } = entity as PlayerEntity;
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
      />
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
      renderer: renderPlayer,
    };

    return result;
  }, [playerPosition]);

  const mapWidth = mockScenarioData.map.layers[0].tileMap[0].length * TILE_SIZE;
  const mapHeight = mockScenarioData.map.layers[0].tileMap.length * TILE_SIZE;

  return (
    <div className="game-screen">
      <div className="game-info">
        <h2>{mockScenarioData.scenarioName}</h2>
        <p>Use Arrow Keys or WASD to move. Press E or Space to interact with objects.</p>
        <p>Player Position: ({playerPosition.x}, {playerPosition.y})</p>
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
