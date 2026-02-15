import React from 'react';
import type { Record } from '../../../types/record';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import './RecordCard.css';

interface RecordCardProps {
  record: Record;
}

export const RecordCard: React.FC<RecordCardProps> = ({ record }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: String(record.id),
    data: record,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
  };

  const getTypeLabel = () => {
    switch (record.type) {
      case 'CLUE':
        return '단서';
      case 'NPC':
        return '용의자';
      case 'FACT':
        return '사실';
      default:
        return record.type;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`record-card record-card-${record.type.toLowerCase()}`}
      {...listeners}
      {...attributes}
    >
      <div className="record-card-type">{getTypeLabel()}</div>
      {record.imageUrl && (
        <div 
          className="record-card-image"
          style={{ backgroundImage: `url(${record.imageUrl})` }}
        />
      )}
      {!record.imageUrl && record.type === 'FACT' && (
        <div className="record-card-placeholder">
          <span>📋</span>
        </div>
      )}
      <div className="record-card-content">
        <h4 className="record-card-name">{record.name}</h4>
        {record.content && (
          <p className="record-card-description">{record.content}</p>
        )}
      </div>
    </div>
  );
};
