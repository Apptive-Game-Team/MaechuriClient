import React from 'react';
import type { Record } from '../../../types/record';
import type { ChatMessage } from '../../../types/interaction';

interface MessageProps {
  message: ChatMessage;
  records: Record[];
}

interface Reference {
  type: string;
  id: string;
  name: string;
}

const parseMessageWithReferences = (content: string, records: Record[]): (string | Reference)[] => {
  const parts: (string | Reference)[] = [];
  const regex = /\[(\w+)-(\w+)\]/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(content.substring(lastIndex, match.index));
    }
    const [, matchType, matchId] = match;
    const record = records.find(r => String(r.type) === matchType && String(r.id) === matchId);
    if (record) {
      parts.push({ type: matchType, id: matchId, name: record.name });
    } else {
      parts.push(match[0]);
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < content.length) {
    parts.push(content.substring(lastIndex));
  }

  return parts.length > 0 ? parts : [content];
};

export const Message: React.FC<MessageProps> = ({ message, records }) => {
  return (
    <div className={`chat-message ${message.sender}`}>
      {message.name && message.sender === 'npc' && (
        <div className="chat-message-name">{message.name}</div>
      )}
      <div className="chat-message-bubble">
        {parseMessageWithReferences(message.content, records).map((part, i) =>
          typeof part === 'string' ? (
            <span key={i}>{part}</span>
          ) : (
            <span key={i} className="reference-tag-display">
              {part.name}
            </span>
          )
        )}
      </div>
    </div>
  );
};
