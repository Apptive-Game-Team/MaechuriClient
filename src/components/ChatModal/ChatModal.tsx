import React, { useEffect, useRef } from 'react';
import type { ChatMessage, InteractionType } from '../../types/interaction';
import type { Record } from '../../types/record';
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
  const inputRef = useRef<HTMLDivElement>(null); // For the contentEditable div in ChatInput

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && interactionType === 'two-way') {
      setTimeout(() => inputRef.current?.focus(), 100); // Allow modal to render
    }
  }, [isOpen, interactionType]);

  const chatFooter = (
    <div className={`chat-modal-input-area ${interactionType === 'simple' ? 'disabled' : ''}`}>
      {interactionType === 'two-way' ? (
        <ChatInput ref={inputRef} records={records} onSendMessage={onSendMessage} />
      ) : (
        <div className="chat-modal-disabled-notice">
          {interactionType === 'simple' ? 'This is a read-only interaction' : 'Initializing...'}
        </div>
      )}
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={objectName}
      footer={chatFooter}
      maxWidth="600px"
    >
      <div className="chat-modal-messages">
        {messages.map((msg, index) => (
          <Message key={index} message={msg} records={records} />
        ))}
        <div ref={messagesEndRef} />
      </div>
    </Modal>
  );
};

export default ChatModal;