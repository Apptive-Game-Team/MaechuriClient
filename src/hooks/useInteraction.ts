import { useState, useCallback } from 'react';
import { sendInteraction } from '../services/api';
import type { 
  ObjectInteractionState, 
  ChatMessage
} from '../types/interaction';

interface UseInteractionResult {
  interactions: Map<string, ObjectInteractionState>;
  startInteraction: (scenarioId: number, objectId: string, onNewRecords?: (records: Array<{ id: string; type: string; name: string }>) => void) => Promise<void>;
  sendMessage: (scenarioId: number, objectId: string, message: string, onNewRecords?: (records: Array<{ id: string; type: string; name: string }>) => void) => Promise<void>;
  getInteractionState: (objectId: string) => ObjectInteractionState | undefined;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to manage interactions with objects
 * Stores interaction history per object (both JWT and plaintext)
 */
export function useInteraction(): UseInteractionResult {
  const [interactions, setInteractions] = useState<Map<string, ObjectInteractionState>>(
    new Map()
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getInteractionState = useCallback(
    (objectId: string) => interactions.get(objectId),
    [interactions]
  );

  const updateInteractionState = useCallback(
    (
      objectId: string,
      update:
        | Partial<ObjectInteractionState>
        | ((prevState: ObjectInteractionState) => Partial<ObjectInteractionState>)
    ) => {
      setInteractions((prev) => {
        const newMap = new Map(prev);
        const existing = newMap.get(objectId) || {
          objectId,
          messages: [],
        };
        
        const newUpdate = typeof update === 'function' ? update(existing) : update;

        newMap.set(objectId, { ...existing, ...newUpdate });
        return newMap;
      });
    },
    []
  );

  /**
   * Start interaction with an object (initial request with empty body)
   */
  const startInteraction = useCallback(
    async (scenarioId: number, objectId: string, onNewRecords?: (records: Array<{ id: string; type: string; name: string }>) => void) => {
      setIsLoading(true);
      setError(null);

      try {
        // Send empty request to get interaction type
        const response = await sendInteraction(scenarioId, objectId, {});

        const newMessage: ChatMessage = {
          content: response.message,
          sender: 'npc',
          name: response.type === 'simple' ? response.name : undefined,
          timestamp: Date.now(),
        };

        const existingState = interactions.get(objectId);
        const messages = existingState ? [...existingState.messages, newMessage] : [newMessage];

        updateInteractionState(objectId, {
          objectId,
          type: response.type,
          jwtHistory: response.type === 'two-way' ? response.history : undefined,
          messages,
        });

        // Handle new records if present
        if (response.newRecords && response.newRecords.length > 0 && onNewRecords) {
          onNewRecords(response.newRecords);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to start interaction';
        console.error('Error starting interaction:', errorMessage);
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [interactions, updateInteractionState]
  );

  /**
   * Send a message in a two-way interaction
   */
  const sendMessage = useCallback(
    async (scenarioId: number, objectId: string, message: string, onNewRecords?: (records: Array<{ id: string; type: string; name: string }>) => void) => {
      const currentState = interactions.get(objectId);
      if (!currentState || currentState.type !== 'two-way') {
        console.error('Cannot send message: not a two-way interaction');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Add player message to history first for immediate UI feedback
        const playerMessage: ChatMessage = {
          content: message,
          sender: 'player',
          timestamp: Date.now(),
        };

        updateInteractionState(objectId, {
          messages: [...currentState.messages, playerMessage],
        });

        // Send message with history
        const response = await sendInteraction(scenarioId, objectId, {
          message,
          history: currentState.jwtHistory,
        });

        if (response.type !== 'two-way') {
          throw new Error('Expected two-way response');
        }

        // Add NPC response to history
        const npcMessage: ChatMessage = {
          content: response.message,
          sender: 'npc',
          timestamp: Date.now(),
        };

        // Use functional update to append the NPC message to the latest state
        updateInteractionState(objectId, (prevState) => ({
          jwtHistory: response.history,
          messages: [...prevState.messages, npcMessage],
        }));

        // Handle new records if present
        if (response.newRecords && response.newRecords.length > 0 && onNewRecords) {
          onNewRecords(response.newRecords);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
        console.error('Error sending message:', errorMessage);
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [interactions, updateInteractionState]
  );

  return {
    interactions,
    startInteraction,
    sendMessage,
    getInteractionState,
    isLoading,
    error,
  };
}
