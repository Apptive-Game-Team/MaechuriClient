import React from 'react';
import type { Record } from '../../../types/record';
import type { ChatMessage } from '../../../types/interaction';
import { PressureIndicator } from './PressureIndicator';

interface MessageProps {
  message: ChatMessage;
  records: Record[];
  objectImageUrl?: string;
  objectType?: 'CLUE' | 'NPC' | null;
  pressure?: number | null;
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

const MessageContent: React.FC<{ message: ChatMessage; records: Record[]; pressure?: number | null }> = ({ message, records, pressure }) => (
  <>
    {message.name && message.sender === 'npc' && (
      <div className="chat-message-name">{message.name}</div>
    )}
    {message.isPending ? (
      <div className="chat-message-bubble pending">
        <PressureIndicator pressure={pressure} />
      </div>
    ) : (
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
    )}
  </>
);

export const Message: React.FC<MessageProps> = ({ message, records, objectImageUrl, objectType, pressure }) => {
  if (message.sender === 'npc') {
    return (
      <div className="chat-message npc">
        <div className="chat-message-npc-row">
          {objectImageUrl && (
            <div
              className={`chat-message-avatar chat-message-avatar-${objectType?.toLowerCase()}`}
              style={{ backgroundImage: `url(${objectImageUrl})` }}
            />
          )}
          <div className="chat-message-npc-content">
            <MessageContent message={message} records={records} pressure={pressure} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-message player">
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
