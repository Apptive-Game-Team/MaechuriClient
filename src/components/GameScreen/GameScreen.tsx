import React, { useState } from 'react';
import { GameEngine } from 'react-game-engine';
import { mockScenarioData } from '../../data/mockData';
import type { Position, Direction } from './types';
import { TILE_SIZE } from './types';
import { usePlayerControls } from './hooks/usePlayerControls';
import { useGameEntities } from './hooks/useGameEntities';
import './GameScreen.css';

const GameScreen: React.FC = () => {
  const [playerPosition, setPlayerPosition] = useState<Position>({ x: 1, y: 1 });
  const [playerDirection, setPlayerDirection] = useState<Direction>('down');

  // Use custom hooks
  usePlayerControls(playerDirection, setPlayerPosition, setPlayerDirection);
  const entities = useGameEntities(playerPosition, playerDirection);

  const mapWidth = mockScenarioData.map.layers[0].tileMap[0].length * TILE_SIZE;
  const mapHeight = mockScenarioData.map.layers[0].tileMap.length * TILE_SIZE;

  // Create a unique key based on player position and direction to force re-render
  const gameKey = `game-${playerPosition.x}-${playerPosition.y}-${playerDirection}`;

  return (
    <div className="game-screen">
      <div className="game-info">
        <h2>{mockScenarioData.scenarioName}</h2>
        <p>Use Arrow Keys or WASD to move. Press E or Space to interact with objects.</p>
        <p>Player Position: ({playerPosition.x}, {playerPosition.y}) | Direction: {playerDirection}</p>
      </div>
      <div className="game-container" style={{ width: mapWidth, height: mapHeight }}>
        <GameEngine
          key={gameKey}
          style={{ width: mapWidth, height: mapHeight }}
          systems={[]}
          entities={entities}
        />
      </div>
    </div>
  );
};

export default GameScreen;
