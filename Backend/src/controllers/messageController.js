const { body }           = require('express-validator');
const Message            = require('../models/Message');
const User               = require('../models/User');
const createNotification = require('../utils/createNotification');

// ── Validation ─────────────────────────────────────────────────────────────
exports.sendMessageRules = [
  body('receiverId').notEmpty().withMessage('Receiver ID is required'),
  body('content').trim().notEmpty().withMessage('Message content is required')
    .isLength({ max: 2000 }).withMessage('Message cannot exceed 2000 characters'),
];

// ── POST /api/messages ─────────────────────────────────────────────────────
exports.sendMessage = async (req, res) => {
  const { receiverId, content } = req.body;
  const senderId = req.user.id;

  // Make sure receiver exists
  const receiver = await User.findById(receiverId);
  if (!receiver) {
    return res.status(404).json({ success: false, message: 'Receiver not found' });
  }

  const message = await Message.create({ senderId, receiverId, content });

  // Real-time delivery via Socket.IO (io attached to req in server.js)
  if (req.io) {
    req.io.to(receiverId.toString()).emit('new_message', {
      id:         message._id,
      senderId:   message.senderId,
      receiverId: message.receiverId,
      content:    message.content,
      isRead:     message.isRead,
      createdAt:  message.createdAt,
    });
  }

  // Notification for the receiver
  await createNotification(
    req.io,
    receiverId,
    senderId,
    'message',
    `${req.user.name} sent you a message`,
    `/chat/${senderId}`
  );

  res.status(201).json({ success: true, message });
};

// ── GET /api/messages/:userId ──────────────────────────────────────────────
// Returns the full conversation thread between current user and :userId
exports.getConversation = async (req, res) => {
  const currentUserId = req.user.id;
  const otherUserId   = req.params.userId;

  const messages = await Message.find({
    $or: [
      { senderId: currentUserId, receiverId: otherUserId },
      { senderId: otherUserId,   receiverId: currentUserId },
    ],
  }).sort({ createdAt: 1 });

  // Mark received messages as read
  await Message.updateMany(
    { senderId: otherUserId, receiverId: currentUserId, isRead: false },
    { isRead: true }
  );

  res.status(200).json({ success: true, count: messages.length, messages });
};

// ── GET /api/messages/conversations ───────────────────────────────────────
// Returns one "latest message" per conversation partner — for the sidebar
exports.getConversations = async (req, res) => {
  const userId = req.user.id;

  // Aggregate: find all unique partners and the last message in each thread
  const conversations = await Message.aggregate([
    {
      $match: {
        $or: [
          { senderId:   { $eq: userId } },
          { receiverId: { $eq: userId } },
        ],
      },
    },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: {
          $cond: [
            { $eq: ['$senderId', userId] },
            '$receiverId',
            '$senderId',
          ],
        },
        lastMessage: { $first: '$$ROOT' },
      },
    },
    {
      $lookup: {
        from:         'users',
        localField:   '_id',
        foreignField: '_id',
        as:           'partner',
      },
    },
    { $unwind: '$partner' },
    {
      $project: {
        partner: {
          _id: 1, name: 1, avatarUrl: 1, role: 1, isOnline: 1,
          startupName: 1,
        },
        lastMessage: {
          _id: 1, content: 1, senderId: 1, receiverId: 1, isRead: 1, createdAt: 1,
        },
      },
    },
    { $sort: { 'lastMessage.createdAt': -1 } },
  ]);

  res.status(200).json({ success: true, conversations });
};

// ── GET /api/messages/unread-count ────────────────────────────────────────
exports.getUnreadCount = async (req, res) => {
  const count = await Message.countDocuments({
    receiverId: req.user.id,
    isRead: false,
  });
  res.status(200).json({ success: true, count });
};
