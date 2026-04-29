const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    type: {
      type: String,
      enum: ['message', 'connection', 'investment', 'deal', 'document', 'system'],
      required: true,
    },
    content: { type: String, required: true },
    isRead:   { type: Boolean, default: false },
    link:     { type: String, default: '' }, // e.g. /chat/userId
  },
  { timestamps: true }
);

notificationSchema.index({ recipientId: 1, isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
