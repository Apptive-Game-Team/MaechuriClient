// Record types for reference feature in chat
export type RecordType = 'clue' | 'suspect';

export interface Record {
  id: string;
  type: RecordType;
  name: string;
}

export interface RecordsData {
  records: Record[];
}
