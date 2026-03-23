import React from 'react';
import type { Record } from '../../../types/record';
import type { ChatMessage } from '../../../types/interaction';
import { PressureIndicator } from './PressureIndicator';
import { RevealedRecords } from './RevealedRecords';

interface MessageProps {
  message: ChatMessage;
  records: Record[];
  objectImageUrl?: string;
  objectType?: 'CLUE' | 'NPC' | null;
  pressure?: number | null;
  onRecordClick: (recordId: string) => void;
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

const MessageContent: React.FC<{ message: ChatMessage; records: Record[] }> = ({ message, records }) => (
  <>
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
  </>
);

const PendingMessageContent: React.FC<{ message: ChatMessage; pressure?: number | null }> = ({ message, pressure }) => (
  <>
    {message.name && message.sender === 'npc' && (
      <div className="chat-message-name">{message.name}</div>
    )}
    <div className="chat-message-bubble pending">
      <PressureIndicator pressure={pressure} />
    </div>
  </>
);

export const Message: React.FC<MessageProps> = ({ message, records, objectImageUrl, objectType, pressure, onRecordClick }) => {
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
            {message.isPending ? (
              <PendingMessageContent message={message} pressure={pressure} />
            ) : (
              <MessageContent message={message} records={records} />
            )}
            {!message.isPending && message.revealedRecordIds && message.revealedRecordIds.length > 0 && (
              <RevealedRecords
                recordIds={message.revealedRecordIds}
                records={records}
                onRecordClick={onRecordClick}
              />
            )}
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
