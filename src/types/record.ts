// Record types for reference feature in chat
export type RecordType = 'CLUE' | 'NPC' | 'FACT';

export interface Position {
  x: number;
  y: number;
}

// Interface for records as received from the API (properties are optional to handle inconsistencies)
export interface ApiRecord {
  id?: string; // e.g., "c:1", "s:2", "f:3"
  name?: string;
  content?: string;
}

// Interface for internal application use
export interface Record {
  id: string; // The full ID, e.g., "c:1"
  type: RecordType; // Derived from the ID prefix
  name: string;
  content: string;
  imageUrl?: string; // Image URL for CLUE/NPC types
  position?: Position; // Position in the records modal canvas
}

export interface RecordsData {
  records: ApiRecord[]; // API returns ApiRecord[]
}

// API response type for single record detail
export interface RecordDetail {
  name: string;
  content: string;
}

/**
 * Derives the RecordType from a record ID string.
 * @param id The record ID (e.g., "c:1", "s:2", "f:3").
 * @returns The corresponding RecordType.
 */
export const deriveRecordType = (id: string): RecordType => {
  if (typeof id !== 'string' || !id) {
    console.warn(`Invalid or missing record ID for type derivation:`, id);
    return 'FACT'; // Default to a safe type
  }
  const prefix = id.split(':')[0];
  switch (prefix) {
    case 'c':
      return 'CLUE';
    case 's':
      return 'NPC'; // 's' for suspect, which maps to NPC
    case 'f':
      return 'FACT';
    default:
      console.warn(`Unknown record type prefix: ${prefix} for ID: ${id}`);
      return 'FACT'; // Default to FACT or handle error
  }
};

/**
 * Maps an ApiRecord (from backend) to a Record (for frontend use).
 * Returns null if the ApiRecord is invalid.
 * @param apiRecord The raw record data from the API.
 * @returns A Record object with derived type, or null if invalid.
 */
export const mapApiRecordToRecord = (apiRecord: ApiRecord): Record | null => {
  // Basic validation to ensure we have the necessary data
  if (!apiRecord || !apiRecord.id || !apiRecord.name) {
    console.warn('Skipping invalid record from API:', apiRecord);
    return null;
  }
  
  return {
    id: apiRecord.id,
    type: deriveRecordType(apiRecord.id),
    name: apiRecord.name,
    content: apiRecord.content || '', // Ensure content is at least an empty string
    // imageUrl and position are not part of ApiRecord, they are added later
  };
};
