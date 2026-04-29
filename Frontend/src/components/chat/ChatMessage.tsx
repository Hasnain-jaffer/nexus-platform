/**
 * ChatMessage.tsx — Fixed in Step 4
 * - Removed stray `findUserById` import from mock data
 * - Now accepts `sender` as a prop (passed down from ChatPage)
 */
import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Check, CheckCheck } from 'lucide-react';
import { Message, User } from '../../types';
import { Avatar } from '../ui/Avatar';

interface ChatMessageProps {
  message: Message;
  isCurrentUser: boolean;
  /** The User object for the message sender — passed from the parent */
  sender: User | null;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, isCurrentUser, sender }) => {
  if (!sender) return null;

  return (
    <div
      className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-4 animate-fade-in`}
    >
      {!isCurrentUser && (
        <Avatar
          src={sender.avatarUrl}
          alt={sender.name}
          size="sm"
          className="mr-2 self-end"
        />
      )}

      <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`max-w-xs sm:max-w-md px-4 py-2 rounded-lg ${
            isCurrentUser
              ? 'bg-primary-600 text-white rounded-br-none'
              : 'bg-gray-100 text-gray-800 rounded-bl-none'
          }`}
        >
          <p className="text-sm">{message.content}</p>
        </div>

        <div className="flex items-center gap-1 mt-1">
          <span className="text-xs text-gray-500">
            {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
          </span>
          {/* Read receipt — only shown on current user's messages */}
          {isCurrentUser && (
            message.isRead
              ? <CheckCheck size={12} className="text-primary-500" title="Read" />
              : <Check size={12} className="text-gray-400" title="Sent" />
          )}
        </div>
      </div>

      {isCurrentUser && (
        <Avatar
          src={sender.avatarUrl}
          alt={sender.name}
          size="sm"
          className="ml-2 self-end"
        />
      )}
    </div>
  );
};
