import React, { useState } from 'react';
import type { Record } from '../../../types/record';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import './RecordCard.css';

interface RecordCardProps {
  record: Record;
}

export const RecordCard: React.FC<RecordCardProps> = ({ record }) => {
  const [isHovered, setIsHovered] = useState(false);
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: record.id,
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
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...listeners}
      {...attributes}
    >
      {/* Simplified view */}
      <div className="record-card-simple">
        {record.type === 'FACT' ? (
          <div className="record-card-memo-icon">
            📝
          </div>
        ) : record.imageUrl ? (
          <div 
            className="record-card-image"
            style={{ backgroundImage: `url(${record.imageUrl})` }}
          />
        ) : (
          <div className="record-card-image record-card-image-empty" />
        )}
        <div className="record-card-simple-name">{record.name}</div>
      </div>

      {/* Hover tooltip */}
      {isHovered && (
        <div className="record-card-tooltip">
          <div className="record-card-tooltip-header">
            <span className="record-card-tooltip-type">{getTypeLabel()}</span>
            <h4 className="record-card-tooltip-name">{record.name}</h4>
          </div>
          {record.content && (
            <p className="record-card-tooltip-content">{record.content}</p>
          )}
        </div>
      )}
    </div>
  );
};
