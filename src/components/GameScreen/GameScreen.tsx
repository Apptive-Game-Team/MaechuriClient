import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { GameEngine } from 'react-game-engine';
import type { Position, Direction, ScenarioData, Layer, MapObject } from '../../types/map';
import type { SolveResponse, SolveAttempt } from '../../types/solve';
import { TILE_SIZE } from './types';
import { usePlayerControls } from './hooks/usePlayerControls';
import { useMouseControls } from './hooks/useMouseControls';
import { useGameEntities } from './hooks/useGameEntities';
import { useAssetLoader } from './hooks/useAssetLoader';
import { useMapData } from '../../hooks/useMapData';
import { useInteraction } from '../../hooks/useInteraction';
import { useRecords } from '../../contexts/RecordsContext';
import { setCurrentMapData } from './utils/gameUtils';
import { getAssetImage } from '../../utils/assetLoader';
import { submitSolve } from '../../services/api';
import playerControlSystem from './systems/playerControlSystem';
import interactionSystem from './systems/interactionSystem';
import ChatModal from '../ChatModal/ChatModal';
import SolveModal from '../SolveModal/SolveModal';
import RecordsModal from '../RecordsModal/RecordsModal';
import ErrorScreen from '../ErrorScreen/ErrorScreen';
import { HTTPError } from '../../utils/httpError';
import { playWalkSound, playModalSound, playMessageSentSound } from '../../utils/soundManager';
import './GameScreen.css';

const VIEWPORT_WIDTH = 800;
const VIEWPORT_HEIGHT = 600;
const WILL_CHANGE_RESET_DELAY = 150;

type EngineState = {
  state: {
    entities: {
      player?: {
        position?: Position;
      };
    };
  };
};

const EMPTY_SCENARIO = {
  createdDate: '',
  scenarioId: 0,
  scenarioName: '',
  map: { layers: [], objects: [], assets: [] }
};

interface GameScreenProps {
  scenarioId?: number;
  onShowResult: (result: SolveResponse) => void;
}

const GameScreen: React.FC<GameScreenProps> = ({ scenarioId, onShowResult }) => {
  const gameEngineRef = useRef<(GameEngine & EngineState) | null>(null);
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const willChangeResetRef = useRef<number | null>(null);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [solveModalOpen, setSolveModalOpen] = useState(false);
  const [recordsModalOpen, setRecordsModalOpen] = useState(false);
  const [highlightedRecordId, setHighlightedRecordId] = useState<string | null>(null);
  const [currentObjectId, setCurrentObjectId] = useState<string | null>(null);
  const [currentObjectName, setCurrentObjectName] = useState<string>('');
  const [solveAttempts, setSolveAttempts] = useState<SolveAttempt[]>([]);

  // Important: React state for player position is only for "static" UI like modals.
  // The actual movement rendering happens inside GameEngine via DOM and engine loop.
  const [reactPlayerPosition, setReactPlayerPosition] = useState<Position>({ x: 5, y: 5 });

  const { records, addRecords } = useRecords();
  const { data: originalScenarioData, isLoading: isLoadingMap, error: mapError } = useMapData({ scenarioId });
  const [scenarioData, setScenarioData] = useState<ScenarioData | null>(null);

  useEffect(() => {
    if (originalScenarioData) {
      const newScenarioData = JSON.parse(JSON.stringify(originalScenarioData));
      const mapWidthInTiles = Math.max(0, ...newScenarioData.map.layers.flatMap((l: Layer) => l.tileMap.map((row: number[]) => row.length)));
      const mapHeightInTiles = Math.max(0, ...newScenarioData.map.layers.map((l: Layer) => l.tileMap.length));
      
      // Auto-initialize player position in React state
      const playerObj = newScenarioData.map.objects.find((o: any) => o.id === 'p:1');
      if (playerObj) setReactPlayerPosition(playerObj.position);

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
        if (!borderLayer.tileMap[y]) borderLayer.tileMap[y] = Array(mapWidthInTiles).fill(0);
        for (let x = 0; x < mapWidthInTiles; x++) {
          if (x === 0 || x === mapWidthInTiles - 1 || y === 0 || y === mapHeightInTiles - 1) borderLayer.tileMap[y][x] = 1;
        }
      }
      setScenarioData(newScenarioData);
    }
  }, [originalScenarioData]);

  const { interactions, startInteraction, sendMessage, getInteractionState } = useInteraction();

  useEffect(() => {
    if (scenarioData) setCurrentMapData(scenarioData.map);
  }, [scenarioData]);

  useEffect(() => {
    const handleInteraction = async (event: Event) => {
      const customEvent = event as CustomEvent<{ objectId: string; objectName: string }>;
      const { objectId, objectName } = customEvent.detail;
      if (objectId === 'd:1') {
        playModalSound();
        setSolveModalOpen(true);
        return;
      }
      setCurrentObjectId(objectId);
      setCurrentObjectName(objectName);
      playModalSound();
      setChatModalOpen(true);
      if (scenarioData && !getInteractionState(objectId)) {
        await startInteraction(scenarioData.scenarioId, objectId);
      }
    };
    window.addEventListener('gameInteraction', handleInteraction);
    return () => window.removeEventListener('gameInteraction', handleInteraction);
  }, [scenarioData, getInteractionState, startInteraction, addRecords]);

  const assetsToLoad = useMemo(() => scenarioData?.map.assets || [], [scenarioData]);
  const assetsState = useAssetLoader(assetsToLoad);

  // Entities are now STABLE and do not depend on parent state changing
  const entities = useGameEntities(scenarioData || EMPTY_SCENARIO, assetsState);

  const mapDimensions = useMemo(() => {
    if (!scenarioData) return { width: 0, height: 0 };
    const width = Math.max(0, ...scenarioData.map.layers.flatMap((l: Layer) => l.tileMap.map((row: number[]) => row.length))) * TILE_SIZE;
    const height = Math.max(0, ...scenarioData.map.layers.map((l: Layer) => l.tileMap.length)) * TILE_SIZE;
    return { width, height };
  }, [scenarioData]);

  const mapDimensionsRef = useRef(mapDimensions);
  mapDimensionsRef.current = mapDimensions;

  const lastPlayerTileRef = useRef<Position | null>(null);
  const handlePlayWalkSound = useCallback(() => {
    playWalkSound();
  }, []);
  const clampViewportOffset = useCallback((offset: number, mapSize: number, viewportSize: number) => {
    return mapSize < viewportSize ? (viewportSize - mapSize) / 2 : Math.min(0, Math.max(viewportSize - mapSize, offset));
  }, []);

  useEffect(() => {
    let animationFrameId: number | null = null;
    let isActive = true;

    const updateMovementFrame = () => {
      const position = gameEngineRef.current?.state?.entities?.player?.position;
      const { width: mapWidth, height: mapHeight } = mapDimensionsRef.current;

      if (isActive && position && gameContainerRef.current) {
        const offsetX = (VIEWPORT_WIDTH / 2) - (position.x * TILE_SIZE + TILE_SIZE / 2);
        const offsetY = (VIEWPORT_HEIGHT / 2) - (position.y * TILE_SIZE + TILE_SIZE / 2);

        const finalClampedX = clampViewportOffset(offsetX, mapWidth, VIEWPORT_WIDTH);
        const finalClampedY = clampViewportOffset(offsetY, mapHeight, VIEWPORT_HEIGHT);

        gameContainerRef.current.style.transform = `translate3d(${finalClampedX}px, ${finalClampedY}px, 0)`;
        gameContainerRef.current.style.willChange = 'transform';

        if (willChangeResetRef.current) {
          window.clearTimeout(willChangeResetRef.current);
        }
        willChangeResetRef.current = window.setTimeout(() => {
          if (gameContainerRef.current) {
            gameContainerRef.current.style.willChange = 'auto';
          }
        }, WILL_CHANGE_RESET_DELAY);

        const tileX = Math.round(position.x);
        const tileY = Math.round(position.y);
        const lastTile = lastPlayerTileRef.current;
        const hasMovedTile = !lastTile || tileX !== lastTile.x || tileY !== lastTile.y;
        if (hasMovedTile) {
          lastPlayerTileRef.current = { x: tileX, y: tileY };
          if (lastTile) {
            handlePlayWalkSound();
          }
          setReactPlayerPosition({ x: tileX, y: tileY });
        }
      }

      if (isActive) {
        animationFrameId = requestAnimationFrame(updateMovementFrame);
      }
    };

    updateMovementFrame();

    return () => {
      isActive = false;
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [handlePlayWalkSound, clampViewportOffset]);

  useEffect(() => {
    return () => {
      if (willChangeResetRef.current) {
        window.clearTimeout(willChangeResetRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isTyping = event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || (event.target as HTMLElement).isContentEditable;
      if (!chatModalOpen && !solveModalOpen && !recordsModalOpen && !isTyping) {
        if (event.key === 'r') {
          setHighlightedRecordId(null);
          playModalSound();
          setRecordsModalOpen(true);
        } else if (event.key === 'c') {
          setCurrentObjectId(null);
          setCurrentObjectName('');
          playModalSound();
          setChatModalOpen(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [chatModalOpen, solveModalOpen, recordsModalOpen]);

  usePlayerControls(gameEngineRef);
  const { onClick, onMouseMove, onMouseLeave } = useMouseControls(gameEngineRef, gameContainerRef);

  const interactionState = currentObjectId ? getInteractionState(currentObjectId) : undefined;

  const handleSendMessage = async (message: string) => {
    if (scenarioData && currentObjectId) {
      playMessageSentSound();
      await sendMessage(scenarioData.scenarioId, currentObjectId, message);
    }
  };

  const handleSwitchObject = async (objectId: string, objectName: string) => {
    setCurrentObjectId(objectId);
    setCurrentObjectName(objectName);
    if (scenarioData && !getInteractionState(objectId)) {
      await startInteraction(scenarioData.scenarioId, objectId);
    }
  };

  if (mapError && mapError instanceof HTTPError) return <ErrorScreen statusCode={mapError.status} message={mapError.message} />;
  if (isLoadingMap || !scenarioData) return <div className="game-screen"><h2>Loading map data...</h2></div>;
  if (assetsState.isLoading) return <div className="game-screen"><h2>Loading assets...</h2></div>;

  return (
    <div className="game-screen">
      <div className="game-info">
        <h2>{scenarioData.scenarioName}</h2>
        <p>방향키 또는 WASD로 이동 · E 또는 Space로 상호작용 · 클릭 이동</p>
      </div>
      <div
        className="game-viewport"
        style={{ width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT, position: 'relative', overflow: 'hidden' }}
        onClick={onClick}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
      >
        <div 
          ref={gameContainerRef}
          className="game-container" 
          style={{ width: mapDimensions.width, height: mapDimensions.height, transform: 'translate3d(0px, 0px, 0)' }}
        >
          <GameEngine
            ref={gameEngineRef}
            style={{ width: mapDimensions.width, height: mapDimensions.height }}
            systems={[playerControlSystem, interactionSystem]}
            entities={entities}
          />
        </div>
      </div>
      <ChatModal
        isOpen={chatModalOpen}
        objectName={currentObjectName}
        messages={interactionState?.messages || []}
        interactionType={interactionState?.type}
        records={records}
        onClose={() => { playModalSound(); setChatModalOpen(false); }}
        onSendMessage={handleSendMessage}
        onRecordClick={(id) => { playModalSound(); setHighlightedRecordId(id); setRecordsModalOpen(true); }}
        playerPosition={reactPlayerPosition}
        mapObjects={scenarioData.map.objects}
        interactions={interactions}
        currentObjectId={currentObjectId}
        onSwitchObject={handleSwitchObject}
        currentObjectImageUrl={currentObjectId ? getAssetImage(assetsState.assets.get(currentObjectId)!) : undefined}
      />
      <SolveModal
        isOpen={solveModalOpen}
        suspects={scenarioData.map.objects.filter((obj: MapObject) => obj.id.startsWith('s:'))}
        attempts={solveAttempts}
        onClose={() => { playModalSound(); setSolveModalOpen(false); }}
        onSubmit={async (m, s) => {
          const res = await submitSolve(scenarioData.scenarioId, { message: m, suspectIds: s });
          setSolveAttempts(prev => [...prev, { message: m, suspectIds: s, response: res, timestamp: Date.now() }]);
          if (res.success) { playModalSound(); setSolveModalOpen(false); onShowResult(res); }
        }}
      />
      <RecordsModal
        isOpen={recordsModalOpen}
        onClose={() => { playModalSound(); setRecordsModalOpen(false); setHighlightedRecordId(null); }}
        scenarioData={scenarioData}
        highlightedRecordId={highlightedRecordId}
      />
    </div>
  );
};

export default GameScreen;
