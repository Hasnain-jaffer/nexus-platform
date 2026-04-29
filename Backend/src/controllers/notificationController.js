const Notification = require('../models/Notification');

// ── GET /api/notifications ─────────────────────────────────────────────────
exports.getNotifications = async (req, res) => {
  const notifications = await Notification.find({ recipientId: req.user.id })
    .populate('senderId', 'name avatarUrl')
    .sort({ createdAt: -1 })
    .limit(50);

  res.status(200).json({ success: true, count: notifications.length, notifications });
};

// ── PATCH /api/notifications/:id/read ─────────────────────────────────────
exports.markRead = async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    return res.status(404).json({ success: false, message: 'Notification not found' });
  }

  if (notification.recipientId.toString() !== req.user.id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorised' });
  }

  notification.isRead = true;
  await notification.save();

  res.status(200).json({ success: true, notification });
};

// ── PATCH /api/notifications/mark-all-read ────────────────────────────────
exports.markAllRead = async (req, res) => {
  await Notification.updateMany({ recipientId: req.user.id, isRead: false }, { isRead: true });
  res.status(200).json({ success: true, message: 'All notifications marked as read' });
};

// ── GET /api/notifications/unread-count ───────────────────────────────────
exports.getUnreadCount = async (req, res) => {
  const count = await Notification.countDocuments({ recipientId: req.user.id, isRead: false });
  res.status(200).json({ success: true, count });
};
