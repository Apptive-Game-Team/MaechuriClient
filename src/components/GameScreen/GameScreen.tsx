import React, { useRef } from 'react';
import { GameEngine } from 'react-game-engine';
import { mockScenarioData } from '../../data/mockData';
import { TILE_SIZE } from './types';
import { usePlayerControls } from './hooks/usePlayerControls';
import { useGameEntities } from './hooks/useGameEntities';
import { useAssetLoader } from './hooks/useAssetLoader';
import playerControlSystem from './systems/playerControlSystem';
import interactionSystem from './systems/interactionSystem';
import interpolationSystem from './systems/interpolationSystem';
import fogOfWarSystem from './systems/fogOfWarSystem';
import './GameScreen.css';

const GameScreen: React.FC = () => {
  const gameEngineRef = useRef<GameEngine>(null);

  // Load assets
  const assetsState = useAssetLoader(
    mockScenarioData.map.assets
  );

  // Initialize entities once - start player in center of top-left room
  const initialPlayerPosition = { x: 5, y: 5 };
  const initialPlayerDirection = 'down';
  const entities = useGameEntities(initialPlayerPosition, initialPlayerDirection, assetsState);

  // Use custom hooks
  usePlayerControls(gameEngineRef);

  const mapWidth = mockScenarioData.map.layers[0].tileMap[0].length * TILE_SIZE;
  const mapHeight = mockScenarioData.map.layers[0].tileMap.length * TILE_SIZE;


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
      </div>
      <div className="game-container" style={{ width: mapWidth, height: mapHeight }}>
        <GameEngine
          ref={gameEngineRef}
          style={{ width: mapWidth, height: mapHeight }}
          systems={[playerControlSystem, interactionSystem, interpolationSystem, fogOfWarSystem]}
          entities={entities}
        />
      </div>
    </div>
  );
};

export default GameScreen;
