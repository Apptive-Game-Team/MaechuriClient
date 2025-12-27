import React, { useState } from 'react';
import { GameEngine } from 'react-game-engine';
import { mockScenarioData } from '../../data/mockData';
import type { Position, Direction } from './types';
import { TILE_SIZE } from './types';
import { usePlayerControls } from './hooks/usePlayerControls';
import { useGameEntities } from './hooks/useGameEntities';
import { useAssetLoader } from './hooks/useAssetLoader';
import { usePositionInterpolation } from './hooks/usePositionInterpolation';
import './GameScreen.css';

const GameScreen: React.FC = () => {
  const [playerPosition, setPlayerPosition] = useState<Position>({ x: 1, y: 1 });
  const [playerDirection, setPlayerDirection] = useState<Direction>('down');

  // Load assets
  const assetsState = useAssetLoader(
    mockScenarioData.map.objects,
    mockScenarioData.map.playerObjectUrl
  );

  // Use interpolation for smooth movement
  const interpolatedPosition = usePositionInterpolation(playerPosition);

  // Use custom hooks
  usePlayerControls(playerDirection, setPlayerPosition, setPlayerDirection);
  const entities = useGameEntities(playerPosition, interpolatedPosition, playerDirection, assetsState);

  const mapWidth = mockScenarioData.map.layers[0].tileMap[0].length * TILE_SIZE;
  const mapHeight = mockScenarioData.map.layers[0].tileMap.length * TILE_SIZE;

  // Don't use key at all - let GameEngine update naturally
  // This allows the interpolated position updates to flow through

  // Show loading state
  if (assetsState.isLoading) {
    return (
      <div className="game-screen">
        <div className="game-info">
          <h2>Loading assets...</h2>
        </div>
      </div>
    );
  }

  // Show error state
  if (assetsState.error) {
    return (
      <div className="game-screen">
        <div className="game-info">
          <h2>Error loading assets</h2>
          <p>{assetsState.error}</p>
        </div>
      </div>
    );
  }

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
