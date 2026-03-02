import { useState, useRef, useCallback } from 'react';
import type { Record } from '../../../types/record';

export const useChatInput = (records: Record[], onSendMessage: (message: string) => void, isNearObject: boolean) => {
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteQuery, setAutocompleteQuery] = useState('');
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  const [isComposing, setIsComposing] = useState(false);
  const [isSendButtonDisabled, setIsSendButtonDisabled] = useState(true);
  const inputRef = useRef<HTMLDivElement>(null);
  const autocompleteRef = useRef<HTMLDivElement>(null);
  const isInsertingRef = useRef(false);

  const getSuggestions = useCallback((query: string): Record[] => {
    const lowerQuery = query.toLowerCase();
    return records.filter(record => record.name.toLowerCase().includes(lowerQuery));
  }, [records]);

  const suggestions = getSuggestions(autocompleteQuery);

  const getMessageToSend = (): string => {
    if (!inputRef.current) return '';
    let message = '';
    inputRef.current.childNodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) {
        message += node.textContent || '';
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        if (element.classList.contains('reference-tag')) {
          const { type, id } = element.dataset;
          if (type && id) message += `[${type}-${id}]`;
        }
      }
    });
    return message.replace(/\u00A0/g, ' ').trim();
  };

  const handleSendMessage = () => {
    const messageToSend = getMessageToSend();
    if (messageToSend) {
      onSendMessage(messageToSend);
      if (inputRef.current) inputRef.current.innerHTML = '';
      setIsSendButtonDisabled(true);
    }
  };

  const handleInputChange = () => {
    if (isComposing || !inputRef.current || isInsertingRef.current) return;
    setIsSendButtonDisabled(!inputRef.current.textContent?.trim());
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    const container = range.startContainer;
    if (container.nodeType === Node.TEXT_NODE) {
      const text = container.textContent || '';
      const textBeforeCursor = text.substring(0, range.startOffset);
      const lastColonIndex = textBeforeCursor.lastIndexOf(':');
      if (lastColonIndex !== -1) {
        const query = textBeforeCursor.substring(lastColonIndex + 1);
        if (!query.includes(' ') && query.length >= 0) {
          setAutocompleteQuery(query);
          setShowAutocomplete(true);
          setSelectedSuggestionIndex(0);
          return;
        }
      }
    }
    setShowAutocomplete(false);
  };

  const insertReference = (record: Record) => {
    if (!inputRef.current) return;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    isInsertingRef.current = true;

    const range = selection.getRangeAt(0);
    const textNode = range.startContainer;
    if (textNode.nodeType !== Node.TEXT_NODE) {
      setShowAutocomplete(false);
      isInsertingRef.current = false;
      return;
    }
    const textContent = textNode.textContent || '';
    const textBeforeCursor = textContent.substring(0, range.startOffset);
    const lastColonIndex = textBeforeCursor.lastIndexOf(':');
    if (lastColonIndex === -1) {
      isInsertingRef.current = false;
      return;
    }
    const referenceSpan = document.createElement('span');
    referenceSpan.className = 'reference-tag';
    referenceSpan.contentEditable = 'false';
    referenceSpan.textContent = record.name;
    referenceSpan.dataset.type = record.type;
    referenceSpan.dataset.id = String(record.id);
    const replaceRange = document.createRange();
    replaceRange.setStart(textNode, lastColonIndex);
    replaceRange.setEnd(textNode, range.startOffset);
    replaceRange.deleteContents();
    replaceRange.insertNode(referenceSpan);
    const spaceNode = document.createTextNode('\u00A0');
    referenceSpan.parentNode?.insertBefore(spaceNode, referenceSpan.nextSibling);
    
    setShowAutocomplete(false);
    setAutocompleteQuery('');
    setIsSendButtonDisabled(!inputRef.current.textContent?.trim());

    setTimeout(() => {
      const newRange = document.createRange();
      newRange.setStartAfter(spaceNode);
      newRange.collapse(true);
      selection.removeAllRanges();
      selection.addRange(newRange);
      isInsertingRef.current = false;
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (isComposing) return;

    if (showAutocomplete && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSuggestionIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSuggestionIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab' || e.key === ' ') {
        e.preventDefault();
        insertReference(suggestions[selectedSuggestionIndex]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowAutocomplete(false);
        return;
      }
    }

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);

    if (range.collapsed) {
      const { startContainer, startOffset } = range;
      const isReferenceTag = (node: Node | null): node is HTMLElement => 
        node?.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).classList.contains('reference-tag');

      if (e.key === 'ArrowLeft') {
        let nodeToSkip: Node | null = null;
        if (startContainer.nodeType === Node.TEXT_NODE && startOffset === 0) {
          nodeToSkip = startContainer.previousSibling;
        } else if (startContainer.nodeType === Node.ELEMENT_NODE && startOffset > 0) {
          nodeToSkip = startContainer.childNodes[startOffset - 1];
        }
        if (isReferenceTag(nodeToSkip)) {
          e.preventDefault();
          const newRange = document.createRange();
          newRange.setStartBefore(nodeToSkip);
          newRange.collapse(true);
          selection.removeAllRanges();
          selection.addRange(newRange);
          return;
        }
      }

      if (e.key === 'ArrowRight') {
        let nodeToSkip: Node | null = null;
        if (startContainer.nodeType === Node.TEXT_NODE && startOffset === startContainer.textContent?.length) {
          nodeToSkip = startContainer.nextSibling;
        } else if (startContainer.nodeType === Node.ELEMENT_NODE) {
          nodeToSkip = startContainer.childNodes[startOffset];
        }
        if (isReferenceTag(nodeToSkip)) {
          e.preventDefault();
          const newRange = document.createRange();
          newRange.setStartAfter(nodeToSkip);
          newRange.collapse(true);
          selection.removeAllRanges();
          selection.addRange(newRange);
          return;
        }
      }

      if (e.key === 'Backspace') {
        const nodeBefore = startContainer.childNodes[startOffset - 1];
        if (isReferenceTag(nodeBefore)) {
          e.preventDefault();
          const spaceAfter = nodeBefore.nextSibling;
          if (spaceAfter && spaceAfter.nodeType === Node.TEXT_NODE && spaceAfter.textContent?.startsWith('\u00A0')) {
            spaceAfter.textContent = spaceAfter.textContent.substring(1);
          }
          nodeBefore.remove();
          handleInputChange();
          return;
        }
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isNearObject) return; // Prevent sending message if not near object
      handleSendMessage();
    }
  };

  return {
    inputRef,
    autocompleteRef,
    showAutocomplete,
    suggestions,
    selectedSuggestionIndex,
    isSendButtonDisabled,
    isComposing,
    handleInputChange,
    handleKeyDown,
    handleSendMessage,
    setIsComposing,
    insertReference,
  };
};
