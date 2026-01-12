import React, { useState, useEffect, useRef } from 'react';
import type { ChatMessage, InteractionType } from '../../types/interaction';
import type { Record } from '../../types/record';
import { mockRecordsData } from '../../data/recordsData';
import './ChatModal.css';

interface ChatModalProps {
  isOpen: boolean;
  objectName: string;
  messages: ChatMessage[];
  interactionType: InteractionType | undefined;
  onClose: () => void;
  onSendMessage: (message: string) => void;
}

interface Reference {
  type: string;
  id: string;
  name: string;
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
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteQuery, setAutocompleteQuery] = useState('');
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [isComposing, setIsComposing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);
  const autocompleteRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Reset input when modal opens (not when it closes)
  useEffect(() => {
    if (isOpen) {
      setInputMessage('');
      setShowAutocomplete(false);
      setAutocompleteQuery('');
    }
  }, [isOpen]);

  // Disable player movement when modal is open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOpen) {
        // Prevent game controls when modal is open
        const gameControlKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'W', 'a', 'A', 's', 'S', 'd', 'D', ' ', 'e', 'E'];
        if (gameControlKeys.includes(e.key)) {
          e.stopPropagation();
        }
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown, true);
      return () => window.removeEventListener('keydown', handleKeyDown, true);
    }
  }, [isOpen]);

  // Close autocomplete when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowAutocomplete(false);
      }
    };

    if (showAutocomplete) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showAutocomplete]);

  if (!isOpen) {
    return null;
  }

  // Parse message to extract references
  const parseMessageWithReferences = (content: string): (string | Reference)[] => {
    const parts: (string | Reference)[] = [];
    const regex = /\[(\w+)-(\w+)\]/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(content)) !== null) {
      // Add text before the reference
      if (match.index > lastIndex) {
        parts.push(content.substring(lastIndex, match.index));
      }

      // Find the record to get the name
      const matchType = match[1];
      const matchId = match[2];
      const record = mockRecordsData.records.find(
        r => r.type === matchType && r.id === matchId
      );

      if (record) {
        parts.push({
          type: matchType,
          id: matchId,
          name: record.name
        });
      } else {
        // If record not found, keep the original text
        parts.push(match[0]);
      }

      lastIndex = regex.lastIndex;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }

    return parts.length > 0 ? parts : [content];
  };

  // Filter input to allow only English, Korean, numbers, and :
  const filterInput = (text: string): string => {
    return text.replace(/[^a-zA-Z가-힣0-9:\s]/g, '');
  };

  // Get filtered suggestions based on query
  const getSuggestions = (query: string): Record[] => {
    const lowerQuery = query.toLowerCase();
    return mockRecordsData.records.filter(record =>
      record.name.toLowerCase().includes(lowerQuery)
    );
  };

  const suggestions = getSuggestions(autocompleteQuery);

  // Get cursor position within the contentEditable element
  const getCursorPosition = (): number => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !inputRef.current) return 0;
    
    const range = selection.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(inputRef.current);
    preCaretRange.setEnd(range.endContainer, range.endOffset);
    
    return preCaretRange.toString().length;
  };

  // Handle input change with reference detection
  const handleInputChange = (e: React.FormEvent<HTMLDivElement>) => {
    // Ignore input during IME composition for Korean input
    if (isComposing) return;
    
    const text = e.currentTarget.textContent || '';
    const filteredText = filterInput(text);
    
    // Update input
    if (filteredText !== text) {
      e.currentTarget.textContent = filteredText;
      // Move cursor to end
      const range = document.createRange();
      const sel = window.getSelection();
      if (e.currentTarget.childNodes.length > 0) {
        const lastNode = e.currentTarget.childNodes[e.currentTarget.childNodes.length - 1];
        range.setStart(lastNode, lastNode.textContent?.length || 0);
        range.collapse(true);
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }

    setInputMessage(filteredText);

    // Get current cursor position
    const position = getCursorPosition();
    setCursorPosition(position);

    // Find the last : before cursor
    const textBeforeCursor = filteredText.substring(0, position);
    const lastColonIndex = textBeforeCursor.lastIndexOf(':');
    
    if (lastColonIndex !== -1) {
      const query = textBeforeCursor.substring(lastColonIndex + 1);
      // Check if there's no space after the colon
      if (!query.includes(' ')) {
        setAutocompleteQuery(query);
        setShowAutocomplete(true);
        setSelectedSuggestionIndex(0);
      } else {
        setShowAutocomplete(false);
      }
    } else {
      setShowAutocomplete(false);
    }
  };

  // Insert reference into input
  const insertReference = (record: Record) => {
    if (!inputRef.current) return;

    // Get all text content including references
    let fullText = '';
    
    inputRef.current.childNodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) {
        fullText += node.textContent || '';
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        if (element.classList.contains('reference-tag')) {
          fullText += element.textContent || '';
        }
      }
    });

    const textBeforeCursor = fullText.substring(0, cursorPosition);
    const lastColonIndex = textBeforeCursor.lastIndexOf(':');
    
    if (lastColonIndex !== -1) {
      const beforeColon = fullText.substring(0, lastColonIndex);
      const afterCursor = fullText.substring(cursorPosition);
      
      // Create reference element
      const referenceSpan = document.createElement('span');
      referenceSpan.className = 'reference-tag';
      referenceSpan.contentEditable = 'false';
      referenceSpan.textContent = record.name;
      referenceSpan.dataset.type = record.type;
      referenceSpan.dataset.id = record.id;
      
      // Rebuild input content with proper structure
      inputRef.current.innerHTML = '';
      
      // Add text before colon
      if (beforeColon) {
        inputRef.current.appendChild(document.createTextNode(beforeColon));
      }
      
      // Add reference
      inputRef.current.appendChild(referenceSpan);
      
      // Add space and remaining text
      if (afterCursor) {
        if (!afterCursor.startsWith(' ')) {
          inputRef.current.appendChild(document.createTextNode(' ' + afterCursor));
        } else {
          inputRef.current.appendChild(document.createTextNode(afterCursor));
        }
      } else {
        // Add space after reference if at end
        inputRef.current.appendChild(document.createTextNode(' '));
      }
      
      // Move cursor after the reference
      const range = document.createRange();
      const sel = window.getSelection();
      range.setStartAfter(referenceSpan);
      range.collapse(true);
      sel?.removeAllRanges();
      sel?.addRange(range);
      
      // Update state
      setInputMessage(inputRef.current.textContent || '');
      setShowAutocomplete(false);
      setAutocompleteQuery('');
      
      inputRef.current.focus();
    }
  };

  // Convert contentEditable content to message with [type-id] format
  const getMessageToSend = (): string => {
    if (!inputRef.current) return '';
    
    let message = '';
    inputRef.current.childNodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) {
        message += node.textContent || '';
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        if (element.classList.contains('reference-tag')) {
          const type = element.dataset.type || '';
          const id = element.dataset.id || '';
          if (type && id) {
            message += `[${type}-${id}]`;
          }
        }
      }
    });
    
    return message;
  };

  const handleSendMessage = () => {
    const messageToSend = getMessageToSend().trim();
    if (messageToSend) {
      onSendMessage(messageToSend);
      if (inputRef.current) {
        inputRef.current.innerHTML = '';
      }
      setInputMessage('');
      setShowAutocomplete(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Don't handle Enter during IME composition
    if (isComposing && e.key === 'Enter') {
      return;
    }
    
    if (showAutocomplete && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSuggestionIndex((prev) => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSuggestionIndex((prev) => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        insertReference(suggestions[selectedSuggestionIndex]);
        return;
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowAutocomplete(false);
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
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
                {parseMessageWithReferences(msg.content).map((part, i) => {
                  if (typeof part === 'string') {
                    return <span key={i}>{part}</span>;
                  } else {
                    return (
                      <span key={i} className="reference-tag-display">
                        {part.name}
                      </span>
                    );
                  }
                })}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className={`chat-modal-input-area ${isSimple ? 'disabled' : ''}`}>
          {isTwoWay ? (
            <div className="chat-input-wrapper">
              <div
                ref={inputRef}
                className="chat-modal-input-editable"
                contentEditable
                onInput={handleInputChange}
                onKeyDown={handleKeyDown}
                onCompositionStart={() => setIsComposing(true)}
                onCompositionEnd={() => setIsComposing(false)}
                data-placeholder="Type your message... (Use : to reference)"
              />
              {showAutocomplete && suggestions.length > 0 && (
                <div ref={autocompleteRef} className="autocomplete-dropdown">
                  {suggestions.map((record, index) => (
                    <div
                      key={`${record.type}-${record.id}`}
                      className={`autocomplete-item ${index === selectedSuggestionIndex ? 'selected' : ''}`}
                      onClick={() => insertReference(record)}
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
                disabled={!inputMessage.trim()}
              >
                Send
              </button>
            </div>
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
