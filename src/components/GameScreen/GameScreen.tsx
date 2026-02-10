import React, { useRef, useState, useEffect } from 'react';
import { GameEngine } from 'react-game-engine';
import type { Position, Direction } from '../../types/map';
import type { SolveResponse, SolveAttempt } from '../../types/solve';
import { TILE_SIZE } from './types';
import { usePlayerControls } from './hooks/usePlayerControls';
import { useGameEntities } from './hooks/useGameEntities';
import { useAssetLoader } from './hooks/useAssetLoader';
import { useMapData } from '../../hooks/useMapData';
import { useInteraction } from '../../hooks/useInteraction';
import { useRecords } from '../../contexts/RecordsContext';
import { setCurrentMapData } from './utils/gameUtils';
import { submitSolve } from '../../services/api';
import playerControlSystem from './systems/playerControlSystem';
import interactionSystem from './systems/interactionSystem';
import interpolationSystem from './systems/interpolationSystem';
import fogOfWarSystem from './systems/fogOfWarSystem';
import ChatModal from '../ChatModal/ChatModal';
import SolveModal from '../SolveModal/SolveModal';
import ErrorScreen from '../ErrorScreen/ErrorScreen'; // Import ErrorScreen
import { HTTPError } from '../../utils/httpError'; // Import HTTPError
import './GameScreen.css';

// Viewport dimensions for the game camera
const VIEWPORT_WIDTH = 800;
const VIEWPORT_HEIGHT = 600;

// Empty scenario data used as fallback during loading
const EMPTY_SCENARIO = {
  createdDate: '',
  scenarioId: 0,
  scenarioName: '',
  map: { layers: [], objects: [], assets: [] }
};

interface GameScreenProps {
  onShowResult: (result: SolveResponse) => void;
}

const GameScreen: React.FC<GameScreenProps> = ({ onShowResult }) => {
  const gameEngineRef = useRef<GameEngine>(null);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [solveModalOpen, setSolveModalOpen] = useState(false);
  const [currentObjectId, setCurrentObjectId] = useState<string | null>(null);
  const [currentObjectName, setCurrentObjectName] = useState<string>('');
  const [cameraOffset, setCameraOffset] = useState({ x: 0, y: 0 });
  const [solveAttempts, setSolveAttempts] = useState<SolveAttempt[]>([]);

  // Disable page scrolling when GameScreen is mounted
  useEffect(() => {
    // Save original overflow style
    const originalOverflow = document.body.style.overflow;
    
    // Disable scrolling
    document.body.style.overflow = 'hidden';
    
    // Restore original overflow when component unmounts
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);
  // Get records context
  const { records, addRecords } = useRecords();

  // Fetch map data from API
  const { data: scenarioData, isLoading: isLoadingMap, error: mapError } = useMapData({});

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
      const customEvent = event as CustomEvent<{ objectId: string; objectName: string }>;
      const { objectId, objectName } = customEvent.detail;

      // Check if this is the solve object (d:1)
      if (objectId === 'd:1') {
        setSolveModalOpen(true);
        return;
      }

      setCurrentObjectId(objectId);
      setCurrentObjectName(objectName);
      setChatModalOpen(true);

      // Start interaction if not already started
      if (scenarioData && !getInteractionState(objectId)) {
        await startInteraction(scenarioData.scenarioId, objectId, addRecords);
      }
    };

    window.addEventListener('gameInteraction', handleInteraction);
    return () => {
      window.removeEventListener('gameInteraction', handleInteraction);
    };
  }, [scenarioData, getInteractionState, startInteraction, addRecords]);

  // Load assets
  const assetsState = useAssetLoader(
    scenarioData?.map.assets || []
  );

  // Initialize entities once - start player in center of top-left room
  const [playerPosition, setPlayerPosition] = useState<Position>({ x: 5, y: 5 });
  const [playerDirection, setPlayerDirection] = useState<Direction>('down'); // New state for playerDirection
  
  // Determine initial player position and direction from map data
  useEffect(() => {
    if (scenarioData) {
      const playerObject = scenarioData.map.objects.find(obj => obj.id === 'p:1');
      if (playerObject) {
        setPlayerPosition(playerObject.position);
        setPlayerDirection(playerObject.direction || 'down'); // Default to 'down' if not specified
      } else {
        // Fallback to default position if 'p:1' is not found
        setPlayerPosition({ x: 5, y: 5 });
        setPlayerDirection('down');
      }
    }
  }, [scenarioData]);
  
  const entities = useGameEntities(
    scenarioData || EMPTY_SCENARIO, // Always call useGameEntities
    playerPosition,
    playerDirection,
    assetsState
  );

  // Update camera to follow player
  useEffect(() => {
    if (!playerPosition) {
      return;
    }

    const playerPos = playerPosition;

    // Calculate camera offset to center player on screen
    const offsetX = (VIEWPORT_WIDTH / 2) - (playerPos.x * TILE_SIZE + TILE_SIZE / 2);
    const offsetY = (VIEWPORT_HEIGHT / 2) - (playerPos.y * TILE_SIZE + TILE_SIZE / 2);

    // Clamp camera to map boundaries when valid layer data is available
    const layers = scenarioData?.map.layers;
    if (
      layers &&
      layers.length > 0 &&
      layers[0].tileMap.length > 0 &&
      layers[0].tileMap[0].length > 0
    ) {
      const mapWidth = layers[0].tileMap[0].length * TILE_SIZE;
      const mapHeight = layers[0].tileMap.length * TILE_SIZE;

      const clampedX = Math.min(0, Math.max(VIEWPORT_WIDTH - mapWidth, offsetX));
      const clampedY = Math.min(0, Math.max(VIEWPORT_HEIGHT - mapHeight, offsetY));

      setCameraOffset({ x: clampedX, y: clampedY });
    } else {
      // Fallback: no valid map data yet; still center camera on the player
      setCameraOffset({ x: offsetX, y: offsetY });
    }
  }, [playerPosition, scenarioData]);

  // Use custom hooks
  usePlayerControls(gameEngineRef);

  const mapWidth = scenarioData ? scenarioData.map.layers[0].tileMap[0].length * TILE_SIZE : 0;
  const mapHeight = scenarioData ? scenarioData.map.layers[0].tileMap.length * TILE_SIZE : 0;

  // Get current interaction state
  const interactionState = currentObjectId ? getInteractionState(currentObjectId) : undefined;

  const handleGameEvent = (event: Record<string, unknown>) => {
    if (event.type === 'player-moved') {
      const position = event.position as Position | undefined;
      if (
        position &&
        typeof position.x === 'number' &&
        typeof position.y === 'number'
      ) {
        setPlayerPosition(position);
      }
    }
  };

  // Handle sending messages
  const handleSendMessage = async (message: string) => {
    if (scenarioData && currentObjectId) {
      await sendMessage(scenarioData.scenarioId, currentObjectId, message, addRecords);
    }
  };

  // Handle solve submission
  const handleSolveSubmit = async (message: string, suspectIds: string[]) => {
    if (!scenarioData) return;

    try {
      const response = await submitSolve(scenarioData.scenarioId, {
        message,
        suspectIds,
      });

      const attempt: SolveAttempt = {
        message,
        suspectIds,
        response,
        timestamp: Date.now(),
      };

      setSolveAttempts(prev => [...prev, attempt]);

      // If successful, navigate to result screen
      if (response.success) {
        setSolveModalOpen(false);
        onShowResult(response);
      }
    } catch (error) {
      console.error('Failed to submit solve:', error);
      // Could add error handling UI here
    }
  };

  // Get suspects from map objects (objects with id starting with "s:")
  const suspects = scenarioData?.map.objects.filter(obj => obj.id.startsWith('s:')) || [];

  // Show error state for map loading
  if (mapError && mapError instanceof HTTPError) {
    return <ErrorScreen statusCode={mapError.status} message={mapError.message} />;
  }

  // Show loading state for map data
  if (isLoadingMap || !scenarioData || !playerDirection) {
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

  // Show error state for assets
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
      </div>
      <div className="game-viewport" style={{ width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT, position: 'relative', overflow: 'hidden' }}>
        <div 
          className="game-container" 
          style={{ 
            width: mapWidth, 
            height: mapHeight,
            transform: `translate(${cameraOffset.x}px, ${cameraOffset.y}px)`
          }}
        >
          <GameEngine
            ref={gameEngineRef}
            style={{ width: mapWidth, height: mapHeight }}
            systems={[playerControlSystem, interactionSystem, interpolationSystem, fogOfWarSystem]}
            entities={entities}
            onEvent={handleGameEvent}
          />
        </div>
      </div>
      
      <ChatModal
        isOpen={chatModalOpen}
        objectName={currentObjectName}
        messages={interactionState?.messages || []}
        interactionType={interactionState?.type}
        records={records}
        onClose={() => setChatModalOpen(false)}
        onSendMessage={handleSendMessage}
      />

      <SolveModal
        isOpen={solveModalOpen}
        suspects={suspects}
        attempts={solveAttempts}
        onClose={() => setSolveModalOpen(false)}
        onSubmit={handleSolveSubmit}
      />
    </div>
  );
};

export default GameScreen;
