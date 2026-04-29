/**
 * NotificationsPage.tsx — Updated in Step 4
 * - Receives new notifications in real-time via "new_notification" socket event
 * - New notifications slide in at the top without a page refresh
 */
import React, { useState, useEffect } from 'react';
import { Bell, MessageCircle, UserPlus, DollarSign, FileText, Loader } from 'lucide-react';
import { Card, CardBody } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Notification } from '../../types';
import { notificationService } from '../../services/notificationService';
import { useSocket } from '../../hooks/useSocket';

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading]             = useState(true);
  const { socket } = useSocket();

  // Initial fetch
  useEffect(() => {
    notificationService.getNotifications()
      .then(setNotifications)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Live push: new notification arrives while page is open
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notification: any) => {
      const normalised: Notification = {
        id:          notification._id || notification.id,
        recipientId: notification.recipientId,
        senderId:    notification.senderId,
        sender:      notification.sender,
        type:        notification.type,
        content:     notification.content,
        isRead:      false,
        link:        notification.link || '',
        createdAt:   notification.createdAt || new Date().toISOString(),
      };
      // Prepend so newest is at the top
      setNotifications(prev => [normalised, ...prev]);
    };

    socket.on('new_notification', handleNewNotification);
    return () => { socket.off('new_notification', handleNewNotification); };
  }, [socket]);

  const handleMarkAllRead = async () => {
    await notificationService.markAllRead().catch(() => {});
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleMarkRead = async (id: string) => {
    await notificationService.markRead(id).catch(() => {});
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const getIcon = (type: string) => ({
    message:    <MessageCircle size={16} className="text-primary-600" />,
    connection: <UserPlus size={16} className="text-secondary-600" />,
    investment: <DollarSign size={16} className="text-accent-600" />,
    deal:       <DollarSign size={16} className="text-green-600" />,
    document:   <FileText size={16} className="text-orange-500" />,
  }[type] ?? <Bell size={16} className="text-gray-600" />);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <Loader size={28} className="animate-spin text-primary-600" />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
              : 'All caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
            Mark all as read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Bell size={32} className="mx-auto mb-2 text-gray-300" />
          <p>No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map(n => (
            <Card
              key={n.id}
              className={`transition-colors duration-200 cursor-pointer ${n.isRead ? '' : 'bg-primary-50 border-primary-100'}`}
              onClick={() => !n.isRead && handleMarkRead(n.id)}
            >
              <CardBody className="flex items-start p-4">
                <Avatar
                  src={n.sender?.avatarUrl || ''}
                  alt={n.sender?.name || 'System'}
                  size="md"
                  className="flex-shrink-0 mr-4"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{n.sender?.name || 'Business Nexus'}</span>
                    {!n.isRead && <Badge variant="primary" size="sm" rounded>New</Badge>}
                  </div>
                  <p className="text-gray-600 mt-1">{n.content}</p>
                  <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                    {getIcon(n.type)}
                    <span>{new Date(n.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
