// Record types for reference feature in chat
export type RecordType = 'CLUE' | 'NPC' | 'FACT';

export interface Position {
  x: number;
  y: number;
}

export interface Record {
  id: number | string; // Support both for flexibility
  type: RecordType;
  name: string;
  content?: string; // Description of the record
  imageUrl?: string; // Image URL for CLUE/NPC types
  position?: Position; // Position in the records modal canvas
}

export interface RecordsData {
  records: Record[];
}

// API response type for single record
export interface RecordDetail {
  name: string;
  content: string;
}
