import React, { useEffect, useRef } from 'react';
import type { ChatMessage, InteractionType } from '../../../types/interaction';
import type { Record } from '../../../types/record';
import './ChatModal.css';
import { Message } from './components/Message';
import { ChatInput } from './components/ChatInput';

interface ChatModalProps {
  isOpen: boolean;
  objectName: string;
  messages: ChatMessage[];
  interactionType: InteractionType | undefined;
  records: Record[];
  onClose: () => void;
  onSendMessage: (message: string) => void;
}

const ChatModal: React.FC<ChatModalProps> = ({
  isOpen,
  objectName,
  messages,
  interactionType,
  records,
  onClose,
  onSendMessage,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      // Auto-focus on input field when modal opens
      if (inputRef.current && interactionType === 'two-way') {
        inputRef.current.focus();
      }
    }
  }, [isOpen, interactionType]);

  if (!isOpen) return null;

  const isTwoWay = interactionType === 'two-way';
  const isSimple = interactionType === 'simple';

  return (
    <div className="chat-modal-overlay" onClick={onClose}>
      <div className="chat-modal" onClick={(e) => e.stopPropagation()}>
        <div className="chat-modal-header">
          <h3>{objectName}</h3>
          <button className="chat-modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="chat-modal-messages">
          {messages.map((msg, index) => (
            <Message key={index} message={msg} records={records} />
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className={`chat-modal-input-area ${isSimple ? 'disabled' : ''}`}>
          {isTwoWay ? (
            <ChatInput ref={inputRef} records={records} onSendMessage={onSendMessage} />
          ) : (
            <div className="chat-modal-disabled-notice">
              {isSimple ? 'This is a read-only interaction' : 'Initializing...'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatModal;
