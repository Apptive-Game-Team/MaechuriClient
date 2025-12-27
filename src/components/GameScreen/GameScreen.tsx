import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameEngine } from 'react-game-engine';
import { mockScenarioData } from '../../data/mockData';
import type { Position, Direction } from './types';
import { TILE_SIZE, MOVEMENT_DURATION } from './types';
import { usePlayerControls } from './hooks/usePlayerControls';
import { useGameEntities } from './hooks/useGameEntities';
import { useAssetLoader } from './hooks/useAssetLoader';
import './GameScreen.css';

const GameScreen: React.FC = () => {
  const [playerPosition, setPlayerPosition] = useState<Position>({ x: 1, y: 1 });
  const [playerDirection, setPlayerDirection] = useState<Direction>('down');
  const [isAnimating, setIsAnimating] = useState(false);
  const animationTimerRef = useRef<number | null>(null);

  // Load assets
  const assetsState = useAssetLoader(
    mockScenarioData.map.objects,
    mockScenarioData.map.playerObjectUrl
  );

  // Wrap setPlayerPosition to trigger animation
  const setPlayerPositionWithAnimation = useCallback((
    positionOrUpdater: Position | ((prev: Position) => Position)
  ) => {
    setPlayerPosition((prev) => {
      const newPosition = typeof positionOrUpdater === 'function' 
        ? positionOrUpdater(prev) 
        : positionOrUpdater;
      
      // Only animate if position actually changed
      if (newPosition.x !== prev.x || newPosition.y !== prev.y) {
        // Clear any existing timer
        if (animationTimerRef.current) {
          clearTimeout(animationTimerRef.current);
        }
        
        // Start animation
        setIsAnimating(true);
        
        // End animation after duration
        animationTimerRef.current = setTimeout(() => {
          setIsAnimating(false);
        }, MOVEMENT_DURATION) as unknown as number;
      }
      
      return newPosition;
    });
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (animationTimerRef.current) {
        clearTimeout(animationTimerRef.current);
      }
    };
  }, []);

  // Use custom hooks
  usePlayerControls(playerDirection, setPlayerPositionWithAnimation, setPlayerDirection);
  const entities = useGameEntities(playerPosition, playerDirection, assetsState, isAnimating);

  const mapWidth = mockScenarioData.map.layers[0].tileMap[0].length * TILE_SIZE;
  const mapHeight = mockScenarioData.map.layers[0].tileMap.length * TILE_SIZE;

  // Create a unique key based on player position and direction to force re-render
  const gameKey = `game-${playerPosition.x}-${playerPosition.y}-${playerDirection}`;

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
