import React from 'react';
import { useChatInput } from '../hooks/useChatInput';
import type { Record } from '../../../types/record';

interface ChatInputProps {
  records: Record[];
  onSendMessage: (message: string) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({ records, onSendMessage }) => {
  const {
    inputRef,
    autocompleteRef,
    showAutocomplete,
    suggestions,
    selectedSuggestionIndex,
    isSendButtonDisabled,
    handleInputChange,
    handleKeyDown,
    handleSendMessage,
    setIsComposing,
    insertReference,
  } = useChatInput(records, onSendMessage);

  return (
    <div className="chat-input-wrapper">
      <div
        ref={inputRef}
        className="chat-modal-input-editable"
        contentEditable
        onInput={handleInputChange}
        onKeyDown={handleKeyDown}
        onCompositionStart={() => setIsComposing(true)}
        onCompositionEnd={() => {
          setIsComposing(false);
          handleInputChange();
        }}
        data-placeholder="Type your message... (Use : to reference)"
      />
      {showAutocomplete && suggestions.length > 0 && (
        <div ref={autocompleteRef} className="autocomplete-dropdown">
          {suggestions.map((record, index) => (
            <div
              key={`${record.type}-${record.id}`}
              className={`autocomplete-item ${index === selectedSuggestionIndex ? 'selected' : ''}`}
              onMouseDown={(e) => {
                e.preventDefault();
                insertReference(record);
              }}
            >
              <span className="autocomplete-type">{record.type}</span>
              <span className="autocomplete-name">{record.name}</span>
            </div>
          ))}
        </div>
      )}
      <button
        className="chat-modal-send-button"
        onClick={handleSendMessage}
        disabled={isSendButtonDisabled}
      >
        Send
      </button>
    </div>
  );
};
