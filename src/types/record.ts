// Record types for reference feature in chat
export type RecordType = 'clue' | 'suspect' | 'CLUE' | 'NPC';

export interface Record {
  id: number | string; // Support both for flexibility
  type: RecordType;
  name: string;
}

export interface RecordsData {
  records: Record[];
}
