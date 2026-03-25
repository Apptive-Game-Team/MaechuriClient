import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import type { Record } from '../../types/record';
import { mapApiRecordToRecord } from '../../types/record'; // Changed from type import
import type { ScenarioData } from '../../types/map';
import { Modal } from '../common/Modal/Modal';
import { RecordCard } from './components/RecordCard';
import { useRecords } from '../../contexts/RecordsContext';
import { fetchObjectAsset, getAssetImage } from '../../utils/assetLoader';
import { getRecords } from '../../services/api';
import './RecordsModal.css';

interface RecordsModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenarioData: ScenarioData | null;
  highlightedRecordId?: string | null;
}

interface RecordPosition {
  id: string;
  x: number;
  y: number;
}

const STORAGE_KEY = 'maechuri-record-positions';
const RECORD_CARD_SIZE = 150;
const CANVAS_WIDTH = 2000;
const CANVAS_HEIGHT = 1500;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2.0;
const ZOOM_STEP = 0.1;

const clampZoom = (value: number) =>
  Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, parseFloat(value.toFixed(1))));

// Load positions from localStorage
const loadPositions = (): Map<string, { x: number; y: number }> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const positions: RecordPosition[] = JSON.parse(stored);
      const map = new Map<string, { x: number; y: number }>();
      positions.forEach(pos => {
        map.set(pos.id, { x: pos.x, y: pos.y });
      });
      return map;
    }
  } catch (error) {
    console.error('Failed to load record positions:', error);
  }
  return new Map();
};

// Save positions to localStorage
const savePositions = (positions: Map<string, { x: number; y: number }>) => {
  try {
    const posArray: RecordPosition[] = Array.from(positions.entries()).map(([id, pos]) => ({
      id,
      x: pos.x,
      y: pos.y,
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posArray));
  } catch (error) {
    console.error('Failed to save record positions:', error);
  }
};

const RecordsModal: React.FC<RecordsModalProps> = ({ isOpen, onClose, scenarioData, highlightedRecordId }) => {
  const { records, updateRecordPosition, setRecords } = useRecords();
  const [positions, setPositions] = useState<Map<string, { x: number; y: number }>>(new Map());
  const [activeRecord, setActiveRecord] = useState<Record | null>(null);
  const [enrichedRecords, setEnrichedRecords] = useState<Record[]>([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const contentRef = useRef<HTMLDivElement>(null);

  // Load positions on mount
  useEffect(() => {
    const loadedPositions = loadPositions();
    setPositions(loadedPositions);
  }, []);

  // Fetch records from API when modal opens
  useEffect(() => {
    if (!isOpen || !scenarioData) return;

    const fetchRecords = async () => {
      setIsLoadingRecords(true);
      try {
        const recordsData = await getRecords(scenarioData.scenarioId);
        // Set records from API - they should have id, type, name, content
        if (recordsData.records && recordsData.records.length > 0) {
          const mappedRecords = recordsData.records
            .map(mapApiRecordToRecord)
            .filter((record): record is Record => record !== null); // Filter out invalid records
          setRecords(mappedRecords);
        }
      } catch (error) {
        console.error('Failed to fetch records:', error);
      } finally {
        setIsLoadingRecords(false);
      }
    };

    fetchRecords();
  }, [isOpen, scenarioData, setRecords]);

  // Enrich records with images from map objects
  useEffect(() => {
    if (!scenarioData || !isOpen) {
      setEnrichedRecords(records);
      return;
    }

    const enrichRecords = async () => {
      const enriched = await Promise.all(
        records.map(async (record) => {
          // Skip if already has imageUrl
          if (record.imageUrl) {
            return record;
          }

          // Find the corresponding object in map data
          const mapObject = scenarioData.map.objects.find(obj => obj.id === record.id);
          if (!mapObject) {
            return record;
          }

          // Find the asset for this object
          const asset = scenarioData.map.assets.find(a => a.id === mapObject.id);
          if (!asset || !asset.imageUrl) {
            return record;
          }

          try {
            // Fetch the directional asset JSON
            const directionalAsset = await fetchObjectAsset(asset.imageUrl);
            // Get the appropriate image URL
            const imageUrl = getAssetImage(directionalAsset, mapObject.direction as 'left' | 'right' | 'front' | 'back');
            
            return {
              ...record,
              imageUrl: imageUrl || undefined,
            };
          } catch (error) {
            console.error(`Failed to load image for record ${record.id}:`, error);
            return record;
          }
        })
      );

      setEnrichedRecords(enriched);
    };

    enrichRecords();
  }, [records, scenarioData, isOpen]);

  // Initialize positions for new records in a grid layout
  useEffect(() => {
    if (!isOpen) return;

    setPositions(prevPositions => {
      const newPositions = new Map(prevPositions);
      let row = 0;
      let col = 0;
      const itemsPerRow = 4;
      const cardWidth = 170; // 150px + 20px margin
      const cardHeight = 170; // 150px + 20px margin

      enrichedRecords.forEach(record => {
        const recordId = record.id;
        if (!newPositions.has(recordId)) {
          newPositions.set(recordId, {
            x: 20 + col * cardWidth,
            y: 20 + row * cardHeight,
          });
          col++;
          if (col >= itemsPerRow) {
            col = 0;
            row++;
          }
        }
      });

      return newPositions;
    });
  }, [enrichedRecords, isOpen]);

  // Scroll to highlighted record when modal opens with a highlighted record
  useEffect(() => {
    if (!isOpen || !highlightedRecordId) return;

    const timer = setTimeout(() => {
      const pos = positions.get(highlightedRecordId);
      if (pos && contentRef.current) {
        const visibleWidth = contentRef.current.clientWidth;
        const visibleHeight = contentRef.current.clientHeight;
        contentRef.current.scrollTo({
          left: Math.max(0, pos.x * zoomLevel - visibleWidth / 2 + (RECORD_CARD_SIZE * zoomLevel) / 2),
          top: Math.max(0, pos.y * zoomLevel - visibleHeight / 2 + (RECORD_CARD_SIZE * zoomLevel) / 2),
          behavior: 'smooth',
        });
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [isOpen, highlightedRecordId, positions, zoomLevel]);

  // Ctrl+Wheel zoom (non-passive listener to allow preventDefault)
  useEffect(() => {
    if (!isOpen) return;
    const el = contentRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        setZoomLevel(prev => clampZoom(prev + (e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP)));
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [isOpen]);

  const handleZoomIn = useCallback(() => {
    setZoomLevel(prev => clampZoom(prev + ZOOM_STEP));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel(prev => clampZoom(prev - ZOOM_STEP));
  }, []);

  const handleZoomReset = useCallback(() => {
    setZoomLevel(1.0);
  }, []);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const record = enrichedRecords.find(r => r.id === event.active.id);
    setActiveRecord(record || null);
  }, [enrichedRecords]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveRecord(null);

    const { active, delta } = event;
    const recordId = active.id as string;

    setPositions(prevPositions => {
      const newPositions = new Map(prevPositions);
      const currentPos = newPositions.get(recordId) || { x: 0, y: 0 };
      
      const newPos = {
        x: currentPos.x + delta.x / zoomLevel,
        y: currentPos.y + delta.y / zoomLevel,
      };

      newPositions.set(recordId, newPos);
      
      // Save to localStorage
      savePositions(newPositions);
      
      // Update context
      updateRecordPosition(recordId, newPos);

      return newPositions;
    });
  }, [updateRecordPosition, zoomLevel]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Records"
      maxWidth="1000px"
    >
      <div className="records-toolbar">
        <button className="records-zoom-btn" onClick={handleZoomOut} disabled={zoomLevel <= MIN_ZOOM} title="축소 (Ctrl+Scroll)">－</button>
        <button className="records-zoom-level" onClick={handleZoomReset} title="배율 초기화">{Math.round(zoomLevel * 100)}%</button>
        <button className="records-zoom-btn" onClick={handleZoomIn} disabled={zoomLevel >= MAX_ZOOM} title="확대 (Ctrl+Scroll)">＋</button>
      </div>
      <div className="records-modal-content" ref={contentRef}>
        {isLoadingRecords ? (
          <div className="records-loading">
            <p>Loading records...</p>
          </div>
        ) : enrichedRecords.length === 0 ? (
          <div className="records-empty">
            <p>No records found. Interact with objects to collect records.</p>
          </div>
        ) : (
          <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div
              className="records-canvas-footprint"
              style={{ width: CANVAS_WIDTH * zoomLevel, height: CANVAS_HEIGHT * zoomLevel }}
            >
              <div
                className="records-canvas"
                style={{ transform: `scale(${zoomLevel})`, transformOrigin: '0 0' }}
              >
                {enrichedRecords.map(record => {
                  const recordId = record.id;
                  const position = positions.get(recordId) || { x: 0, y: 0 };
                  
                  return (
                    <div
                      key={recordId}
                      className="record-item-wrapper"
                      style={{
                        position: 'absolute',
                        left: position.x,
                        top: position.y,
                      }}
                    >
                      <RecordCard record={record} isHighlighted={record.id === highlightedRecordId} />
                    </div>
                  );
                })}
              </div>
            </div>
            <DragOverlay>
              {activeRecord ? <RecordCard record={activeRecord} /> : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>
    </Modal>
  );
};

export default RecordsModal;
