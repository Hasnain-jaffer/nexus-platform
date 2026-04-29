import api, { normaliseId, normaliseList } from './api';
import { Message, ChatConversation } from '../types';

/** Normalise a raw API message → frontend Message shape */
const normaliseMessage = (raw: any): Message => ({
  ...normaliseId(raw),
  timestamp: raw.createdAt || raw.timestamp,
});

/** Normalise a raw API conversation → frontend ChatConversation */
const normaliseConversation = (raw: any): ChatConversation => ({
  id:          raw._id || `conv-${raw.partner?._id}`,
  partner:     normaliseId(raw.partner),
  lastMessage: raw.lastMessage ? normaliseMessage(raw.lastMessage) : undefined,
  updatedAt:   raw.lastMessage?.createdAt || new Date().toISOString(),
});

export const messageService = {
  /** POST /api/messages — send a new message */
  sendMessage: async (receiverId: string, content: string): Promise<Message> => {
    const { data } = await api.post('/messages', { receiverId, content });
    return normaliseMessage(data.message);
  },

  /** GET /api/messages/:userId — full thread */
  getConversation: async (userId: string): Promise<Message[]> => {
    const { data } = await api.get(`/messages/${userId}`);
    return normaliseList(data.messages).map(normaliseMessage);
  },

  /** GET /api/messages/conversations — sidebar list */
  getConversations: async (): Promise<ChatConversation[]> => {
    const { data } = await api.get('/messages/conversations');
    return data.conversations.map(normaliseConversation);
  },

  /** GET /api/messages/unread-count */
  getUnreadCount: async (): Promise<number> => {
    const { data } = await api.get('/messages/unread-count');
    return data.count;
  },
};
