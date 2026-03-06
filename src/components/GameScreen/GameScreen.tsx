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
import ErrorScreen from '../ErrorScreen/ErrorScreen';
import { HTTPError } from '../../utils/httpError';
import './GameScreen.css';

const VIEWPORT_WIDTH = 800;
const VIEWPORT_HEIGHT = 600;

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
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [solveModalOpen, setSolveModalOpen] = useState(false);
  const [recordsModalOpen, setRecordsModalOpen] = useState(false);
  const [currentObjectId, setCurrentObjectId] = useState<string | null>(null);
  const [currentObjectName, setCurrentObjectName] = useState<string>('');
  const [solveAttempts, setSolveAttempts] = useState<SolveAttempt[]>([]);
  const isInitialPlayerStateSet = useRef(false);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const { records, addRecords } = useRecords();
  const { data: originalScenarioData, isLoading: isLoadingMap, error: mapError } = useMapData({});
  const [scenarioData, setScenarioData] = useState<ScenarioData | null>(null);

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
      for (let y = 0; y < mapHeightInTiles; y++) {
        if (!borderLayer.tileMap[y]) {
          borderLayer.tileMap[y] = Array(mapWidthInTiles).fill(0);
        }
        for (let x = 0; x < mapWidthInTiles; x++) {
          if (x === 0 || x === mapWidthInTiles - 1 || y === 0 || y === mapHeightInTiles - 1) {
            borderLayer.tileMap[y][x] = 1;
          }
        }
      }
      setScenarioData(newScenarioData);
    }
  }, [originalScenarioData]);

  const { interactions, startInteraction, sendMessage, getInteractionState } = useInteraction();

  useEffect(() => {
    if (scenarioData) {
      setCurrentMapData(scenarioData.map);
    }
  }, [scenarioData]);

  useEffect(() => {
    const handleInteraction = async (event: Event) => {
      const customEvent = event as CustomEvent<{ objectId: string; objectName: string }>;
      const { objectId, objectName } = customEvent.detail;
      if (objectId === 'd:1') {
        setSolveModalOpen(true);
        return;
      }
      setCurrentObjectId(objectId);
      setCurrentObjectName(objectName);
      setChatModalOpen(true);
      if (scenarioData && !getInteractionState(objectId)) {
        await startInteraction(scenarioData.scenarioId, objectId, addRecords);
      }
    };
    window.addEventListener('gameInteraction', handleInteraction);
    return () => {
      window.removeEventListener('gameInteraction', handleInteraction);
    };
  }, [scenarioData, getInteractionState, startInteraction, addRecords]);

  const assetsToLoad = useMemo(() => scenarioData?.map.assets || [], [scenarioData]);
  const assetsState = useAssetLoader(assetsToLoad);

  const [playerPosition, setPlayerPosition] = useState<Position>({ x: 5, y: 5 });
  const [playerDirection, setPlayerDirection] = useState<Direction>('down');

  useEffect(() => {
    if (scenarioData && !isInitialPlayerStateSet.current) {
      const playerObject = scenarioData.map.objects.find((obj: MapObject) => obj.id === 'p:1');
      if (playerObject) {
        setPlayerPosition(playerObject.position);
        setPlayerDirection(playerObject.direction || 'down');
      } else {
        setPlayerPosition({ x: 5, y: 5 });
        setPlayerDirection('down');
      }
      isInitialPlayerStateSet.current = true;
    }
  }, [scenarioData]);

  const entities = useGameEntities(scenarioData || EMPTY_SCENARIO, playerPosition, playerDirection, assetsState);

  const handleGameEvent = (event: Record<string, unknown>) => {
    if (event.type === 'player-moved-tile') {
      const position = event.position as Position | undefined;
      if (position && typeof position.x === 'number' && typeof position.y === 'number') {
        setPlayerPosition(position);
      }
    } else if (event.type === 'interpolated-position-changed') {
      const position = event.position as Position | undefined;
      if (position && typeof position.x === 'number' && typeof position.y === 'number' && gameContainerRef.current && scenarioData) {
        const offsetX = (VIEWPORT_WIDTH / 2) - (position.x * TILE_SIZE + TILE_SIZE / 2);
        const offsetY = (VIEWPORT_HEIGHT / 2) - (position.y * TILE_SIZE + TILE_SIZE / 2);
        
        const mapWidth = Math.max(0, ...scenarioData.map.layers.flatMap((layer: Layer) => layer.tileMap.map((row: number[]) => row.length))) * TILE_SIZE;
        const mapHeight = Math.max(0, ...scenarioData.map.layers.map((layer: Layer) => layer.tileMap.length)) * TILE_SIZE;

        let finalClampedX = offsetX;
        if (mapWidth < VIEWPORT_WIDTH) {
          finalClampedX = (VIEWPORT_WIDTH - mapWidth) / 2;
        } else {
          finalClampedX = Math.min(0, Math.max(VIEWPORT_WIDTH - mapWidth, offsetX));
        }

        let finalClampedY = offsetY;
        if (mapHeight < VIEWPORT_HEIGHT) {
          finalClampedY = (VIEWPORT_HEIGHT - mapHeight) / 2;
        } else {
          finalClampedY = Math.min(0, Math.max(VIEWPORT_HEIGHT - mapHeight, offsetY));
        }
        
        gameContainerRef.current.style.transform = `translate(${finalClampedX}px, ${finalClampedY}px)`;
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isTyping = event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || (event.target as HTMLElement).isContentEditable;
      if (!chatModalOpen && !solveModalOpen && !recordsModalOpen && !isTyping) {
        if (event.key === 'r') setRecordsModalOpen(true);
        else if (event.key === 'c') {
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

  usePlayerControls(gameEngineRef);

  const mapWidth = scenarioData ? Math.max(0, ...scenarioData.map.layers.flatMap((layer: Layer) => layer.tileMap.map((row: number[]) => row.length))) * TILE_SIZE : 0;
  const mapHeight = scenarioData ? Math.max(0, ...scenarioData.map.layers.map((layer: Layer) => layer.tileMap.length)) * TILE_SIZE : 0;
  const interactionState = currentObjectId ? getInteractionState(currentObjectId) : undefined;

  const handleSendMessage = async (message: string) => {
    if (scenarioData && currentObjectId) {
      await sendMessage(scenarioData.scenarioId, currentObjectId, message, addRecords);
    }
  };

  const handleSwitchObject = async (objectId: string, objectName: string) => {
    setCurrentObjectId(objectId);
    setCurrentObjectName(objectName);
    if (scenarioData && !getInteractionState(objectId)) {
      await startInteraction(scenarioData.scenarioId, objectId, addRecords);
    }
  };

  const handleSolveSubmit = async (message: string, suspectIds: string[]) => {
    if (!scenarioData) return;
    try {
      const response = await submitSolve(scenarioData.scenarioId, { message, suspectIds });
      const attempt: SolveAttempt = { message, suspectIds, response, timestamp: Date.now() };
      setSolveAttempts(prev => [...prev, attempt]);
      if (response.success) {
        setSolveModalOpen(false);
        onShowResult(response);
      }
    } catch (error) {
      console.error('Failed to submit solve:', error);
    }
  };

  const suspects = scenarioData?.map.objects.filter((obj: MapObject) => obj.id.startsWith('s:')) || [];

  if (mapError && mapError instanceof HTTPError) return <ErrorScreen statusCode={mapError.status} message={mapError.message} />;
  if (isLoadingMap || !scenarioData || !playerDirection) return <div className="game-screen"><h2>Loading map data...</h2></div>;
  if (assetsState.isLoading) return <div className="game-screen"><h2>Loading assets...</h2></div>;
  if (assetsState.error) return <div className="game-screen"><h2>Error loading assets</h2><p>{assetsState.error}</p></div>;

  return (
    <div className="game-screen">
      <div className="game-info">
        <h2>{scenarioData.scenarioName}</h2>
        <p>Use Arrow Keys or WASD to move. Press E or Space to interact with objects. Press R to view records. Press C to open chat.</p>
      </div>
      <div className="game-viewport" style={{ width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT, position: 'relative', overflow: 'hidden' }}>
        <div 
          ref={gameContainerRef}
          className="game-container" 
          style={{ width: mapWidth, height: mapHeight }}
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
