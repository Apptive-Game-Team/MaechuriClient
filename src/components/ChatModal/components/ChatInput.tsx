import { forwardRef, useImperativeHandle } from 'react';
import { useChatInput } from '../hooks/useChatInput';
import type { Record } from '../../../types/record';

interface ChatInputProps {
  records: Record[];
  onSendMessage: (message: string) => void;
  isNearObject: boolean;
}

export const ChatInput = forwardRef<HTMLDivElement, ChatInputProps>(({ records, onSendMessage, isNearObject }, ref) => {
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
  } = useChatInput(records, onSendMessage, isNearObject);

  useImperativeHandle(ref, () => inputRef.current as HTMLDivElement);

  return (
    <div className="chat-input-wrapper">
      <div
        ref={inputRef}
        className="chat-modal-input-editable"
        contentEditable
        role="textbox"
        aria-label="대화 메시지"
        aria-multiline="true"
        tabIndex={0}
        onInput={handleInputChange}
        onKeyDown={handleKeyDown}
        onCompositionStart={() => setIsComposing(true)}
        onCompositionEnd={() => {
          setIsComposing(false);
          handleInputChange();
        }}
        data-placeholder="메시지를 입력하세요… (: 입력 시 기록 참조)"
      />
      {showAutocomplete && suggestions.length > 0 && (
        <div ref={autocompleteRef} className="autocomplete-dropdown" role="listbox" aria-label="참조할 기록">
          {suggestions.map((record, index) => (
            <button
              type="button"
              key={`${record.type}-${record.id}`}
              className={`autocomplete-item ${index === selectedSuggestionIndex ? 'selected' : ''}`}
              role="option"
              aria-selected={index === selectedSuggestionIndex}
              onMouseDown={(e) => {
                e.preventDefault();
                insertReference(record);
              }}
            >
              <span className="autocomplete-type">{record.type}</span>
              <span className="autocomplete-name">{record.name}</span>
            </button>
          ))}
        </div>
      )}
      <button
        className="chat-modal-send-button"
        onClick={handleSendMessage}
        disabled={isSendButtonDisabled || !isNearObject}
      >
        전송
      </button>
    </div>
  );
});
