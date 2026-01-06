import React, { useState, useEffect, useRef } from 'react';
import type { ChatMessage, InteractionType } from '../../types/interaction';
import './ChatModal.css';

interface ChatModalProps {
  isOpen: boolean;
  objectName: string;
  messages: ChatMessage[];
  interactionType: InteractionType | undefined;
  onClose: () => void;
  onSendMessage: (message: string) => void;
}

const ChatModal: React.FC<ChatModalProps> = ({
  isOpen,
  objectName,
  messages,
  interactionType,
  onClose,
  onSendMessage,
}) => {
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Reset input when modal closes
  useEffect(() => {
    if (!isOpen) {
      setInputMessage('');
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleSendMessage = () => {
    if (inputMessage.trim()) {
      onSendMessage(inputMessage.trim());
      setInputMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const isTwoWay = interactionType === 'two-way';
  const isSimple = interactionType === 'simple';

  return (
    <div className="chat-modal-overlay" onClick={onClose}>
      <div className="chat-modal" onClick={(e) => e.stopPropagation()}>
        <div className="chat-modal-header">
          <h3>{objectName}</h3>
          <button 
            className="chat-modal-close" 
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="chat-modal-messages">
          {messages.map((msg, index) => (
            <div 
              key={index} 
              className={`chat-message ${msg.sender}`}
            >
              {msg.name && msg.sender === 'npc' && (
                <div className="chat-message-name">{msg.name}</div>
              )}
              <div className="chat-message-bubble">
                {msg.content}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className={`chat-modal-input-area ${isSimple ? 'disabled' : ''}`}>
          {isTwoWay ? (
            <>
              <input
                type="text"
                className="chat-modal-input"
                placeholder="Type your message..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <button
                className="chat-modal-send-button"
                onClick={handleSendMessage}
                disabled={!inputMessage.trim()}
              >
                Send
              </button>
            </>
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
