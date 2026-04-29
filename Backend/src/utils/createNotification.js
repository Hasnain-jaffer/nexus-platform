/**
 * createNotification.js
 *
 * Helper to create a Notification record and push it to the recipient in real-time.
 * Used by every controller that needs to notify another user.
 *
 * Fixed in Step 4:
 *  - Event name changed from 'notification' → 'new_notification' to match frontend
 *  - Sender object is now populated in the socket payload so the Navbar badge
 *    and NotificationsPage can render the sender's name/avatar without a refetch
 */
const Notification = require('../models/Notification');
const User         = require('../models/User');

/**
 * @param {Object|null} io         - Socket.IO server instance (req.io)
 * @param {string}      recipientId
 * @param {string}      senderId
 * @param {string}      type       - 'message'|'connection'|'investment'|'deal'|'document'|'system'
 * @param {string}      content    - Human-readable description shown in the UI
 * @param {string}      [link]     - Frontend route to navigate to on click
 */
const createNotification = async (io, recipientId, senderId, type, content, link = '') => {
  try {
    const notification = await Notification.create({
      recipientId,
      senderId,
      type,
      content,
      link,
    });

    // Real-time push — only if Socket.IO is available
    if (io) {
      // Populate the sender so the client can render avatar + name immediately
      let sender = null;
      if (senderId) {
        sender = await User.findById(senderId).select('name avatarUrl role').lean();
        if (sender) sender.id = sender._id.toString();
      }

      // Emit 'new_notification' — matches the event name the frontend listens for
      io.to(recipientId.toString()).emit('new_notification', {
        id:          notification._id.toString(),
        recipientId: notification.recipientId.toString(),
        senderId:    senderId ? senderId.toString() : null,
        sender,
        type:        notification.type,
        content:     notification.content,
        link:        notification.link,
        isRead:      false,
        createdAt:   notification.createdAt,
      });
    }

    return notification;
  } catch (err) {
    // Non-fatal — a notification failure must never crash the main request
    console.error('[createNotification] Failed:', err.message);
  }
};

module.exports = createNotification;
