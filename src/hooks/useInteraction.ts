import { useState, useCallback } from 'react';
import { getRecord, sendInteraction } from '../services/api';
import { useRecords } from '../contexts/RecordsContext';
import type { 
  ObjectInteractionState, 
  ChatMessage
} from '../types/interaction';
import type { ApiRecord } from '../types/record';
import { playMessageReceivedSound } from '../utils/soundManager';

const removePendingMessage = (messages: ChatMessage[], pendingClientId: string) =>
  messages.filter((msg) => !(msg.isPending && msg.clientId === pendingClientId));

const randomSuffixLength = 6;
const createRandomSuffix = () =>
  Math.random()
    .toString(36)
    .substring(2, 2 + randomSuffixLength)
    .padEnd(randomSuffixLength, '0');
const createMessageClientId = (prefix: string) => `${prefix}-${Date.now()}-${createRandomSuffix()}`;

interface UseInteractionResult {
  interactions: Map<string, ObjectInteractionState>;
  startInteraction: (scenarioId: number, objectId: string) => Promise<void>;
  sendMessage: (scenarioId: number, objectId: string, message: string) => Promise<void>;
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

  const { records, addRecords } = useRecords();

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

  const fetchNewRecords = useCallback(async (scenarioId: number, revealedIds?: string[]) => {
    if (!revealedIds || revealedIds.length === 0) {
      return;
    }

    const existingRecordIds = new Set(records.map(r => r.id));
    const newRecordIds = revealedIds.filter(id => !existingRecordIds.has(id));

    if (newRecordIds.length === 0) {
      return;
    }

    try {
      const fetchedRecords = await Promise.all(
        newRecordIds.map(id => getRecord(scenarioId, id))
      );
      addRecords(fetchedRecords.filter((r): r is ApiRecord => r !== null));
    } catch (err) {
      console.error('Failed to fetch newly revealed records:', err);
      // Optionally set an error state here
    }
  }, [records, addRecords]);

  /**
   * Start interaction with an object (initial request with empty body)
   */
  const startInteraction = useCallback(
    async (scenarioId: number, objectId: string) => {
      setIsLoading(true);
      setError(null);

      try {
        // Send empty request to get interaction type
        const response = await sendInteraction(scenarioId, objectId, {});

        await fetchNewRecords(scenarioId, response.revealedRecordIds);

        const newMessage: ChatMessage = {
          content: response.message,
          sender: 'npc',
          name: response.type === 'simple' ? response.name : undefined,
          timestamp: Date.now(),
          clientId: createMessageClientId('npc'),
          revealedRecordIds: response.revealedRecordIds,
        };

        const existingState = interactions.get(objectId);
        const messages = existingState ? [...existingState.messages, newMessage] : [newMessage];

        updateInteractionState(objectId, {
          objectId,
          type: response.type,
          jwtHistory: response.type === 'two-way' ? response.history : undefined,
          messages,
          pressure: response.type === 'two-way' ? response.pressure : undefined,
        });

        playMessageReceivedSound();

        // Handle new records if present
        if (response.newRecords && response.newRecords.length > 0) {
          addRecords(response.newRecords);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to start interaction';
        console.error('Error starting interaction:', errorMessage);
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [updateInteractionState, fetchNewRecords, addRecords]
  );

  /**
   * Send a message in a two-way interaction
   */
  const sendMessage = useCallback(
    async (scenarioId: number, objectId: string, message: string) => {
      const currentState = interactions.get(objectId);
      if (!currentState || currentState.type !== 'two-way') {
        console.error('Cannot send message: not a two-way interaction');
        return;
      }

      setIsLoading(true);
      setError(null);

      const messageTimestamp = Date.now();
      const pendingClientId = createMessageClientId('pending');

      try {
        // Add player message to history first for immediate UI feedback
        const playerMessage: ChatMessage = {
          content: message,
          sender: 'player',
          timestamp: messageTimestamp,
          clientId: createMessageClientId('player'),
        };

        const pendingMessage: ChatMessage = {
          content: '',
          sender: 'npc',
          timestamp: messageTimestamp,
          isPending: true,
          clientId: pendingClientId,
        };

        updateInteractionState(objectId, (prevState) => {
          if (!prevState || prevState.type !== 'two-way') {
            return prevState;
          }
          return {
            messages: [...prevState.messages, playerMessage, pendingMessage],
          };
        });

        // Send message with history
        const response = await sendInteraction(scenarioId, objectId, {
          message,
          history: currentState.jwtHistory,
        });

        if (response.type !== 'two-way') {
          throw new Error('Expected two-way response');
        }
        
        await fetchNewRecords(scenarioId, response.revealedRecordIds);

        // Add NPC response to history (replace pending bubble)
        const npcMessage: ChatMessage = {
          content: response.message,
          sender: 'npc',
          timestamp: Date.now(),
          clientId: createMessageClientId('npc'),
          revealedRecordIds: response.revealedRecordIds,
        };

        // Use functional update to append the NPC message to the latest state
        updateInteractionState(objectId, (prevState) => ({
          jwtHistory: response.history,
          messages: [...removePendingMessage(prevState.messages, pendingClientId), npcMessage],
          pressure: response.pressure,
        }));

        playMessageReceivedSound();

        // Handle new records if present
        if (response.newRecords && response.newRecords.length > 0) {
          addRecords(response.newRecords);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
        console.error('Error sending message:', errorMessage);
        setError(errorMessage);
        updateInteractionState(objectId, (prevState) => ({
          messages: removePendingMessage(prevState.messages, pendingClientId),
        }));
      } finally {
        setIsLoading(false);
      }
    },
    [interactions, updateInteractionState, fetchNewRecords, addRecords]
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
