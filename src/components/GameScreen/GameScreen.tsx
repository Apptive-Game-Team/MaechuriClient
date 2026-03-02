import React, { useRef, useState, useEffect, useMemo } from 'react';
import { GameEngine } from 'react-game-engine';
import type { Position, Direction, ScenarioData, Layer, MapObject } from '../../types/map';
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
import RecordsModal from '../RecordsModal/RecordsModal';
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
  const [recordsModalOpen, setRecordsModalOpen] = useState(false);
  const [currentObjectId, setCurrentObjectId] = useState<string | null>(null);
  const [currentObjectName, setCurrentObjectName] = useState<string>('');
  const [cameraOffset, setCameraOffset] = useState({ x: 0, y: 0 });
  const [solveAttempts, setSolveAttempts] = useState<SolveAttempt[]>([]);
  const isInitialPlayerStateSet = useRef(false); // New ref for player position/direction initialization

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
  const { data: originalScenarioData, isLoading: isLoadingMap, error: mapError } = useMapData({});
  const [scenarioData, setScenarioData] = useState<ScenarioData | null>(null);

  // Add a border to the map once data is loaded
  useEffect(() => {
    if (originalScenarioData) {
      const newScenarioData = JSON.parse(JSON.stringify(originalScenarioData));

      const mapWidthInTiles = Math.max(0, ...newScenarioData.map.layers.flatMap((l: Layer) => l.tileMap.map((row: number[]) => row.length)));
      const mapHeightInTiles = Math.max(0, ...newScenarioData.map.layers.map((l: Layer) => l.tileMap.length));

      let borderLayer = newScenarioData.map.layers.find((l: Layer) => l.name === "Borders");

      if (!borderLayer) {
        borderLayer = {
          name: "Borders",
          type: ["Non-Passable"],
          orderInLayer: 99,
          tileMap: Array(mapHeightInTiles).fill(0).map(() => Array(mapWidthInTiles).fill(0)),
        };
        newScenarioData.map.layers.push(borderLayer);
      }

      // Ensure the border layer is the correct size and has a border
      for (let y = 0; y < mapHeightInTiles; y++) {
        if (!borderLayer.tileMap[y]) {
          borderLayer.tileMap[y] = Array(mapWidthInTiles).fill(0);
        }
        for (let x = 0; x < mapWidthInTiles; x++) {
          if (x === 0 || x === mapWidthInTiles - 1 || y === 0 || y === mapHeightInTiles - 1) {
            borderLayer.tileMap[y][x] = 1; // Set border tile
          }
        }
      }
      
      // eslint-disable-next-line react-hooks/rules-of-hooks, react-hooks/exhaustive-deps
      setScenarioData(newScenarioData);
    }
  }, [originalScenarioData]);

  // Manage interactions
  const {
    interactions,
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

  // Memoize assets to prevent re-renders caused by new array reference on each render
  const assetsToLoad = useMemo(() => scenarioData?.map.assets || [], [scenarioData]);

  // Load assets
  const assetsState = useAssetLoader(
    assetsToLoad
  );

  // Initialize entities once - start player in center of top-left room
  const [playerPosition, setPlayerPosition] = useState<Position>({ x: 5, y: 5 });
  const [playerDirection, setPlayerDirection] = useState<Direction>('down'); // New state for playerDirection
  
  useEffect(() => {
    if (scenarioData && !isInitialPlayerStateSet.current) {
      const playerObject = scenarioData.map.objects.find((obj: MapObject) => obj.id === 'p:1');
      if (playerObject) {
        // eslint-disable-next-line react-hooks/rules-of-hooks, react-hooks/exhaustive-deps
        setPlayerPosition(playerObject.position);
        // eslint-disable-next-line react-hooks/rules-of-hooks, react-hooks/exhaustive-deps
        setPlayerDirection(playerObject.direction || 'down'); // Default to 'down' if not specified
      } else {
        // eslint-disable-next-line react-hooks/rules-of-hooks, react-hooks/exhaustive-deps
        setPlayerPosition({ x: 5, y: 5 });
        // eslint-disable-next-line react-hooks/rules-of-hooks, react-hooks/exhaustive-deps
        setPlayerDirection('down');
      }
      isInitialPlayerStateSet.current = true; // Mark as initialized
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

    let newCameraOffset = { x: offsetX, y: offsetY };

    // Clamp camera to map boundaries when valid layer data is available
    const layers = scenarioData?.map.layers;
    if (
      layers &&
      layers.length > 0
    ) {
      // Robustly calculate map dimensions by checking all layers and rows
      const mapWidth = Math.max(0, ...layers.flatMap((layer: Layer) => layer.tileMap.map((row: number[]) => row.length))) * TILE_SIZE;
      const mapHeight = Math.max(0, ...layers.map((layer: Layer) => layer.tileMap.length)) * TILE_SIZE;

      let finalClampedX = offsetX;
      let finalClampedY = offsetY;

      // X-axis clamping
      if (mapWidth < VIEWPORT_WIDTH) {
        // Center map if smaller than viewport
        finalClampedX = (VIEWPORT_WIDTH - mapWidth) / 2;
      } else {
        // Clamp camera to map edges if larger than viewport
        finalClampedX = Math.min(0, Math.max(VIEWPORT_WIDTH - mapWidth, offsetX));
      }

      // Y-axis clamping
      if (mapHeight < VIEWPORT_HEIGHT) {
        // Center map if smaller than viewport
        finalClampedY = (VIEWPORT_HEIGHT - mapHeight) / 2;
      } else {
        // Clamp camera to map edges if larger than viewport
        finalClampedY = Math.min(0, Math.max(VIEWPORT_HEIGHT - mapHeight, offsetY));
      }
      
      newCameraOffset = { x: finalClampedX, y: finalClampedY };
    }

    // eslint-disable-next-line react-hooks/rules-of-hooks, react-hooks/exhaustive-deps
    setCameraOffset(prevOffset => {
      if (prevOffset.x !== newCameraOffset.x || prevOffset.y !== newCameraOffset.y) {
        return newCameraOffset;
      }
      return prevOffset;
    });
  }, [playerPosition, scenarioData]);

  // Keyboard handler for 'r' key to open records modal and 'c' key to open chat
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle if no other modals are open and not in an input field
      const isTyping =
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        (event.target as HTMLElement).isContentEditable;

      if (!chatModalOpen && !solveModalOpen && !recordsModalOpen && !isTyping) {
        if (event.key === 'r') {
          setRecordsModalOpen(true);
        } else if (event.key === 'c') {
          setCurrentObjectId(null);
          setCurrentObjectName('');
          setChatModalOpen(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [chatModalOpen, solveModalOpen, recordsModalOpen]);

  // Use custom hooks
  usePlayerControls(gameEngineRef);

  const mapWidth = scenarioData ? Math.max(0, ...scenarioData.map.layers.flatMap((layer: Layer) => layer.tileMap.map((row: number[]) => row.length))) * TILE_SIZE : 0;
  const mapHeight = scenarioData ? Math.max(0, ...scenarioData.map.layers.map((layer: Layer) => layer.tileMap.length)) * TILE_SIZE : 0;

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

  // Handle switching to a different interactable object from the chat sidebar
  const handleSwitchObject = async (objectId: string, objectName: string) => {
    setCurrentObjectId(objectId);
    setCurrentObjectName(objectName);
    if (scenarioData && !getInteractionState(objectId)) {
      await startInteraction(scenarioData.scenarioId, objectId, addRecords);
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
  const suspects = scenarioData?.map.objects.filter((obj: MapObject) => obj.id.startsWith('s:')) || [];

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
        <p>Use Arrow Keys or WASD to move. Press E or Space to interact with objects. Press R to view records. Press C to open chat.</p>
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
        playerPosition={playerPosition}
        mapObjects={scenarioData.map.objects}
        interactions={interactions}
        currentObjectId={currentObjectId}
        onSwitchObject={handleSwitchObject}
      />

      <SolveModal
        isOpen={solveModalOpen}
        suspects={suspects}
        attempts={solveAttempts}
        onClose={() => setSolveModalOpen(false)}
        onSubmit={handleSolveSubmit}
      />

      <RecordsModal
        isOpen={recordsModalOpen}
        onClose={() => setRecordsModalOpen(false)}
        scenarioData={scenarioData}
      />
    </div>
  );
};

export default GameScreen;
