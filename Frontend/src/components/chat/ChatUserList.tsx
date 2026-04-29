import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ChatConversation } from '../../types';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { useAuth } from '../../context/AuthContext';

interface Props {
  conversations: ChatConversation[];
}

export const ChatUserList: React.FC<Props> = ({ conversations }) => {
  const navigate = useNavigate();
  const { userId: activeUserId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();

  if (!currentUser) return null;

  return (
    <div className="bg-white border-r border-gray-200 w-full md:w-64 overflow-y-auto">
      <div className="py-4">
        <h2 className="px-4 text-lg font-semibold text-gray-800 mb-4">Messages</h2>

        <div className="space-y-1">
          {conversations.length > 0 ? (
            conversations.map(conv => {
              // FIX: was doing findUserById(participantId) from mock data array.
              // API now returns the populated partner object directly.
              const partner = conv.partner;
              if (!partner) return null;

              const isActive   = activeUserId === partner.id;
              const lastMsg    = conv.lastMessage;

              return (
                <div
                  key={conv.id}
                  className={`px-4 py-3 flex cursor-pointer transition-colors duration-200 ${
                    isActive
                      ? 'bg-primary-50 border-l-4 border-primary-600'
                      : 'hover:bg-gray-50 border-l-4 border-transparent'
                  }`}
                  onClick={() => navigate(`/chat/${partner.id}`)}
                >
                  <Avatar
                    src={partner.avatarUrl}
                    alt={partner.name}
                    size="md"
                    status={partner.isOnline ? 'online' : 'offline'}
                    className="mr-3 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <h3 className="text-sm font-medium text-gray-900 truncate">{partner.name}</h3>
                      {lastMsg && (
                        <span className="text-xs text-gray-500 ml-1 flex-shrink-0">
                          {formatDistanceToNow(new Date(lastMsg.timestamp), { addSuffix: false })}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      {lastMsg && (
                        <p className="text-xs text-gray-600 truncate">
                          {lastMsg.senderId === currentUser.id ? 'You: ' : ''}
                          {lastMsg.content}
                        </p>
                      )}
                      {lastMsg && !lastMsg.isRead && lastMsg.senderId !== currentUser.id && (
                        <Badge variant="primary" size="sm" rounded>New</Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-gray-500">No conversations yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
