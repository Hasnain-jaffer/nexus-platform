const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: [true, 'Message content is required'],
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
      trim: true,
    },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Index for fast conversation lookup
messageSchema.index({ senderId: 1, receiverId: 1 });
messageSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
