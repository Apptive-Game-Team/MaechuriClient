import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { Record, RecordType } from '../types/record';
import { mockRecordsData } from '../data/recordsData';

interface RecordsContextType {
  records: Record[];
  addRecords: (newRecords: Array<{ id: number; type: string; name: string }>) => void;
}

const RecordsContext = createContext<RecordsContextType | undefined>(undefined);

// Normalize server type to client type
const normalizeType = (serverType: string): RecordType => {
  const normalized = serverType.toUpperCase();
  if (normalized === 'NPC') return 'suspect';
  if (normalized === 'CLUE') return 'clue';
  // Fallback to lowercase for backward compatibility
  return serverType.toLowerCase() as RecordType;
};

export const RecordsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [records, setRecords] = useState<Record[]>(mockRecordsData.records);

  const addRecords = useCallback((newRecords: Array<{ id: number; type: string; name: string }>) => {
    setRecords((prevRecords) => {
      const updatedRecords = [...prevRecords];
      
      newRecords.forEach((newRecord) => {
        // Normalize type
        const normalizedType = normalizeType(newRecord.type);
        
        // Check if record already exists (same type and id)
        const exists = updatedRecords.some(
          (existing) => {
            // Normalize existing ID to number for comparison
            let existingId: number;
            if (typeof existing.id === 'string') {
              existingId = parseInt(existing.id, 10);
              // Skip comparison if parsing failed
              if (isNaN(existingId)) return false;
            } else {
              existingId = existing.id;
            }
            
            const existingType = normalizeType(existing.type);
            return existingId === newRecord.id && existingType === normalizedType;
          }
        );
        
        // Only add if it doesn't exist
        if (!exists) {
          updatedRecords.push({
            id: newRecord.id,
            type: normalizedType,
            name: newRecord.name,
          });
        }
      });
      
      return updatedRecords;
    });
  }, []);

  return (
    <RecordsContext.Provider value={{ records, addRecords }}>
      {children}
    </RecordsContext.Provider>
  );
};

export const useRecords = (): RecordsContextType => {
  const context = useContext(RecordsContext);
  if (!context) {
    throw new Error('useRecords must be used within a RecordsProvider');
  }
  return context;
};
