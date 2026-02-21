// Interaction API Types
import type { ApiRecord } from './record'; // Added import for ApiRecord

export type InteractionType = 'simple' | 'two-way';

export interface InteractionRequest {
  message?: string;
  history?: string; // JWT encoded history string
}

export interface SimpleInteractionResponse {
  type: 'simple';
  message: string;
  name?: string; // Optional name field for simple interactions
  newRecords?: ApiRecord[]; // Changed type to ApiRecord[]
}

export interface TwoWayInteractionResponse {
  type: 'two-way';
  message: string;
  history: string; // Updated JWT encoded history string
  newRecords?: ApiRecord[]; // Changed type to ApiRecord[]
}

export type InteractionResponse = SimpleInteractionResponse | TwoWayInteractionResponse;

// Chat message for UI display
export interface ChatMessage {
  content: string;
  sender: 'player' | 'npc';
  name?: string; // Optional name for NPC messages
  timestamp: number;
}

// Object-specific interaction state
export interface ObjectInteractionState {
  objectId: string;
  type?: InteractionType;
  jwtHistory?: string; // JWT encoded history
  messages: ChatMessage[]; // Plaintext history for display
}
