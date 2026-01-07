import React, { useRef, useState, useEffect } from 'react';
import { GameEngine } from 'react-game-engine';
import type { ScenarioData } from '../../types/map';
import { TILE_SIZE } from './types';
import { usePlayerControls } from './hooks/usePlayerControls';
import { useGameEntities } from './hooks/useGameEntities';
import { useAssetLoader } from './hooks/useAssetLoader';
import { useMapData } from '../../hooks/useMapData';
import { useInteraction } from '../../hooks/useInteraction';
import { setCurrentMapData } from './utils/gameUtils';
import playerControlSystem from './systems/playerControlSystem';
import interactionSystem from './systems/interactionSystem';
import interpolationSystem from './systems/interpolationSystem';
import fogOfWarSystem from './systems/fogOfWarSystem';
import ChatModal from '../ChatModal/ChatModal';
import './GameScreen.css';

// Empty scenario data used as fallback during loading
const EMPTY_SCENARIO: ScenarioData = {
  createdDate: '',
  scenarioId: 0,
  scenarioName: '',
  map: { layers: [], objects: [], assets: [] }
};

const GameScreen: React.FC = () => {
  const gameEngineRef = useRef<GameEngine>(null);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [currentObjectId, setCurrentObjectId] = useState<number | null>(null);
  const [currentObjectName, setCurrentObjectName] = useState<string>('');

  // Fetch map data from API (with fallback to mock data)
  const { data: scenarioData, isLoading: isLoadingMap, error: mapError } = useMapData({
    useMockData: true, // Set to false to use API
  });

  // Manage interactions
  const {
    startInteraction,
    sendMessage,
    getInteractionState,
  } = useInteraction();

  // Set current map data for game utils
  useEffect(() => {
    if (scenarioData) {
      setCurrentMapData(scenarioData.map);
    }
  }, [scenarioData]);

  // Listen for interaction events from the game
  useEffect(() => {
    const handleInteraction = async (event: Event) => {
      const customEvent = event as CustomEvent<{ objectId: number; objectName: string }>;
      const { objectId, objectName } = customEvent.detail;

      setCurrentObjectId(objectId);
      setCurrentObjectName(objectName);
      setChatModalOpen(true);

      // Start interaction if not already started
      if (scenarioData && !getInteractionState(objectId)) {
        await startInteraction(scenarioData.scenarioId, objectId);
      }
    };

    window.addEventListener('gameInteraction', handleInteraction);
    return () => {
      window.removeEventListener('gameInteraction', handleInteraction);
    };
  }, [scenarioData, getInteractionState, startInteraction]);

  // Load assets
  const assetsState = useAssetLoader(
    scenarioData?.map.assets || []
  );

  // Initialize entities once - start player in center of top-left room
  const initialPlayerPosition = { x: 5, y: 5 };
  const initialPlayerDirection = 'down';
  
  // Always call the hook, but pass fallback data if scenarioData is null
  const entities = useGameEntities(
    scenarioData || EMPTY_SCENARIO,
    initialPlayerPosition,
    initialPlayerDirection,
    assetsState
  );

  // Use custom hooks
  usePlayerControls(gameEngineRef);

  const mapWidth = scenarioData ? scenarioData.map.layers[0].tileMap[0].length * TILE_SIZE : 0;
  const mapHeight = scenarioData ? scenarioData.map.layers[0].tileMap.length * TILE_SIZE : 0;

  // Get current interaction state
  const interactionState = currentObjectId ? getInteractionState(currentObjectId) : undefined;

  // Handle sending messages
  const handleSendMessage = async (message: string) => {
    if (scenarioData && currentObjectId) {
      await sendMessage(scenarioData.scenarioId, currentObjectId, message);
    }
  };

  // Show loading state
  if (isLoadingMap || !scenarioData) {
    return (
      <div className="game-screen">
        <div className="game-info">
          <h2>Loading map data...</h2>
        </div>
      </div>
    );
  }

  // Show loading state for assets
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
        <h2>{scenarioData.scenarioName}</h2>
        <p>Use Arrow Keys or WASD to move. Press E or Space to interact with objects.</p>
        {mapError && <p style={{ color: '#ff6b6b' }}>Note: Using fallback data</p>}
      </div>
      <div className="game-container" style={{ width: mapWidth, height: mapHeight }}>
        <GameEngine
          ref={gameEngineRef}
          style={{ width: mapWidth, height: mapHeight }}
          systems={[playerControlSystem, interactionSystem, interpolationSystem, fogOfWarSystem]}
          entities={entities}
        />
      </div>
      
      <ChatModal
        isOpen={chatModalOpen}
        objectName={currentObjectName}
        messages={interactionState?.messages || []}
        interactionType={interactionState?.type}
        onClose={() => setChatModalOpen(false)}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
};

export default GameScreen;
