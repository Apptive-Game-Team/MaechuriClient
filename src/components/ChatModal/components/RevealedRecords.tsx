import React, { useState } from 'react';
import type { Record } from '../../../types/record';
import { RecordTooltip } from '../../RecordsModal/components/RecordTooltip';
import './RevealedRecords.css';

interface RevealedRecordsProps {
  recordIds: string[];
  records: Record[];
  onRecordClick: (recordId: string) => void;
}

export const RevealedRecords: React.FC<RevealedRecordsProps> = ({ recordIds, records, onRecordClick }) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const revealedRecords = recordIds
    .map(id => records.find(r => r.id === id))
    .filter((r): r is Record => r !== undefined);

  if (revealedRecords.length === 0) return null;

  return (
    <div className="revealed-records">
      {revealedRecords.map(record => (
        <button
          type="button"
          key={record.id}
          className={`revealed-record-icon record-card-${record.type.toLowerCase()}`}
          onMouseEnter={() => setHoveredId(record.id)}
          onMouseLeave={() => setHoveredId(null)}
          onClick={() => onRecordClick(record.id)}
        >
          <span className="revealed-record-type">{record.type}</span>
          <span className="revealed-record-name">{record.name}</span>
          {hoveredId === record.id && (
            <RecordTooltip record={record} direction="above" />
          )}
        </button>
      ))}
    </div>
  );
};
