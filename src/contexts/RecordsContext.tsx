import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { Record, RecordType } from '../types/record';
import { mockRecordsData } from '../data/recordsData';

interface RecordsContextType {
  records: Record[];
  addRecords: (newRecords: Array<{ id: number; type: string; name: string }>) => void;
}

const RecordsContext = createContext<RecordsContextType | undefined>(undefined);

export const RecordsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [records, setRecords] = useState<Record[]>(mockRecordsData.records);

  const addRecords = useCallback((newRecords: Array<{ id: number; type: string; name: string }>) => {
    setRecords((prevRecords) => {
      const updatedRecords = [...prevRecords];
      
      newRecords.forEach((newRecord) => {
        // Normalize type to lowercase
        const normalizedType = newRecord.type.toLowerCase() as RecordType;
        
        // Check if record already exists (same type and id)
        const exists = updatedRecords.some(
          (existing) => {
            const existingId = typeof existing.id === 'string' ? parseInt(existing.id) : existing.id;
            const existingType = existing.type.toLowerCase();
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
