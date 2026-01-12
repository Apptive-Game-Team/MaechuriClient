// Interaction API Types
export type InteractionType = 'simple' | 'two-way';

export interface InteractionRequest {
  message?: string;
  history?: string; // JWT encoded history string
}

export interface SimpleInteractionResponse {
  type: 'simple';
  message: string;
  name?: string; // Optional name field for simple interactions
}

export interface TwoWayInteractionResponse {
  type: 'two-way';
  message: string;
  history: string; // Updated JWT encoded history string
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
  objectId: number;
  type?: InteractionType;
  jwtHistory?: string; // JWT encoded history
  messages: ChatMessage[]; // Plaintext history for display
}
