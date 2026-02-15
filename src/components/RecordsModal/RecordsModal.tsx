import React, { useState, useEffect, useCallback } from 'react';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import type { Record } from '../../types/record';
import { Modal } from '../common/Modal/Modal';
import { RecordCard } from './components/RecordCard';
import { useRecords } from '../../contexts/RecordsContext';
import './RecordsModal.css';

interface RecordsModalProps {
  isOpen: boolean;
  onClose: () => void;
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

const RecordsModal: React.FC<RecordsModalProps> = ({ isOpen, onClose }) => {
  const { records, updateRecordPosition } = useRecords();
  const [positions, setPositions] = useState<Map<string, { x: number; y: number }>>(new Map());
  const [activeRecord, setActiveRecord] = useState<Record | null>(null);

  // Load positions on mount
  useEffect(() => {
    const loadedPositions = loadPositions();
    setPositions(loadedPositions);
  }, []);

  // Initialize positions for new records in a grid layout
  useEffect(() => {
    if (!isOpen) return;

    setPositions(prevPositions => {
      const newPositions = new Map(prevPositions);
      let row = 0;
      let col = 0;
      const itemsPerRow = 3;
      const cardWidth = 220; // 200px + 20px margin
      const cardHeight = 200; // Approximate height + margin

      records.forEach(record => {
        const recordId = String(record.id);
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
  }, [records, isOpen]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const record = records.find(r => String(r.id) === event.active.id);
    setActiveRecord(record || null);
  }, [records]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveRecord(null);

    const { active, delta } = event;
    const recordId = String(active.id);

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
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="records-canvas">
            {records.map(record => {
              const recordId = String(record.id);
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
      </div>
    </Modal>
  );
};

export default RecordsModal;
