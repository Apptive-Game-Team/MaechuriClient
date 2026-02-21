import React, { useState, useEffect, useCallback } from 'react';
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
}

interface RecordPosition {
  id: string;
  x: number;
  y: number;
}

const STORAGE_KEY = 'maechuri-record-positions';

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

const RecordsModal: React.FC<RecordsModalProps> = ({ isOpen, onClose, scenarioData }) => {
  const { records, updateRecordPosition, setRecords } = useRecords();
  const [positions, setPositions] = useState<Map<string, { x: number; y: number }>>(new Map());
  const [activeRecord, setActiveRecord] = useState<Record | null>(null);
  const [enrichedRecords, setEnrichedRecords] = useState<Record[]>([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);

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
        x: currentPos.x + delta.x,
        y: currentPos.y + delta.y,
      };

      newPositions.set(recordId, newPos);
      
      // Save to localStorage
      savePositions(newPositions);
      
      // Update context
      updateRecordPosition(recordId, newPos);

      return newPositions;
    });
  }, [updateRecordPosition]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Records"
      maxWidth="1000px"
    >
      <div className="records-modal-content">
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
            <div className="records-canvas">
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
                    <RecordCard record={record} />
                  </div>
                );
              })}
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
