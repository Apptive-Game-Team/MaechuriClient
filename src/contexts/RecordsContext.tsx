import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { Record, Position, ApiRecord } from '../types/record'; // ApiRecord is still used in RecordsContextType
import { mapApiRecordToRecord } from '../types/record'; // Changed from type import

interface RecordsContextType {
  records: Record[];
  addRecords: (newRecords: ApiRecord[]) => void;
  updateRecordPosition: (recordId: string, position: Position) => void;
  setRecords: (records: Record[]) => void;
}

const RecordsContext = createContext<RecordsContextType | undefined>(undefined);

export const RecordsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [records, setRecords] = useState<Record[]>([]);

  const addRecords = useCallback((newRecords: ApiRecord[]) => {
    setRecords((prevRecords) => {
      const updatedRecords = [...prevRecords];
      
      newRecords.forEach((newApiRecord) => {
        const newRecord = mapApiRecordToRecord(newApiRecord); // Can be Record | null

        if (newRecord === null) {
          return; // Skip invalid records from API
        }

        // Check if record already exists by ID
        const exists = updatedRecords.some(
          (existing) => existing.id === newRecord.id
        );
        
        // Only add if it doesn't exist
        if (!exists) {
          updatedRecords.push(newRecord);
        }
      });
      
      return updatedRecords;
    });
  }, []);

  const updateRecordPosition = useCallback((recordId: string, position: Position) => {
    setRecords((prevRecords) => 
      prevRecords.map((record) => {
        // record.id is guaranteed to be string here
        if (record.id === recordId) {
          return { ...record, position };
        }
        return record;
      })
    );
  }, []);

  return (
    <RecordsContext.Provider value={{ records, addRecords, updateRecordPosition, setRecords }}>
      {children}
    </RecordsContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useRecords = (): RecordsContextType => {
  const context = useContext(RecordsContext);
  if (!context) {
    throw new Error('useRecords must be used within a RecordsProvider');
  }
  return context;
};
