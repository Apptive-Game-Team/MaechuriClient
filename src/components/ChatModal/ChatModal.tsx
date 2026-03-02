import React, { useEffect, useRef, useMemo } from 'react';
import type { ChatMessage, InteractionType, ObjectInteractionState } from '../../types/interaction';
import type { Record } from '../../types/record';
import type { MapObject } from '../../types/map';
import './ChatModal.css';
import { Message } from './components/Message';
import { ChatInput } from './components/ChatInput';
import { Modal } from '../common/Modal/Modal';

interface ChatModalProps {
  isOpen: boolean;
  objectName: string;
  messages: ChatMessage[];
  interactionType: InteractionType | undefined;
  records: Record[];
  onClose: () => void;
  onSendMessage: (message: string) => void;
  playerPosition?: { x: number; y: number };
  mapObjects?: MapObject[];
  interactions?: Map<string, ObjectInteractionState>;
  currentObjectId?: string | null;
  onSwitchObject?: (objectId: string, objectName: string) => void;
}

const ChatModal: React.FC<ChatModalProps> = ({
  isOpen,
  objectName,
  messages,
  interactionType,
  records,
  onClose,
  onSendMessage,
  playerPosition,
  mapObjects,
  interactions,
  currentObjectId,
  onSwitchObject,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && interactionType === 'two-way') {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, interactionType]);

  // Build sidebar: current object at top (always), then two-way objects already interacted with
  const sidebarItems = useMemo(() => {
    const items: { id: string; name: string }[] = [];
    if (currentObjectId && objectName) {
      items.push({ id: currentObjectId, name: objectName });
    }
    if (interactions && mapObjects) {
      for (const [id, state] of interactions) {
        if (state.type === 'two-way' && id !== currentObjectId) {
          const mapObj = mapObjects.find((o) => o.id === id);
          if (mapObj) {
            items.push({ id, name: mapObj.name });
          }
        }
      }
    }
    return items;
  }, [currentObjectId, objectName, interactions, mapObjects]);

  // Check if player is within 5 tiles of the current object
  const isNearObject = useMemo(() => {
    if (!playerPosition || !currentObjectId || !mapObjects) return false;
    const obj = mapObjects.find((o) => o.id === currentObjectId);
    if (!obj) return false;
    const dx = playerPosition.x - obj.position.x;
    const dy = playerPosition.y - obj.position.y;
    return dx * dx + dy * dy <= 25;
  }, [playerPosition, currentObjectId, mapObjects]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={objectName || 'Chat'}
      maxWidth="740px"
    >
      <div className="chat-modal-layout">
        {sidebarItems.length > 0 && (
          <div className="chat-modal-sidebar">
            {sidebarItems.map((item) => (
              <label
                key={item.id}
                className={`chat-sidebar-item ${item.id === currentObjectId ? 'selected' : ''}`}
              >
                <input
                  type="radio"
                  name="chat-object"
                  value={item.id}
                  checked={item.id === currentObjectId}
                  onChange={() => onSwitchObject?.(item.id, item.name)}
                />
                <span className="chat-sidebar-name">{item.name}</span>
              </label>
            ))}
          </div>
        )}
        <div className="chat-modal-right">
          <div className="chat-modal-messages">
            {messages.map((msg, index) => (
              <Message key={index} message={msg} records={records} />
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div className={`chat-modal-input-area ${interactionType === 'simple' ? 'disabled' : ''}`}>
            {interactionType === 'two-way' ? (
              <ChatInput ref={inputRef} records={records} onSendMessage={onSendMessage} isNearObject={isNearObject} />
            ) : (
              <div className="chat-modal-disabled-notice">
                {interactionType === 'simple' ? 'This is a read-only interaction' : 'Initializing...'}
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ChatModal;