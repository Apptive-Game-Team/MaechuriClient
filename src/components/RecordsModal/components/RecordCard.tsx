import React, { useState } from 'react';
import type { Record } from '../../../types/record';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { RecordTooltip } from './RecordTooltip';
import './RecordCard.css';

interface RecordCardProps {
  record: Record;
  isHighlighted?: boolean;
}

export const RecordCard: React.FC<RecordCardProps> = ({ record, isHighlighted }) => {
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`record-card record-card-${record.type.toLowerCase()}${isHighlighted ? ' record-card-highlighted' : ''}`}
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
      {isHovered && <RecordTooltip record={record} />}
    </div>
  );
};
