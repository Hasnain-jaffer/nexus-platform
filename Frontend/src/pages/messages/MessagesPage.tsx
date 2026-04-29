import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Loader } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ChatConversation } from '../../types';
import { messageService } from '../../services/messageService';
import { ChatUserList } from '../../components/chat/ChatUserList';

export const MessagesPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    messageService.getConversations()
      .then(setConversations)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) return null;

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <Loader size={28} className="animate-spin text-primary-600" />
    </div>
  );

  return (
    <div className="h-[calc(100vh-8rem)] bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden animate-fade-in">
      {conversations.length > 0 ? (
        <ChatUserList conversations={conversations} />
      ) : (
        <div className="h-full flex flex-col items-center justify-center p-8">
          <div className="bg-gray-100 p-6 rounded-full mb-4">
            <MessageCircle size={32} className="text-gray-400" />
          </div>
          <h2 className="text-xl font-medium text-gray-900">No messages yet</h2>
          <p className="text-gray-600 text-center mt-2">
            Start connecting with {user.role === 'entrepreneur' ? 'investors' : 'entrepreneurs'} to begin conversations
          </p>
          <button
            onClick={() => navigate(user.role === 'entrepreneur' ? '/investors' : '/entrepreneurs')}
            className="mt-4 text-sm font-medium text-primary-600 hover:text-primary-500 underline"
          >
            {user.role === 'entrepreneur' ? 'Browse Investors' : 'Browse Entrepreneurs'}
          </button>
        </div>
      )}
    </div>
  );
};
