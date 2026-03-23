import React from 'react';
import type { Record } from '../../../types/record';
import './RecordTooltip.css';

interface RecordTooltipProps {
  record: Record;
  direction?: 'above' | 'below';
}

const getTypeLabel = (type: Record['type']): string => {
  switch (type) {
    case 'CLUE':
      return '단서';
    case 'NPC':
      return '용의자';
    case 'FACT':
      return '사실';
    default:
      return type;
  }
};

export const RecordTooltip: React.FC<RecordTooltipProps> = ({ record, direction = 'below' }) => (
  <div className={`record-card-tooltip${direction === 'above' ? ' record-card-tooltip-above' : ''}`}>
    <div className="record-card-tooltip-header">
      <span className="record-card-tooltip-type">{getTypeLabel(record.type)}</span>
      <h4 className="record-card-tooltip-name">{record.name}</h4>
    </div>
    {record.content && (
      <p className="record-card-tooltip-content">{record.content}</p>
    )}
  </div>
);
