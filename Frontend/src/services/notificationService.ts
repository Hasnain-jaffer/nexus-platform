import api, { normaliseId, normaliseList } from './api';
import { Notification } from '../types';

const normaliseNotification = (raw: any): Notification => ({
  ...normaliseId(raw),
  sender: raw.senderId?._id ? normaliseId(raw.senderId) : undefined,
  senderId: raw.senderId?._id || raw.senderId,
});

export const notificationService = {
  /** GET /api/notifications */
  getNotifications: async (): Promise<Notification[]> => {
    const { data } = await api.get('/notifications');
    return data.notifications.map(normaliseNotification);
  },

  /** GET /api/notifications/unread-count */
  getUnreadCount: async (): Promise<number> => {
    const { data } = await api.get('/notifications/unread-count');
    return data.count;
  },

  /** PATCH /api/notifications/:id/read */
  markRead: async (id: string): Promise<void> => {
    await api.patch(`/notifications/${id}/read`);
  },

  /** PATCH /api/notifications/mark-all-read */
  markAllRead: async (): Promise<void> => {
    await api.patch('/notifications/mark-all-read');
  },
};
